'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { ArrowLeft, Target, Plus, CheckCircle2, Trash2, Calendar, TrendingUp, FileText, GripVertical } from 'lucide-react'
import { PageLoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { useToast } from '@/components/ui/ToastContainer'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'

type Milestone = {
  id: string
  title: string
  is_completed: boolean
  order_index: number | null
}

type MilestoneDraft = {
  id?: string
  title: string
  clientId: string
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

type LinkedEvent = {
  id: string
  title: string
  event_date: string | null
  category: string | null
}

type LinkedEntry = {
  id: string
  title: string | null
  entry_date: string | null
  mood: string | null
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

const DEFAULT_GOAL_REMINDER_SETTINGS = {
  enabled: true,
  leadDays: 3,
  reminderTime: '09:00'
}

const createMilestoneDraft = (title = '', id?: string): MilestoneDraft => ({
  id,
  title,
  clientId: id ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`),
})

const normalizeReminderTime = (value: string | null | undefined): string => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return DEFAULT_GOAL_REMINDER_SETTINGS.reminderTime
  }
  return value
}

const buildGoalTargetAt = (targetDate: string, reminderTime: string): Date | null => {
  const [hours, minutes] = reminderTime.split(':').map(value => Number(value))
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  const targetDateTime = new Date(`${targetDate}T${reminderTime}:00`)
  if (Number.isNaN(targetDateTime.getTime())) return null

  targetDateTime.setHours(hours, minutes, 0, 0)
  return targetDateTime
}

const buildGoalReminderAt = (targetDate: string | null, leadDays: number, reminderTime: string): Date | null => {
  if (!targetDate) return null

  const reminderDate = buildGoalTargetAt(targetDate, reminderTime)
  if (!reminderDate) return null

  reminderDate.setDate(reminderDate.getDate() - leadDays)
  return reminderDate
}

export default function GoalsPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const toastNotify = useToast()
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState<Goal[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [linkedEventsMap, setLinkedEventsMap] = useState<Record<string, LinkedEvent[]>>({})
  const [linkedEntriesMap, setLinkedEntriesMap] = useState<Record<string, LinkedEntry[]>>({})
  const [customCategory, setCustomCategory] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    target_date: '',
    milestones: [createMilestoneDraft()]
  })
  const [goalReminderSettings, setGoalReminderSettings] = useState(DEFAULT_GOAL_REMINDER_SETTINGS)
  const [bulkMilestones, setBulkMilestones] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const fetchGoals = useCallback(async () => {
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
            .select('id, title, is_completed, order_index')
            .eq('goal_id', goal.id)
            .order('order_index', { ascending: true })
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
      toastNotify.error('Load Failed', 'Could not load your goals')
    } finally {
      setLoading(false)
    }
  }, [user?.id, supabase, toastNotify])

  useEffect(() => {
    if (user) {
      fetchGoals()
    }
  }, [user, fetchGoals])

  const fetchGoalReminderSettings = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('goal_deadline_reminders_enabled, goal_deadline_reminder_days, goal_deadline_reminder_time')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error

      setGoalReminderSettings({
        enabled: data?.goal_deadline_reminders_enabled ?? DEFAULT_GOAL_REMINDER_SETTINGS.enabled,
        leadDays: data?.goal_deadline_reminder_days ?? DEFAULT_GOAL_REMINDER_SETTINGS.leadDays,
        reminderTime: normalizeReminderTime(data?.goal_deadline_reminder_time),
      })
    } catch (err) {
      console.error('Error fetching goal reminder settings:', err)
      setGoalReminderSettings(DEFAULT_GOAL_REMINDER_SETTINGS)
    }
  }, [user?.id, supabase])

  useEffect(() => {
    if (user) {
      fetchGoalReminderSettings()
    }
  }, [user, fetchGoalReminderSettings])

  // Fetch linked life events for all goals
  const fetchLinkedEvents = useCallback(async (goalIds: string[]) => {
    if (goalIds.length === 0) return
    try {
      const { data: links, error: linkError } = await supabase
        .from('life_event_goals')
        .select('goal_id, life_event_id')
        .in('goal_id', goalIds)

      if (linkError) throw linkError
      if (!links || links.length === 0) return

      const eventIds = [...new Set(links.map((l: any) => l.life_event_id))]
      const { data: events, error: eventsError } = await supabase
        .from('life_events')
        .select('id, title, event_date, category')
        .in('id', eventIds)

      if (eventsError) throw eventsError

      const map: Record<string, LinkedEvent[]> = {}
      for (const link of links) {
        const evt = events?.find((e: any) => e.id === link.life_event_id)
        if (evt) {
          if (!map[link.goal_id]) map[link.goal_id] = []
          map[link.goal_id].push(evt)
        }
      }
      setLinkedEventsMap(map)
    } catch (err) {
      console.error('Error fetching linked events:', err)
    }
  }, [supabase])

  useEffect(() => {
    if (goals.length > 0) {
      fetchLinkedEvents(goals.map(g => g.id))
    }
  }, [goals, fetchLinkedEvents])

  // Fetch linked journal entries for all goals
  const fetchLinkedEntries = useCallback(async (goalIds: string[]) => {
    if (goalIds.length === 0) return
    try {
      const { data: links, error: linkError } = await supabase
        .from('entry_goals')
        .select('goal_id, entry_id')
        .in('goal_id', goalIds)

      if (linkError) throw linkError
      if (!links || links.length === 0) return

      const entryIds = [...new Set(links.map((l: any) => l.entry_id))]
      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select('id, title, entry_date, mood')
        .in('id', entryIds)

      if (entriesError) throw entriesError

      const map: Record<string, LinkedEntry[]> = {}
      for (const link of links) {
        const entry = entries?.find((e: any) => e.id === link.entry_id)
        if (entry) {
          if (!map[link.goal_id]) map[link.goal_id] = []
          map[link.goal_id].push(entry)
        }
      }
      setLinkedEntriesMap(map)
    } catch (err) {
      console.error('Error fetching linked entries:', err)
    }
  }, [supabase])

  useEffect(() => {
    if (goals.length > 0) {
      fetchLinkedEntries(goals.map(g => g.id))
    }
  }, [goals, fetchLinkedEntries])

  const syncGoalReminder = useCallback(async (goalId: string, goalTitle: string, targetDate: string | null, isCompleted: boolean) => {
    if (!user?.id) return

    const marker = `goal_id:${goalId}`
    try {
      const { data: existing, error: existingError } = await supabase
        .from('reminders')
        .select('id')
        .eq('user_id', user.id)
        .ilike('description', `%${marker}%`)
        .limit(1)

      if (existingError) throw existingError

      const reminderTime = normalizeReminderTime(goalReminderSettings.reminderTime)
      const leadDays = Math.max(0, Math.floor(goalReminderSettings.leadDays))
      const targetAt = targetDate ? buildGoalTargetAt(targetDate, reminderTime) : null
      const existingId = existing?.[0]?.id

      if (!goalReminderSettings.enabled || !targetAt || isCompleted) {
        if (existingId) {
          await supabase.from('reminders').update({ is_active: false }).eq('id', existingId)
        }
        return
      }

      if (targetAt <= new Date()) {
        if (existingId) {
          await supabase.from('reminders').update({ is_active: false }).eq('id', existingId)
        }
        return
      }

      let reminderAt = buildGoalReminderAt(targetDate, leadDays, reminderTime)
      if (!reminderAt) {
        return
      }

      if (reminderAt <= new Date()) {
        reminderAt = new Date()
      }

      const payload = {
        user_id: user.id,
        title: `Goal deadline: ${goalTitle}`,
        description: `Goal deadline approaching for "${goalTitle}". (${marker})`,
        next_reminder_at: reminderAt.toISOString(),
        reminder_type: 'once',
        custom_days: null,
        repeat_until: null,
        is_active: true,
      }

      if (existingId) {
        const { error: updateError } = await supabase
          .from('reminders')
          .update(payload)
          .eq('id', existingId)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('reminders')
          .insert(payload)

        if (insertError) throw insertError
      }
    } catch (err) {
      console.error('Error syncing goal reminder:', err)
    }
  }, [goalReminderSettings, supabase, user?.id])

  useEffect(() => {
    if (!user || goals.length === 0) return

    goals.forEach((goal) => {
      syncGoalReminder(goal.id, goal.title, goal.target_date, goal.is_completed)
    })
  }, [goals, syncGoalReminder, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toastNotify.error('Missing Title', 'Please enter a goal title')
      return
    }

    try {
      // Use custom category if "other" is selected and custom value is provided
      const finalCategory = formData.category === 'other' && customCategory.trim()
        ? customCategory.trim()
        : formData.category

      if (editingId) {
        // Update goal
        const { error } = await supabase
          .from('goals')
          .update({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            category: finalCategory,
            target_date: formData.target_date || null
          })
          .eq('id', editingId)

        if (error) throw error

        // Update milestones
        const existingMilestones = goals.find(g => g.id === editingId)?.milestones || []

        const keptMilestones = formData.milestones.filter(m => m.title.trim())
        const keptIds = new Set(keptMilestones.filter(m => m.id).map(m => m.id as string))
        const toDelete = existingMilestones.filter(m => !keptIds.has(m.id))

        if (toDelete.length > 0) {
          await Promise.all(
            toDelete.map(m =>
              supabase.from('goal_milestones').delete().eq('id', m.id)
            )
          )
        }

        await Promise.all(
          keptMilestones.map((milestone, index) => {
            if (milestone.id) {
              return supabase
                .from('goal_milestones')
                .update({ title: milestone.title.trim(), order_index: index })
                .eq('id', milestone.id)
            }

            return supabase
              .from('goal_milestones')
              .insert({
                goal_id: editingId,
                title: milestone.title.trim(),
                is_completed: false,
                order_index: index,
              })
          })
        )

        const editingGoal = goals.find(g => g.id === editingId)
        await syncGoalReminder(
          editingId,
          formData.title.trim(),
          formData.target_date || null,
          editingGoal?.is_completed ?? false
        )

        toastNotify.success('Goal Updated', 'Your goal has been updated successfully')
      } else {
        // Create goal
        const { data: goalData, error: goalError } = await supabase
          .from('goals')
          .insert({
            user_id: user?.id,
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            category: finalCategory,
            target_date: formData.target_date || null,
            progress: 0,
            is_completed: false
          })
          .select()
          .single()

        if (goalError) throw goalError

        // Add milestones
        const milestones = formData.milestones.filter(m => m.title.trim())
        if (milestones.length > 0) {
          const { error: milestonesError } = await supabase
            .from('goal_milestones')
            .insert(
              milestones.map((m, index) => ({
                goal_id: goalData.id,
                title: m.title.trim(),
                is_completed: false,
                order_index: index,
              }))
            )

          if (milestonesError) throw milestonesError
        }

        await syncGoalReminder(
          goalData.id,
          formData.title.trim(),
          formData.target_date || null,
          false
        )

        toastNotify.success('Goal Created', 'Your new goal has been added')
      }

      resetForm()
      fetchGoals()
    } catch (err: any) {
      console.error('Error saving goal:', err)
      toastNotify.error('Save Failed', err.message || 'Could not save goal')
    }
  }

  const toggleMilestone = async (goalId: string, milestoneId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('goal_milestones')
        .update({ is_completed: !currentStatus })
        .eq('id', milestoneId)

      if (error) throw error
      toastNotify.success('Milestone Updated', currentStatus ? 'Milestone marked as incomplete' : 'Milestone completed! 🎉')
      fetchGoals()
    } catch (err) {
      console.error('Error toggling milestone:', err)
      toastNotify.error('Update Failed', 'Could not update milestone')
    }
  }

  const toggleGoalCompletion = async (goalId: string, currentStatus: boolean) => {
    try {
      const goal = goals.find(g => g.id === goalId)
      const { error } = await supabase
        .from('goals')
        .update({ 
          is_completed: !currentStatus,
          progress: !currentStatus ? 100 : 0
        })
        .eq('id', goalId)

      if (error) throw error
      await syncGoalReminder(
        goalId,
        goal?.title || 'Goal',
        goal?.target_date || null,
        !currentStatus
      )
      toastNotify.success(currentStatus ? 'Goal Reopened' : 'Goal Completed', currentStatus ? 'Your goal has been reopened' : 'Congratulations on completing your goal! 🎉')
      fetchGoals()
    } catch (err) {
      console.error('Error toggling goal:', err)
      toastNotify.error('Update Failed', 'Could not update goal status')
    }
  }

  const handleDelete = (id: string) => {
    setGoalToDelete(id)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!goalToDelete) return
    setDeleting(true)

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalToDelete)

      if (error) throw error
      if (user?.id) {
        await supabase
          .from('reminders')
          .delete()
          .eq('user_id', user.id)
          .ilike('description', `%goal_id:${goalToDelete}%`)
      }
      toastNotify.success('Goal Deleted', 'Your goal has been permanently removed')
      fetchGoals()
      setShowDeleteDialog(false)
      setGoalToDelete(null)
    } catch (err) {
      console.error('Error deleting goal:', err)
      toastNotify.error('Delete Failed', 'Could not delete goal')
    } finally {
      setDeleting(false)
    }
  }

  const startEdit = (goal: Goal) => {
    setEditingId(goal.id)
    const sortedMilestones = [...goal.milestones].sort((a, b) => {
      const aIndex = a.order_index ?? Number.MAX_SAFE_INTEGER
      const bIndex = b.order_index ?? Number.MAX_SAFE_INTEGER
      return aIndex - bIndex
    })
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      target_date: goal.target_date || '',
      milestones: sortedMilestones.length > 0 
        ? sortedMilestones.map(m => createMilestoneDraft(m.title, m.id))
        : [createMilestoneDraft()]
    })
    setDragIndex(null)
    setDragOverIndex(null)
    setShowAddModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'personal',
      target_date: '',
      milestones: [createMilestoneDraft()]
    })
    setEditingId(null)
    setCustomCategory('')
    setShowAddModal(false)
    setBulkMilestones('')
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [...formData.milestones, createMilestoneDraft()]
    })
  }

  const updateMilestone = (index: number, value: string) => {
    const newMilestones = [...formData.milestones]
    newMilestones[index] = { ...newMilestones[index], title: value }
    setFormData({ ...formData, milestones: newMilestones })
  }

  const removeMilestone = (index: number) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index)
    })
  }

  const addBulkMilestones = () => {
    // Normalize: convert literal escape sequences to actual whitespace
    const normalized = bulkMilestones
      .replace(/\\n/g, '\n')  // literal \n → actual newline
      .replace(/\\r/g, '\r')  // literal \r → actual carriage return
      .replace(/\\t/g, '\t')  // literal \t → actual tab

    // Split on any combination of newlines, commas, semicolons
    const items = normalized
      .split(/[\r\n,;]+/)
      .map(item => item.trim())
      .filter(Boolean)

    if (items.length === 0) return

    setFormData((prev) => {
      const existing = prev.milestones.filter(m => m.title.trim())
      const next = existing.length > 0 ? existing : []
      const added = items.map(title => createMilestoneDraft(title))
      return {
        ...prev,
        milestones: [...next, ...added],
      }
    })
    setBulkMilestones('')
  }

  const reorderMilestones = (startIndex: number, endIndex: number) => {
    const next = [...formData.milestones]
    const [moved] = next.splice(startIndex, 1)
    next.splice(endIndex, 0, moved)
    setFormData({ ...formData, milestones: next })
  }

  const handleMilestoneDragStart = (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
    setDragIndex(index)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  const handleMilestoneDragOver = (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOverIndex(index)
  }

  const handleMilestoneDrop = (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const fromIndex = dragIndex ?? Number(event.dataTransfer.getData('text/plain'))
    if (Number.isNaN(fromIndex) || fromIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }

    reorderMilestones(fromIndex, index)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleMilestoneDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
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
    <div className="min-h-screen book-page">
      {/* Header */}
      <header className="sticky top-0 z-50 vintage-header border-b border-charcoal/10 dark:border-white/10 shadow-sm">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between max-w-7xl mx-auto relative">
          <div className="flex-1 flex justify-start">
            <Link
              href="/app"
              className="p-2 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-gold dark:text-teal shrink-0" />
            <h1 className="font-serif text-lg sm:text-2xl font-bold text-charcoal dark:text-teal truncate">
              Goals
            </h1>
          </div>

          <div className="flex-1 flex justify-end items-center gap-2 shrink-0">
            <ThemeSwitcher />
            <button
              onClick={() => {
                resetForm()
                setShowAddModal(true)
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90 transition-all shadow-lg shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Goal</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Title & Stats */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-charcoal via-charcoal to-charcoal/70 dark:from-teal dark:via-teal dark:to-teal/70 bg-clip-text text-transparent mb-2 sm:mb-3 leading-tight flex items-center gap-3 sm:gap-4">
            <Target className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gold dark:text-teal" />
            Goals & Dreams
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-charcoal/70 dark:text-white/70 font-medium mb-3 sm:mb-4">
            Track your aspirations and celebrate your progress
          </p>
          
          <div className="flex gap-3 sm:gap-4">
            <div className="vintage-card rounded-xl shadow-lg px-4 sm:px-6 py-2.5 sm:py-3 border border-gold/20 dark:border-teal/20">
              <div className="text-2xl sm:text-3xl font-black text-gold dark:text-teal">{activeGoals.length}</div>
              <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60">Active Goals</div>
            </div>
            <div className="vintage-card rounded-xl shadow-lg px-4 sm:px-6 py-2.5 sm:py-3 border border-gold/20 dark:border-teal/20">
              <div className="text-2xl sm:text-3xl font-black text-green-600 dark:text-green-400">{completedGoals.length}</div>
              <div className="text-xs sm:text-sm text-charcoal/60 dark:text-white/60">Completed</div>
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
                  : 'vintage-card text-charcoal dark:text-white hover:bg-gold/10 dark:hover:bg-teal/10 border border-charcoal/10 dark:border-white/10'
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
                    : 'vintage-card text-charcoal dark:text-white hover:bg-gold/10 dark:hover:bg-teal/10 border border-charcoal/10 dark:border-white/10'
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
          <div className="vintage-card rounded-2xl shadow-xl p-16 text-center border border-gold/20 dark:border-teal/20">
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
              const orderedMilestones = [...goal.milestones].sort((a, b) => {
                const aIndex = a.order_index ?? Number.MAX_SAFE_INTEGER
                const bIndex = b.order_index ?? Number.MAX_SAFE_INTEGER
                return aIndex - bIndex
              })

              return (
                <div
                  key={goal.id}
                  className={`vintage-card rounded-xl shadow-lg p-6 border transition-all hover:shadow-xl ${
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
                        {orderedMilestones.length > 0 && (
                          <div className="space-y-1.5">
                            {orderedMilestones.map((milestone) => (
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

                        {/* Linked Life Events from Timeline */}
                        {linkedEventsMap[goal.id] && linkedEventsMap[goal.id].length > 0 && (
                          <div className="mt-3 pt-3 border-t border-charcoal/10 dark:border-white/10">
                            <div className="flex items-center gap-1.5 mb-2">
                              <TrendingUp className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                              <span className="text-xs font-bold text-charcoal/60 dark:text-white/60 uppercase tracking-wide">
                                Linked Timeline Events
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {linkedEventsMap[goal.id].map((evt) => (
                                <Link
                                  key={evt.id}
                                  href="/app/timeline"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-md text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-colors"
                                >
                                  <span className="truncate max-w-[120px] sm:max-w-[180px]">{evt.title}</span>
                                  {evt.event_date && (
                                    <span className="text-indigo-400 dark:text-indigo-500 shrink-0">
                                      · {new Date(evt.event_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Linked Journal Entries */}
                        {linkedEntriesMap[goal.id] && linkedEntriesMap[goal.id].length > 0 && (
                          <div className="mt-3 pt-3 border-t border-charcoal/10 dark:border-white/10">
                            <div className="flex items-center gap-1.5 mb-2">
                              <FileText className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                              <span className="text-xs font-bold text-charcoal/60 dark:text-white/60 uppercase tracking-wide">
                                Linked Journal Entries
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {linkedEntriesMap[goal.id].map((entry) => (
                                <Link
                                  key={entry.id}
                                  href={`/app/entry/${entry.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-md text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-800/30 transition-colors"
                                >
                                  <span className="truncate max-w-[120px] sm:max-w-[180px]">{entry.title || 'Untitled entry'}</span>
                                  {entry.entry_date && (
                                    <span className="text-emerald-400 dark:text-emerald-500 shrink-0">
                                      · {new Date(entry.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
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
          <div className="vintage-card rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
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
                    className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal [&>option]:bg-white [&>option]:dark:bg-midnight [&>option]:text-charcoal [&>option]:dark:text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                  {formData.category === 'other' && (
                    <input
                      type="text"
                      id="custom-goal-category"
                      name="customCategory"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category"
                      className="w-full mt-3 px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                    />
                  )}
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
                    <div
                      key={milestone.clientId}
                      className={`flex gap-2 items-center rounded-lg transition-colors ${
                        dragOverIndex === index
                          ? 'bg-gold/10 dark:bg-teal/10'
                          : ''
                      }`}
                      draggable
                      onDragStart={handleMilestoneDragStart(index)}
                      onDragOver={handleMilestoneDragOver(index)}
                      onDrop={handleMilestoneDrop(index)}
                      onDragEnd={handleMilestoneDragEnd}
                    >
                      <div className="p-2 cursor-grab active:cursor-grabbing text-charcoal/40 dark:text-white/40">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={milestone.title}
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
                <p className="mt-2 text-xs text-charcoal/50 dark:text-white/50">
                  Tip: drag the grip to reorder milestones.
                </p>
                <div className="mt-4 space-y-2">
                  <label className="block text-xs font-medium text-charcoal/60 dark:text-white/60">
                    Bulk add milestones (one per line or comma-separated)
                  </label>
                  <textarea
                    value={bulkMilestones}
                    onChange={(e) => setBulkMilestones(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                    placeholder="Launch MVP\nShip v2\nWrite documentation"
                  />
                  <button
                    type="button"
                    onClick={addBulkMilestones}
                    disabled={!bulkMilestones.trim()}
                    className="px-4 py-2 bg-charcoal/10 dark:bg-white/10 text-charcoal dark:text-white rounded-lg text-sm font-semibold hover:bg-charcoal/20 dark:hover:bg-white/20 transition-all disabled:opacity-50"
                  >
                    Add milestones
                  </button>
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

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setGoalToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Goal?"
        message="This will permanently delete this goal and all its milestones. This action cannot be undone."
        type="danger"
        loading={deleting}
      />
    </div>
  )
}
