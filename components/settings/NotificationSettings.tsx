'use client'

import { useState, useEffect } from 'react'
import { useNotificationPreferences } from '@/lib/hooks/useNotificationPreferences'
import { Bell, Clock, Calendar, Star, Zap, RefreshCw, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

const days = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
]

// Common timezones grouped by region
const timezones = [
  { label: 'Auto-detect', value: 'auto' },
  { label: '--- Asia ---', value: '', disabled: true },
  { label: 'India (IST)', value: 'Asia/Kolkata' },
  { label: 'Singapore', value: 'Asia/Singapore' },
  { label: 'Tokyo', value: 'Asia/Tokyo' },
  { label: 'Dubai', value: 'Asia/Dubai' },
  { label: 'Hong Kong', value: 'Asia/Hong_Kong' },
  { label: '--- Americas ---', value: '', disabled: true },
  { label: 'New York (EST)', value: 'America/New_York' },
  { label: 'Los Angeles (PST)', value: 'America/Los_Angeles' },
  { label: 'Chicago (CST)', value: 'America/Chicago' },
  { label: 'Denver (MST)', value: 'America/Denver' },
  { label: 'Toronto', value: 'America/Toronto' },
  { label: '--- Europe ---', value: '', disabled: true },
  { label: 'London (GMT)', value: 'Europe/London' },
  { label: 'Paris (CET)', value: 'Europe/Paris' },
  { label: 'Berlin', value: 'Europe/Berlin' },
  { label: 'Moscow', value: 'Europe/Moscow' },
  { label: '--- Pacific ---', value: '', disabled: true },
  { label: 'Sydney', value: 'Australia/Sydney' },
  { label: 'Auckland', value: 'Pacific/Auckland' },
  { label: '--- Other ---', value: '', disabled: true },
  { label: 'UTC', value: 'UTC' },
]

export default function NotificationSettings() {
  const { preferences, loading, saving, savePreferences, resetPreferences } = useNotificationPreferences()
  const [localPrefs, setLocalPrefs] = useState(preferences)

  // Sync localPrefs with preferences when they load
  useEffect(() => {
    setLocalPrefs(preferences)
  }, [preferences])

  const handleSave = async () => {
    const success = await savePreferences(localPrefs)
    if (success) {
      toast.success('Notification preferences saved!')
    } else {
      toast.error('Failed to save preferences')
    }
  }

  const handleReset = async () => {
    const success = await resetPreferences()
    if (success) {
      setLocalPrefs(preferences)
      toast.success('Reset to default preferences')
    } else {
      toast.error('Failed to reset preferences')
    }
  }

  const toggleDay = (day: string) => {
    setLocalPrefs(prev => ({
      ...prev,
      reminderDays: prev.reminderDays.includes(day)
        ? prev.reminderDays.filter(d => d !== day)
        : [...prev.reminderDays, day]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold dark:border-teal"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gold/10 dark:bg-teal/10 rounded-xl">
          <Bell className="w-6 h-6 text-gold dark:text-teal" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-charcoal dark:text-white">
            Notification Preferences
          </h2>
          <p className="text-charcoal/60 dark:text-white/60">
            Manage how and when you receive notifications
          </p>
        </div>
      </div>

      {/* Daily Reminder */}
      <div className="bg-white dark:bg-graphite rounded-xl p-6 border border-charcoal/10 dark:border-white/10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gold dark:text-teal mt-1" />
            <div>
              <h3 className="font-semibold text-charcoal dark:text-white mb-1">
                Daily Journal Reminder
              </h3>
              <p className="text-sm text-charcoal/60 dark:text-white/60">
                Get a daily reminder to write in your journal
              </p>
            </div>
          </div>
          <button
            onClick={() => setLocalPrefs(prev => ({ ...prev, dailyReminder: !prev.dailyReminder }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localPrefs.dailyReminder
                ? 'bg-gold dark:bg-teal'
                : 'bg-charcoal/20 dark:bg-white/20'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localPrefs.dailyReminder ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {localPrefs.dailyReminder && (
          <>
            {/* Reminder Time */}
            <div className="ml-8 mt-3">
              <label className="text-sm font-medium text-charcoal/70 dark:text-white/70 flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                Reminder Time
              </label>
              <input
                type="time"
                value={localPrefs.reminderTime}
                onChange={(e) => setLocalPrefs(prev => ({ ...prev, reminderTime: e.target.value }))}
                className="block w-full px-3 py-2 border border-charcoal/20 dark:border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal bg-white dark:bg-midnight text-charcoal dark:text-white"
              />
            </div>

            {/* Reminder Days */}
            <div className="ml-8 mt-3">
              <label className="text-sm font-medium text-charcoal/70 dark:text-white/70 flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Active Days
              </label>
              <div className="flex gap-2 flex-wrap">
                {days.map(day => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      localPrefs.reminderDays.includes(day.key)
                        ? 'bg-gold dark:bg-teal text-white'
                        : 'bg-charcoal/10 dark:bg-white/10 text-charcoal/70 dark:text-white/70'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timezone Selector */}
            <div className="ml-8 mt-3">
              <label className="text-sm font-medium text-charcoal/70 dark:text-white/70 flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4" />
                Timezone
              </label>
              <select
                value={localPrefs.timezone || 'auto'}
                onChange={(e) => {
                  const value = e.target.value
                  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
                  setLocalPrefs(prev => ({ 
                    ...prev, 
                    timezone: value === 'auto' ? detectedTimezone : value 
                  }))
                }}
                className="block w-full px-3 py-2 border border-charcoal/20 dark:border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal bg-white dark:bg-midnight text-charcoal dark:text-white"
              >
                {timezones.map((tz, idx) => (
                  <option 
                    key={idx} 
                    value={tz.value} 
                    disabled={tz.disabled}
                    className={tz.disabled ? 'font-semibold text-charcoal/50 dark:text-white/50' : ''}
                  >
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-charcoal/50 dark:text-white/50 mt-1">
                Current: <strong>{localPrefs.timezone || 'UTC'}</strong>
                {localPrefs.timezone === (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') && (
                  <span className="text-green-600 dark:text-green-400"> ✓ Auto-detected</span>
                )}
              </p>
            </div>

            <div className="ml-8 mt-3">
              <div className="bg-gray-50 dark:bg-midnight/50 rounded-lg p-4 border border-charcoal/10 dark:border-white/10">
                <p className="text-sm text-charcoal/70 dark:text-white/70">
                  📧 Daily reminders will be sent at <strong>{localPrefs.reminderTime}</strong> in your selected timezone on the days you choose.
                </p>
                <p className="text-xs text-charcoal/50 dark:text-white/50 mt-2">
                  💡 If auto-detection doesn&apos;t work, manually select your timezone from the dropdown above.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Weekly Summary */}
      <div className="bg-white dark:bg-graphite rounded-xl p-6 border border-charcoal/10 dark:border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gold dark:text-teal mt-1" />
            <div>
              <h3 className="font-semibold text-charcoal dark:text-white mb-1">
                Weekly Summary
              </h3>
              <p className="text-sm text-charcoal/60 dark:text-white/60">
                Receive a weekly summary of your journaling activity
              </p>
            </div>
          </div>
          <button
            onClick={() => setLocalPrefs(prev => ({ ...prev, weeklyReminder: !prev.weeklyReminder }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localPrefs.weeklyReminder
                ? 'bg-gold dark:bg-teal'
                : 'bg-charcoal/20 dark:bg-white/20'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localPrefs.weeklyReminder ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Milestone Notifications */}
      <div className="bg-white dark:bg-graphite rounded-xl p-6 border border-charcoal/10 dark:border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-gold dark:text-teal mt-1" />
            <div>
              <h3 className="font-semibold text-charcoal dark:text-white mb-1">
                Milestone Notifications
              </h3>
              <p className="text-sm text-charcoal/60 dark:text-white/60">
                Celebrate when you reach entry milestones (10, 50, 100 entries, etc.)
              </p>
            </div>
          </div>
          <button
            onClick={() => setLocalPrefs(prev => ({ ...prev, milestoneNotifications: !prev.milestoneNotifications }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localPrefs.milestoneNotifications
                ? 'bg-gold dark:bg-teal'
                : 'bg-charcoal/20 dark:bg-white/20'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localPrefs.milestoneNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Streak Notifications */}
      <div className="bg-white dark:bg-graphite rounded-xl p-6 border border-charcoal/10 dark:border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-gold dark:text-teal mt-1" />
            <div>
              <h3 className="font-semibold text-charcoal dark:text-white mb-1">
                Streak Notifications
              </h3>
              <p className="text-sm text-charcoal/60 dark:text-white/60">
                Get notified about your writing streaks and when they&apos;re about to break
              </p>
            </div>
          </div>
          <button
            onClick={() => setLocalPrefs(prev => ({ ...prev, streakNotifications: !prev.streakNotifications }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localPrefs.streakNotifications
                ? 'bg-gold dark:bg-teal'
                : 'bg-charcoal/20 dark:bg-white/20'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localPrefs.streakNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleReset}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 border-2 border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white rounded-xl font-semibold hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gold to-gold/80 dark:from-teal dark:to-teal/80 text-white dark:text-midnight rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-charcoal/70 dark:text-white/70 mb-2">
          <strong>✓ Your preferences are saved to the database.</strong>
        </p>
      </div>
    </div>
  )
}
