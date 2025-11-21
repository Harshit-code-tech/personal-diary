'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    theme: 'light',
    email_reminders_enabled: false,
    email_frequency: 'daily',
    email_time: '20:00:00',
  })

  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        })

      if (error) throw error
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper dark:bg-midnight flex items-center justify-center">
        <div className="text-charcoal dark:text-white">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-midnight transition-colors duration-300">
      {/* Navigation */}
      <nav className="border-b border-charcoal/10 dark:border-white/10 bg-white dark:bg-graphite">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/app" className="font-serif text-2xl font-bold text-charcoal dark:text-teal">
            Personal Diary
          </Link>
          
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Link href="/app" className="hover:text-gold dark:hover:text-teal transition-colors">
              Entries
            </Link>
            <Link href="/app/calendar" className="hover:text-gold dark:hover:text-teal transition-colors">
              Calendar
            </Link>
            <Link href="/app/settings" className="text-gold dark:text-teal font-semibold">
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm border border-charcoal/20 dark:border-white/20 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-serif text-4xl font-bold text-charcoal dark:text-teal mb-8">
            Settings
          </h1>

          <div className="bg-white dark:bg-graphite rounded-lg shadow-sm p-8 space-y-6">
            {/* Email Reminders */}
            <div>
              <h2 className="font-serif text-xl font-semibold text-charcoal dark:text-white mb-4">
                Email Reminders
              </h2>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.email_reminders_enabled}
                    onChange={(e) => setSettings({ ...settings, email_reminders_enabled: e.target.checked })}
                    className="w-5 h-5 text-gold dark:text-teal"
                  />
                  <span className="text-charcoal dark:text-white">Enable email reminders</span>
                </label>

                {settings.email_reminders_enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                        Frequency
                      </label>
                      <select
                        value={settings.email_frequency}
                        onChange={(e) => setSettings({ ...settings, email_frequency: e.target.value })}
                        className="w-full px-4 py-2 bg-paper dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        value={settings.email_time}
                        onChange={(e) => setSettings({ ...settings, email_time: e.target.value })}
                        className="w-full px-4 py-2 bg-paper dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-charcoal/10 dark:border-white/10">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-6 bg-white dark:bg-graphite rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-xl font-semibold text-charcoal dark:text-white mb-4">
              Account
            </h2>
            <p className="text-charcoal/70 dark:text-white/70 mb-4">
              Signed in as: <strong>{user?.email}</strong>
            </p>
            <button
              onClick={handleSignOut}
              className="px-6 py-2 border-2 border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
