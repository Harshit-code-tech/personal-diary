'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { ArrowLeft, Target, Plus, CheckCircle2, Trash2, Calendar } from 'lucide-react'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { PageLoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import toast from 'react-hot-toast'

type Milestone = {
  id: string
  title: string
  is_completed: boolean
}

type Goal = {
  id: string
  title: string
  description: string | null
  category: string
  target_date: string | null
  progress: number
  is_completed: boolean
  milestones: Milestone[]
}

const categories = [
  { value: 'career', label: 'Career', icon: '💼', color: '#9C27B0' },
  { value: 'health', label: 'Health & Fitness', icon: '💪', color: '#4CAF50' },
  { value: 'education', label: 'Education', icon: '📚', color: '#FF9800' },
  { value: 'finance', label: 'Finance', icon: '💰', color: '#FFD700' },
  { value: 'relationships', label: 'Relationships', icon: '❤️', color: '#E91E63' },
  { value: 'creativity', label: 'Creativity', icon: '🎨', color: '#2196F3' },
  { value: 'personal', label: 'Personal Growth', icon: '🌱', color: '#00BCD4' },
  { value: 'other', label: 'Other', icon: '⭐', color: '#607D8B' }
]

export default function GoalsPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState<Goal[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    target_date: '',
    milestones: ['']
  })

  useEffect(() => {
    if (user) {
      fetchGoals()
    }
  }, [user])

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (goalsError) throw goalsError

      // Fetch milestones for each goal
      const goalsWithMilestones = await Promise.all(
        (goalsData || []).map(async (goal) => {
          const { data: milestonesData } = await supabase
            .from('goal_milestones')
            .select('id, title, is_completed')
            .eq('goal_id', goal.id)
            .order('created_at', { ascending: true })

          return {
            ...goal,
            milestones: milestonesData || []
          }
        })
      )

      setGoals(goalsWithMilestones)
    } catch (err) {
      console.error('Error fetching goals:', err)
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Please enter a goal title')
      return
    }

    try {
      if (editingId) {
        // Update goal
        const { error } = await supabase
          .from('goals')
          .update({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            category: formData.category,
            target_date: formData.target_date || null
          })
          .eq('id', editingId)

        if (error) throw error

        // Update milestones
        const existingMilestones = goals.find(g => g.id === editingId)?.milestones || []
        
        // Delete removed milestones
        const keptMilestones = formData.milestones.filter(m => m.trim())
        if (existingMilestones.length > keptMilestones.length) {
          const toDelete = existingMilestones.slice(keptMilestones.length)
          await Promise.all(
            toDelete.map(m =>
              supabase.from('goal_milestones').delete().eq('id', m.id)
            )
          )
        }

        // Update or insert milestones
        await Promise.all(
          formData.milestones
            .filter(m => m.trim())
            .map((milestone, index) => {
              if (existingMilestones[index]) {
                return supabase
                  .from('goal_milestones')
                  .update({ title: milestone.trim() })
                  .eq('id', existingMilestones[index].id)
              } else {
                return supabase
                  .from('goal_milestones')
                  .insert({
                    goal_id: editingId,
                    title: milestone.trim(),
                    is_completed: false
                  })
              }
            })
        )

        toast.success('Goal updated!')
      } else {
        // Create goal
        const { data: goalData, error: goalError } = await supabase
          .from('goals')
          .insert({
            user_id: user?.id,
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            category: formData.category,
            target_date: formData.target_date || null,
            progress: 0,
            is_completed: false
          })
          .select()
          .single()

        if (goalError) throw goalError

        // Add milestones
        const milestones = formData.milestones.filter(m => m.trim())
        if (milestones.length > 0) {
          const { error: milestonesError } = await supabase
            .from('goal_milestones')
            .insert(
              milestones.map(m => ({
                goal_id: goalData.id,
                title: m.trim(),
                is_completed: false
              }))
            )

          if (milestonesError) throw milestonesError
        }

        toast.success('Goal created!')
      }

      resetForm()
      fetchGoals()
    } catch (err: any) {
      console.error('Error saving goal:', err)
      toast.error(err.message || 'Failed to save goal')
    }
  }

  const toggleMilestone = async (goalId: string, milestoneId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('goal_milestones')
        .update({ is_completed: !currentStatus })
        .eq('id', milestoneId)

      if (error) throw error
      toast.success(currentStatus ? 'Milestone unchecked' : 'Milestone completed!')
      fetchGoals()
    } catch (err) {
      console.error('Error toggling milestone:', err)
      toast.error('Failed to update milestone')
    }
  }

  const toggleGoalCompletion = async (goalId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ 
          is_completed: !currentStatus,
          progress: !currentStatus ? 100 : 0
        })
        .eq('id', goalId)

      if (error) throw error
      toast.success(currentStatus ? 'Goal reopened' : 'Goal completed! 🎉')
      fetchGoals()
    } catch (err) {
      console.error('Error toggling goal:', err)
      toast.error('Failed to update goal')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Goal deleted!')
      fetchGoals()
    } catch (err) {
      console.error('Error deleting goal:', err)
      toast.error('Failed to delete goal')
    }
  }

  const startEdit = (goal: Goal) => {
    setEditingId(goal.id)
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      target_date: goal.target_date || '',
      milestones: goal.milestones.length > 0 
        ? goal.milestones.map(m => m.title)
        : ['']
    })
    setShowAddModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'personal',
      target_date: '',
      milestones: ['']
    })
    setEditingId(null)
    setShowAddModal(false)
  }

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [...formData.milestones, '']
    })
  }

  const updateMilestone = (index: number, value: string) => {
    const newMilestones = [...formData.milestones]
    newMilestones[index] = value
    setFormData({ ...formData, milestones: newMilestones })
  }

  const removeMilestone = (index: number) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index)
    })
  }

  const filteredGoals = goals.filter(goal => {
    const categoryMatch = selectedCategory === 'all' || goal.category === selectedCategory
    const completionMatch = showCompleted || !goal.is_completed
    return categoryMatch && completionMatch
  })

  const activeGoals = goals.filter(g => !g.is_completed)
  const completedGoals = goals.filter(g => g.is_completed)

  if (authLoading || loading) {
    return <PageLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-midnight/80 border-b border-gold/20 dark:border-teal/20 shadow-xl">
        <div className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
          <Link
            href="/app"
            className="group flex items-center gap-2.5 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-charcoal/5 dark:bg-white/5 group-hover:bg-gold/10 dark:group-hover:bg-teal/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">Back</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <button
              onClick={() => {
                resetForm()
                setShowAddModal(true)
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-xl font-bold hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              New Goal
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title & Stats */}
        <div className="mb-8">
          <h1 className="font-serif text-5xl font-black bg-gradient-to-r from-charcoal via-charcoal to-charcoal/70 dark:from-teal dark:via-teal dark:to-teal/70 bg-clip-text text-transparent mb-3 leading-tight flex items-center gap-4">
            <Target className="w-12 h-12 text-gold dark:text-teal" />
            Goals & Dreams
          </h1>
          <p className="text-lg text-charcoal/70 dark:text-white/70 font-medium mb-4">
            Track your aspirations and celebrate your progress
          </p>
          
          <div className="flex gap-4">
            <div className="bg-white dark:bg-graphite rounded-xl shadow-lg px-6 py-3 border border-gold/20 dark:border-teal/20">
              <div className="text-3xl font-black text-gold dark:text-teal">{activeGoals.length}</div>
              <div className="text-sm text-charcoal/60 dark:text-white/60">Active Goals</div>
            </div>
            <div className="bg-white dark:bg-graphite rounded-xl shadow-lg px-6 py-3 border border-gold/20 dark:border-teal/20">
              <div className="text-3xl font-black text-green-600 dark:text-green-400">{completedGoals.length}</div>
              <div className="text-sm text-charcoal/60 dark:text-white/60">Completed</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gold dark:bg-teal text-white dark:text-midnight shadow-lg'
                  : 'bg-white dark:bg-graphite text-charcoal dark:text-white hover:bg-gold/10 dark:hover:bg-teal/10 border border-charcoal/10 dark:border-white/10'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-gold dark:bg-teal text-white dark:text-midnight shadow-lg'
                    : 'bg-white dark:bg-graphite text-charcoal dark:text-white hover:bg-gold/10 dark:hover:bg-teal/10 border border-charcoal/10 dark:border-white/10'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-5 h-5 rounded border-charcoal/20 dark:border-white/20 text-gold dark:text-teal focus:ring-gold dark:focus:ring-teal"
            />
            <span className="text-sm font-medium text-charcoal dark:text-white">
              Show completed goals
            </span>
          </label>
        </div>

        {filteredGoals.length === 0 ? (
          <div className="bg-white dark:bg-graphite rounded-2xl shadow-xl p-16 text-center border border-gold/20 dark:border-teal/20">
            <div className="text-8xl mb-6">🎯</div>
            <h3 className="font-serif text-3xl font-bold mb-3 text-charcoal dark:text-teal">
              No Goals Yet
            </h3>
            <p className="text-lg text-charcoal/70 dark:text-white/70 mb-8">
              Start setting goals and tracking your progress
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-xl font-bold hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              Create First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGoals.map((goal) => {
              const cat = categories.find(c => c.value === goal.category)
              const targetDate = goal.target_date ? new Date(goal.target_date) : null
              const isOverdue = targetDate && targetDate < new Date() && !goal.is_completed

              return (
                <div
                  key={goal.id}
                  className={`bg-white dark:bg-graphite rounded-xl shadow-lg p-6 border transition-all hover:shadow-xl ${
                    goal.is_completed
                      ? 'border-green-200 dark:border-green-800'
                      : 'border-charcoal/10 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => toggleGoalCompletion(goal.id, goal.is_completed)}
                        className={`flex-shrink-0 mt-1 transition-colors ${
                          goal.is_completed
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-charcoal/30 dark:text-white/30 hover:text-gold dark:hover:text-teal'
                        }`}
                      >
                        <CheckCircle2 className="w-7 h-7" fill={goal.is_completed ? 'currentColor' : 'none'} />
                      </button>

                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-2 ${
                          goal.is_completed 
                            ? 'text-charcoal/50 dark:text-white/50 line-through'
                            : 'text-charcoal dark:text-white'
                        }`}>
                          {goal.title}
                        </h3>

                        {goal.description && (
                          <p className="text-sm text-charcoal/70 dark:text-white/70 mb-3 leading-relaxed">
                            {goal.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ backgroundColor: `${cat?.color}20`, color: cat?.color }}
                          >
                            {cat?.icon} {cat?.label}
                          </span>

                          {targetDate && (
                            <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                              isOverdue
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                : 'bg-charcoal/5 dark:bg-white/5 text-charcoal/60 dark:text-white/60'
                            }`}>
                              <Calendar className="w-3 h-3" />
                              {targetDate.toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-charcoal/60 dark:text-white/60 mb-1">
                            <span>Progress</span>
                            <span className="font-bold">{goal.progress}%</span>
                          </div>
                          <div className="h-2 bg-charcoal/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-gold to-gold/70 dark:from-teal dark:to-teal/70 transition-all"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Milestones */}
                        {goal.milestones.length > 0 && (
                          <div className="space-y-1.5">
                            {goal.milestones.map((milestone) => (
                              <label
                                key={milestone.id}
                                className="flex items-center gap-2 cursor-pointer group"
                              >
                                <input
                                  type="checkbox"
                                  checked={milestone.is_completed}
                                  onChange={() => toggleMilestone(goal.id, milestone.id, milestone.is_completed)}
                                  className="w-4 h-4 rounded border-charcoal/20 dark:border-white/20 text-gold dark:text-teal focus:ring-gold dark:focus:ring-teal"
                                />
                                <span className={`text-sm ${
                                  milestone.is_completed
                                    ? 'text-charcoal/50 dark:text-white/50 line-through'
                                    : 'text-charcoal dark:text-white group-hover:text-gold dark:group-hover:text-teal'
                                }`}>
                                  {milestone.title}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(goal)}
                        className="p-2 hover:bg-gold/10 dark:hover:bg-teal/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-graphite rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-6">
              {editingId ? 'Edit Goal' : 'Create New Goal'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                  placeholder="What do you want to achieve?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                  rows={3}
                  placeholder="Why is this goal important to you?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-charcoal dark:text-white">
                    Milestones
                  </label>
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="text-sm text-gold dark:text-teal hover:underline font-medium"
                  >
                    + Add Milestone
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.milestones.map((milestone, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={milestone}
                        onChange={(e) => updateMilestone(index, e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                        placeholder={`Milestone ${index + 1}`}
                      />
                      {formData.milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2.5 border border-charcoal/20 dark:border-white/20 rounded-lg font-medium hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  {editingId ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
