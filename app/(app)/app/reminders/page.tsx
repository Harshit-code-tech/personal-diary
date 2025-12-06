'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useReminderRateLimit } from '@/lib/hooks/useReminderRateLimit'
import Link from 'next/link'
import { ArrowLeft, Bell, Plus, Check, X, Calendar, Repeat, Trash2, Shield } from 'lucide-react'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { PageLoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { useToast } from '@/components/ui/ToastContainer'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

type Reminder = {
  id: string
  title: string
  description: string | null
  next_reminder_at: string
  reminder_type: 'once' | 'daily' | 'weekly' | 'custom'
  is_active: boolean
  created_at?: string
  updated_at?: string
  user_id?: string
}

export default function RemindersPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const toastNotify = useToast()
  const { data: rateLimit, refetch: refetchRateLimit } = useReminderRateLimit()
  const [loading, setLoading] = useState(true)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    next_reminder_at: '',
    reminder_type: 'once' as 'once' | 'daily' | 'weekly' | 'custom'
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
        .order('next_reminder_at', { ascending: true })

      if (error) throw error
      setReminders(data || [])
    } catch (err) {
      console.error('Error fetching reminders:', err)
      toastNotify.error('Load Failed', 'Could not load your reminders')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.next_reminder_at) {
      toastNotify.error('Missing Fields', 'Please fill in all required fields')
      return
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('reminders')
          .update({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            next_reminder_at: formData.next_reminder_at,
            reminder_type: formData.reminder_type
          })
          .eq('id', editingId)

        if (error) throw error
        toastNotify.success('Reminder Updated', 'Your reminder has been updated successfully')
      } else {
        const { error } = await supabase
          .from('reminders')
          .insert({
            user_id: user?.id,
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            next_reminder_at: formData.next_reminder_at,
            reminder_type: formData.reminder_type,
            is_active: true
          })

        if (error) throw error
        toastNotify.success('Reminder Created', 'Your new reminder has been added')
      }

      setFormData({ title: '', description: '', next_reminder_at: '', reminder_type: 'once' })
      setEditingId(null)
      setShowAddModal(false)
      fetchReminders()
      refetchRateLimit() // Refresh rate limit after creating/updating
    } catch (err: any) {
      console.error('Error saving reminder:', err)
      // Check if it's a rate limit error
      if (err.message?.includes('Rate limit exceeded')) {
        toastNotify.error('Rate Limit Exceeded', err.message)
      } else {
        toastNotify.error('Save Failed', err.message || 'Could not save reminder')
      }
    }
  }

  const toggleComplete = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({
          is_active: !isActive
        })
        .eq('id', id)

      if (error) throw error
      toastNotify.success('Reminder Updated', isActive ? 'Reminder deactivated' : 'Reminder activated! ✓')
      fetchReminders()
    } catch (err) {
      console.error('Error toggling reminder:', err)
      toastNotify.error('Update Failed', 'Could not update reminder')
    }
  }

  const handleDelete = (id: string) => {
    setReminderToDelete(id)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!reminderToDelete) return
    setDeleting(true)

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderToDelete)

      if (error) throw error
      toastNotify.success('Reminder Deleted', 'Your reminder has been removed')
      fetchReminders()
      setShowDeleteDialog(false)
      setReminderToDelete(null)
    } catch (err) {
      console.error('Error deleting reminder:', err)
      toastNotify.error('Delete Failed', 'Could not delete reminder')
    } finally {
      setDeleting(false)
    }
  }

  const startEdit = (reminder: Reminder) => {
    setEditingId(reminder.id)
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      next_reminder_at: reminder.next_reminder_at.slice(0, 16), // datetime-local format
      reminder_type: reminder.reminder_type
    })
    setShowAddModal(true)
  }

  const upcomingReminders = reminders.filter(r => r.is_active && new Date(r.next_reminder_at) >= new Date())
  const pastReminders = reminders.filter(r => r.is_active && new Date(r.next_reminder_at) < new Date())
  const inactiveReminders = reminders.filter(r => !r.is_active)

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
                if (rateLimit && !rateLimit.can_create_more) {
                  toastNotify.error('Limit Reached', 'You have reached your reminder creation limit. Please wait for the reset or deactivate some reminders.')
                  return
                }
                setEditingId(null)
                setFormData({ title: '', description: '', next_reminder_at: '', reminder_type: 'once' })
                setShowAddModal(true)
              }}
              disabled={rateLimit && !rateLimit.can_create_more}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                rateLimit && !rateLimit.can_create_more
                  ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gold dark:bg-teal text-white dark:text-midnight hover:shadow-xl'
              }`}
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

        {/* Rate Limit Status */}
        {rateLimit && (
          <div className="mb-6 p-4 bg-white dark:bg-graphite rounded-xl border border-charcoal/10 dark:border-white/10 shadow-md">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-gold dark:text-teal mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-charcoal dark:text-white">Usage Limits</h3>
                  {!rateLimit.can_create_more && (
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded">
                      LIMIT REACHED
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-charcoal/60 dark:text-white/60 mb-1">Today's Reminders</p>
                    <p className="font-bold text-charcoal dark:text-white">
                      {rateLimit.reminders_created_today} / {rateLimit.max_reminders_per_day}
                    </p>
                    <div className="mt-1 w-full bg-charcoal/10 dark:bg-white/10 rounded-full h-1.5">
                      <div 
                        className="bg-gold dark:bg-teal h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min((rateLimit.reminders_created_today / rateLimit.max_reminders_per_day) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-charcoal/60 dark:text-white/60 mb-1">Active Reminders</p>
                    <p className="font-bold text-charcoal dark:text-white">
                      {rateLimit.active_reminders} / {rateLimit.max_active_reminders}
                    </p>
                    <div className="mt-1 w-full bg-charcoal/10 dark:bg-white/10 rounded-full h-1.5">
                      <div 
                        className="bg-gold dark:bg-teal h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min((rateLimit.active_reminders / rateLimit.max_active_reminders) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-charcoal/50 dark:text-white/50 mt-2">
                  Limits reset at {new Date(rateLimit.reset_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        )}

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

            {/* Inactive Reminders */}
            {inactiveReminders.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-4">
                  Inactive ({inactiveReminders.length})
                </h2>
                <div className="space-y-3">
                  {inactiveReminders.map((reminder) => (
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
                  required
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
                  type="datetime-local"
                  value={formData.next_reminder_at}
                  onChange={(e) => setFormData({ ...formData, next_reminder_at: e.target.value })}
                  className="w-full px-4 py-2.5 bg-charcoal/5 dark:bg-white/5 border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Reminder Type
                </label>
                <select
                  value={formData.reminder_type}
                  onChange={(e) => setFormData({ ...formData, reminder_type: e.target.value as 'once' | 'daily' | 'weekly' | 'custom' })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-graphite border border-charcoal/10 dark:border-white/10 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal [&>option]:bg-white [&>option]:dark:bg-graphite [&>option]:text-charcoal [&>option]:dark:text-white"
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingId(null)
                    setFormData({ title: '', description: '', next_reminder_at: '', reminder_type: 'once' })
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

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setReminderToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Reminder?"
        message="This will permanently delete this reminder. This action cannot be undone."
        type="danger"
        loading={deleting}
      />
    </div>
  )
}

function ReminderCard({ reminder, onToggle, onEdit, onDelete, isPast }: {
  reminder: Reminder
  onToggle: (id: string, isActive: boolean) => void
  onEdit: (reminder: Reminder) => void
  onDelete: (id: string) => void
  isPast: boolean
}) {
  const date = new Date(reminder.next_reminder_at)
  const isActive = reminder.is_active

  return (
    <div className={`group bg-white dark:bg-graphite rounded-xl shadow-md p-5 border transition-all hover:shadow-lg ${
      !isActive
        ? 'border-gray-500/30 dark:border-gray-400/30 opacity-60'
        : isPast
        ? 'border-red-500/30 dark:border-red-400/30'
        : 'border-gold/20 dark:border-teal/20'
    }`}>
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggle(reminder.id, isActive)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isActive
              ? 'bg-gold dark:bg-teal border-gold dark:border-teal'
              : 'border-charcoal/30 dark:border-white/30 hover:border-gray-500 dark:hover:border-gray-400 bg-gray-200 dark:bg-gray-700'
          }`}
        >
          {isActive && <Check className="w-4 h-4 text-white dark:text-midnight" />}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-bold mb-1 ${
            !isActive ? 'line-through text-charcoal/50 dark:text-white/50' : 'text-charcoal dark:text-white'
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
            {reminder.reminder_type !== 'once' && (
              <span className="flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                {reminder.reminder_type}
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
