import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export interface NotificationPreferences {
  dailyReminder: boolean
  weeklyReminder: boolean
  milestoneNotifications: boolean
  streakNotifications: boolean
  reminderTime: string // HH:MM format
  reminderDays: string[] // ['monday', 'tuesday', ...]
}

const defaultPreferences: NotificationPreferences = {
  dailyReminder: false,
  weeklyReminder: false,
  milestoneNotifications: true,
  streakNotifications: true,
  reminderTime: '20:00',
  reminderDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  // Load preferences from database
  useEffect(() => {
    if (!user) return

    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('email_reminders_enabled, weekly_summary_enabled, inactivity_emails_enabled, milestone_notifications_enabled, reminder_time, reminder_days, timezone')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        if (data) {
          // Map database columns to UI state
          setPreferences({
            dailyReminder: data.email_reminders_enabled ?? false,
            weeklyReminder: data.weekly_summary_enabled ?? false,
            milestoneNotifications: data.milestone_notifications_enabled ?? true,
            streakNotifications: data.inactivity_emails_enabled ?? true,
            reminderTime: data.reminder_time ?? '20:00',
            reminderDays: data.reminder_days ?? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          })
        } else {
          // No settings row exists yet, create one with defaults
          const { error: insertError } = await supabase
            .from('user_settings')
            .insert({ user_id: user.id })
          
          if (insertError) {
            console.error('Failed to create user settings:', insertError)
          }
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [user, supabase])

  // Save preferences to database
  const savePreferences = async (newPreferences: Partial<NotificationPreferences>): Promise<boolean> => {
    if (!user) return false

    setSaving(true)
    try {
      const updated = { ...preferences, ...newPreferences }

      // Use UPSERT to handle both insert and update
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          email_reminders_enabled: updated.dailyReminder,
          weekly_summary_enabled: updated.weeklyReminder,
          inactivity_emails_enabled: updated.streakNotifications,
          milestone_notifications_enabled: updated.milestoneNotifications,
          reminder_time: updated.reminderTime,
          reminder_days: updated.reminderDays,
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      // Reload from database to ensure UI stays in sync
      const { data: reloaded } = await supabase
        .from('user_settings')
        .select('email_reminders_enabled, weekly_summary_enabled, inactivity_emails_enabled, milestone_notifications_enabled, reminder_time, reminder_days, timezone')
        .eq('user_id', user.id)
        .maybeSingle()

      if (reloaded) {
        setPreferences({
          dailyReminder: reloaded.email_reminders_enabled ?? false,
          weeklyReminder: reloaded.weekly_summary_enabled ?? false,
          milestoneNotifications: reloaded.milestone_notifications_enabled ?? true,
          streakNotifications: reloaded.inactivity_emails_enabled ?? true,
          reminderTime: reloaded.reminder_time ?? '20:00',
          reminderDays: reloaded.reminder_days ?? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        })
      }

      return true
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
      return false
    } finally {
      setSaving(false)
    }
  }

  // Reset to defaults
  const resetPreferences = async (): Promise<boolean> => {
    if (!user) return false

    setSaving(true)
    try {
      // Use UPSERT to handle both insert and update
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          email_reminders_enabled: defaultPreferences.dailyReminder,
          weekly_summary_enabled: defaultPreferences.weeklyReminder,
          inactivity_emails_enabled: defaultPreferences.streakNotifications,
          milestone_notifications_enabled: defaultPreferences.milestoneNotifications,
          reminder_time: defaultPreferences.reminderTime,
          reminder_days: defaultPreferences.reminderDays,
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      // Update local state
      setPreferences(defaultPreferences)

      return true
    } catch (error) {
      console.error('Failed to reset notification preferences:', error)
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    preferences,
    loading,
    saving,
    savePreferences,
    resetPreferences,
  }
}
