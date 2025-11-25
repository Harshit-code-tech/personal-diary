'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { ArrowLeft, Bell, Plus, Check, X, Calendar, Repeat, Trash2 } from 'lucide-react'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { PageLoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import toast from 'react-hot-toast'

type Reminder = {
  id: string
  title: string
  description: string | null
  reminder_date: string
  frequency: string
  is_completed: boolean
  completed_at: string | null
  entry_id: string | null
}

export default function RemindersPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_date: '',
    frequency: 'once'
  })

  useEffect(() => {
    if (user) {
      fetchReminders()
    }
  }, [user])

  const fetchReminders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user?.id)
        .order('reminder_date', { ascending: true })

      if (error) throw error
      setReminders(data || [])
    } catch (err) {
      console.error('Error fetching reminders:', err)
      toast.error('Failed to load reminders')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.reminder_date) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('reminders')
          .update({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            reminder_date: formData.reminder_date,
            frequency: formData.frequency
          })
          .eq('id', editingId)

        if (error) throw error
        toast.success('Reminder updated!')
      } else {
        const { error } = await supabase
          .from('reminders')
          .insert({
            user_id: user?.id,
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            reminder_date: formData.reminder_date,
            frequency: formData.frequency
          })

        if (error) throw error
        toast.success('Reminder created!')
      }

      setFormData({ title: '', description: '', reminder_date: '', frequency: 'once' })
      setEditingId(null)
      setShowAddModal(false)
      fetchReminders()
    } catch (err: any) {
      console.error('Error saving reminder:', err)
      toast.error(err.message || 'Failed to save reminder')
    }
  }

  const toggleComplete = async (id: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({
          is_completed: !isCompleted,
          completed_at: !isCompleted ? new Date().toISOString() : null
        })
        .eq('id', id)

      if (error) throw error
      toast.success(isCompleted ? 'Marked as incomplete' : 'Marked as complete!')
      fetchReminders()
    } catch (err) {
      console.error('Error toggling reminder:', err)
      toast.error('Failed to update reminder')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Reminder deleted!')
      fetchReminders()
    } catch (err) {
      console.error('Error deleting reminder:', err)
      toast.error('Failed to delete reminder')
    }
  }

  const startEdit = (reminder: Reminder) => {
    setEditingId(reminder.id)
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      reminder_date: reminder.reminder_date.split('T')[0],
      frequency: reminder.frequency
    })
    setShowAddModal(true)
  }

  const upcomingReminders = reminders.filter(r => !r.is_completed && new Date(r.reminder_date) >= new Date())
  const pastReminders = reminders.filter(r => !r.is_completed && new Date(r.reminder_date) < new Date())
  const completedReminders = reminders.filter(r => r.is_completed)

  if (authLoading || loading) {
    return <PageLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-midnight/80 border-b border-gold/20 dark:border-teal/20 shadow-xl">
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between max-w-7xl mx-auto gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Link
              href="/app"
              className="group flex items-center gap-2 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-all duration-300 shrink-0"
            >
              <div className="p-2 rounded-lg bg-charcoal/5 dark:bg-white/5 group-hover:bg-gold/10 dark:group-hover:bg-teal/10 transition-colors">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="font-bold text-sm sm:text-lg hidden xs:inline">Back</span>
            </Link>
            <Bell className="w-6 h-6 text-gold dark:text-teal shrink-0" />
            <span className="font-bold text-lg text-charcoal dark:text-white hidden md:inline truncate">Reminders</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
            <ThemeSwitcher />
            <button
              onClick={() => {
                setEditingId(null)
                setFormData({ title: '', description: '', reminder_date: '', frequency: 'once' })
                setShowAddModal(true)
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-xl text-xs sm:text-sm font-bold hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">New Reminder</span>
              <span className="xs:hidden">New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-charcoal via-charcoal to-charcoal/70 dark:from-teal dark:via-teal dark:to-teal/70 bg-clip-text text-transparent mb-2 sm:mb-3 leading-tight flex items-center gap-3 sm:gap-4">
            <Bell className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gold dark:text-teal" />
            Reminders
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-charcoal/70 dark:text-white/70 font-medium">
            Never forget important moments and tasks
          </p>
        </div>

        {reminders.length === 0 ? (
          <div className="bg-white dark:bg-graphite rounded-2xl shadow-xl p-16 text-center border border-gold/20 dark:border-teal/20">
            <div className="text-8xl mb-6">🔔</div>
            <h3 className="font-serif text-3xl font-bold mb-3 text-charcoal dark:text-teal">
              No Reminders Yet
            </h3>
            <p className="text-lg text-charcoal/70 dark:text-white/70 mb-8">
              Create your first reminder to stay on top of important dates and tasks
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-xl font-bold hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Reminder
            </button>
          </div>
        ) : (
          <>
            {/* Upcoming Reminders */}
            {upcomingReminders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-4">
                  Upcoming ({upcomingReminders.length})
                </h2>
                <div className="space-y-3">
                  {upcomingReminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onToggle={toggleComplete}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                      isPast={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Reminders */}
            {pastReminders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                  Overdue ({pastReminders.length})
                </h2>
                <div className="space-y-3">
                  {pastReminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onToggle={toggleComplete}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                      isPast={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Reminders */}
            {completedReminders.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
                  Completed ({completedReminders.length})
                </h2>
                <div className="space-y-3">
                  {completedReminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onToggle={toggleComplete}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                      isPast={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-graphite rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-6">
              {editingId ? 'Edit Reminder' : 'New Reminder'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                  placeholder="Reminder title"
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
                  placeholder="Additional details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Date & Time *
                </label>
                <input
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingId(null)
                    setFormData({ title: '', description: '', reminder_date: '', frequency: 'once' })
                  }}
                  className="flex-1 px-4 py-2.5 border border-charcoal/20 dark:border-white/20 rounded-lg font-medium hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-bold hover:shadow-lg transition-all"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function ReminderCard({ reminder, onToggle, onEdit, onDelete, isPast }: {
  reminder: Reminder
  onToggle: (id: string, isCompleted: boolean) => void
  onEdit: (reminder: Reminder) => void
  onDelete: (id: string) => void
  isPast: boolean
}) {
  const date = new Date(reminder.reminder_date)
  const isCompleted = reminder.is_completed

  return (
    <div className={`group bg-white dark:bg-graphite rounded-xl shadow-md p-5 border transition-all hover:shadow-lg ${
      isCompleted
        ? 'border-green-500/30 dark:border-green-400/30 opacity-60'
        : isPast
        ? 'border-red-500/30 dark:border-red-400/30'
        : 'border-gold/20 dark:border-teal/20'
    }`}>
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggle(reminder.id, isCompleted)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isCompleted
              ? 'bg-green-500 dark:bg-green-400 border-green-500 dark:border-green-400'
              : 'border-charcoal/30 dark:border-white/30 hover:border-gold dark:hover:border-teal'
          }`}
        >
          {isCompleted && <Check className="w-4 h-4 text-white dark:text-midnight" />}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-bold mb-1 ${
            isCompleted ? 'line-through text-charcoal/50 dark:text-white/50' : 'text-charcoal dark:text-white'
          }`}>
            {reminder.title}
          </h3>

          {reminder.description && (
            <p className="text-sm text-charcoal/60 dark:text-white/60 mb-2">
              {reminder.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-charcoal/50 dark:text-white/50">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {reminder.frequency !== 'once' && (
              <span className="flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                {reminder.frequency}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(reminder)}
            className="p-2 hover:bg-gold/10 dark:hover:bg-teal/10 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(reminder.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  )
}
