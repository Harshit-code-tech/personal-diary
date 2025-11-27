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

  // Load preferences from localStorage (for now, can be DB later)
  useEffect(() => {
    if (!user) return

    try {
      const stored = localStorage.getItem(`notif_prefs_${user.id}`)
      if (stored) {
        setPreferences(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Save preferences
  const savePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return

    setSaving(true)
    try {
      const updated = { ...preferences, ...newPreferences }
      setPreferences(updated)
      localStorage.setItem(`notif_prefs_${user.id}`, JSON.stringify(updated))
      return true
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
      return false
    } finally {
      setSaving(false)
    }
  }

  // Reset to defaults
  const resetPreferences = async () => {
    if (!user) return

    setSaving(true)
    try {
      setPreferences(defaultPreferences)
      localStorage.setItem(`notif_prefs_${user.id}`, JSON.stringify(defaultPreferences))
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
