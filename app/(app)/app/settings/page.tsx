'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { User, Moon, Sun, Download, LogOut, Trash2, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      
      // Get theme from localStorage
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme)
      } else {
        // Check system preference
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setTheme(isDark ? 'dark' : 'light')
      }
      
      setLoading(false)
    }
  }, [user])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    // Apply theme
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleExportData = async () => {
    try {
      // Fetch all user data
      const [entriesRes, peopleRes, storiesRes] = await Promise.all([
        supabase.from('entries').select('*').eq('user_id', user?.id),
        supabase.from('people').select('*').eq('user_id', user?.id),
        supabase.from('stories').select('*').eq('user_id', user?.id),
      ])

      const exportData = {
        entries: entriesRes.data || [],
        people: peopleRes.data || [],
        stories: storiesRes.data || [],
        exportDate: new Date().toISOString(),
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `diary-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Data exported successfully!')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data. Please try again.')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    try {
      // Delete all user data
      await Promise.all([
        supabase.from('entries').delete().eq('user_id', user?.id),
        supabase.from('people').delete().eq('user_id', user?.id),
        supabase.from('stories').delete().eq('user_id', user?.id),
        supabase.from('folders').delete().eq('user_id', user?.id),
      ])

      // Sign out
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account. Please contact support.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight flex items-center justify-center">
        <div className="text-charcoal dark:text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF5E6]/80 dark:bg-midnight/80 border-b border-charcoal/10 dark:border-white/10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/app"
              className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-charcoal dark:text-white" />
            </Link>
            <h1 className="font-serif text-3xl font-bold text-charcoal dark:text-teal">
              Settings
            </h1>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-gold dark:text-teal" />
              <h2 className="text-xl font-semibold text-charcoal dark:text-white">
                Profile
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-3 bg-charcoal/5 dark:bg-white/5 border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white cursor-not-allowed"
              />
              <p className="text-xs text-charcoal/60 dark:text-white/60 mt-2">
                Your email cannot be changed
              </p>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              {theme === 'dark' ? (
                <Moon className="w-6 h-6 text-gold dark:text-teal" />
              ) : (
                <Sun className="w-6 h-6 text-gold dark:text-teal" />
              )}
              <h2 className="text-xl font-semibold text-charcoal dark:text-white">
                Appearance
              </h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-charcoal dark:text-white">Theme</p>
                <p className="text-sm text-charcoal/60 dark:text-white/60">
                  Choose between light and dark mode
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-md"
              >
                {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
              </button>
            </div>
          </div>

          {/* Data & Privacy Section */}
          <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-gold dark:text-teal" />
              <h2 className="text-xl font-semibold text-charcoal dark:text-white">
                Data & Privacy
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-charcoal/10 dark:border-white/10">
                <div>
                  <p className="font-medium text-charcoal dark:text-white">Export Data</p>
                  <p className="text-sm text-charcoal/60 dark:text-white/60">
                    Download all your diary entries, people, and stories
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-6 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg font-semibold hover:bg-charcoal/5 dark:hover:bg-white/5 transition-all text-charcoal dark:text-white"
                >
                  <Download className="w-5 h-5" />
                  Export
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-charcoal dark:text-white">Data Storage</p>
                  <p className="text-sm text-charcoal/60 dark:text-white/60">
                    Your data is securely stored and encrypted
                  </p>
                </div>
                <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium">
                  Secure
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions Section */}
          <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <LogOut className="w-6 h-6 text-gold dark:text-teal" />
              <h2 className="text-xl font-semibold text-charcoal dark:text-white">
                Account Actions
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-charcoal/10 dark:border-white/10">
                <div>
                  <p className="font-medium text-charcoal dark:text-white">Sign Out</p>
                  <p className="text-sm text-charcoal/60 dark:text-white/60">
                    Sign out of your account
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-6 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg font-semibold hover:bg-charcoal/5 dark:hover:bg-white/5 transition-all text-charcoal dark:text-white"
                >
                  Sign Out
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
                  <p className="text-sm text-charcoal/60 dark:text-white/60">
                    Permanently delete your account and all data
                  </p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    showDeleteConfirm
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'border border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  <Trash2 className="w-5 h-5" />
                  {showDeleteConfirm ? 'Confirm Delete' : 'Delete Account'}
                </button>
              </div>
              {showDeleteConfirm && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    ⚠️ This action cannot be undone. All your entries, people, stories, and data will be permanently deleted. Click "Confirm Delete" again to proceed.
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* App Info */}
          <div className="text-center py-6">
            <p className="text-sm text-charcoal/60 dark:text-white/60">
              Personal Diary v1.0.0
            </p>
            <p className="text-xs text-charcoal/40 dark:text-white/40 mt-1">
              Made with ❤️ for your memories
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
