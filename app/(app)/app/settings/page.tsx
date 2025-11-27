'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastContainer'
import { User, Moon, Sun, Download, LogOut, Trash2, Shield, ArrowLeft, Mail, Lock, Bell } from 'lucide-react'
import Link from 'next/link'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import ReauthModal from '@/components/auth/ReauthModal'
import NotificationSettings from '@/components/settings/NotificationSettings'

export default function SettingsPage() {
  const toastNotify = useToast()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Change email states
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [changingEmail, setChangingEmail] = useState(false)
  
  // Change password states
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  
  // Reauthentication states
  const [showReauthModal, setShowReauthModal] = useState(false)
  const [reauthAction, setReauthAction] = useState<'changeEmail' | 'changePassword' | 'deleteAccount' | null>(null)
  
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
      toastNotify.success('Export Complete', 'Your data has been exported successfully')
    } catch (error) {
      console.error('Error exporting data:', error)
      toastNotify.error('Export Failed', 'Could not export data. Please try again')
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

    // Require reauthentication
    setReauthAction('deleteAccount')
    setShowReauthModal(true)
  }

  const handleReauthSuccess = async () => {
    if (reauthAction === 'deleteAccount') {
      await executeDeleteAccount()
    } else if (reauthAction === 'changeEmail') {
      await executeSendEmailOtp()
    } else if (reauthAction === 'changePassword') {
      await executeChangePassword()
    }
    setReauthAction(null)
  }

  const executeDeleteAccount = async () => {
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
      toastNotify.success('Account Deleted', 'Your account has been permanently deleted')
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      toastNotify.error('Delete Failed', 'Could not delete account. Please contact support')
    }
  }

  const handleStartChangeEmail = () => {
    setShowChangeEmail(true)
    setEmailOtpSent(false)
    setEmailOtp('')
    setNewEmail('')
  }

  const handleSendEmailOtp = () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toastNotify.error('Invalid Email', 'Please enter a valid email address')
      return
    }
    // Require reauthentication before sending OTP
    setReauthAction('changeEmail')
    setShowReauthModal(true)
  }

  const executeSendEmailOtp = async () => {
    setChangingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        {
          emailRedirectTo: `${window.location.origin}/app/settings`,
        }
      )

      if (error) throw error

      setEmailOtpSent(true)
      toastNotify.success('Verification Sent', 'Check your new email inbox for verification link')
    } catch (error: any) {
      toastNotify.error('Send Failed', error.message || 'Could not send verification email')
    } finally {
      setChangingEmail(false)
    }
  }

  const handleStartChangePassword = () => {
    setShowChangePassword(true)
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleChangePassword = () => {
    if (!newPassword || newPassword.length < 8) {
      toastNotify.error('Password Too Short', 'Password must be at least 8 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      toastNotify.error('Passwords Mismatch', 'The passwords you entered do not match')
      return
    }
    // Require reauthentication before changing password
    setReauthAction('changePassword')
    setShowReauthModal(true)
  }

  const executeChangePassword = async () => {
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toastNotify.success('Password Updated', 'Your password has been changed successfully')
      setShowChangePassword(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toastNotify.error('Update Failed', error.message || 'Could not update password')
    } finally {
      setChangingPassword(false)
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

            <div className="space-y-6">
              {/* Email Section */}
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Email Address
                </label>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="flex-1 px-4 py-3 bg-charcoal/5 dark:bg-white/5 border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white cursor-not-allowed"
                  />
                  <button
                    onClick={handleStartChangeEmail}
                    className="flex items-center gap-2 px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg font-semibold hover:bg-charcoal/5 dark:hover:bg-white/5 transition-all text-charcoal dark:text-white"
                  >
                    <Mail className="w-4 h-4" />
                    Change
                  </button>
                </div>
              </div>

              {/* Change Email Modal */}
              {showChangeEmail && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-charcoal dark:text-white">Change Email Address</h3>
                    <button
                      onClick={() => setShowChangeEmail(false)}
                      className="text-charcoal/60 dark:text-white/60 hover:text-charcoal dark:hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {!emailOtpSent ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                          New Email Address
                        </label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="new.email@example.com"
                          className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-white dark:bg-graphite text-charcoal dark:text-white"
                        />
                      </div>
                      <button
                        onClick={handleSendEmailOtp}
                        disabled={changingEmail}
                        className="w-full py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {changingEmail ? 'Sending...' : 'Send Verification Email'}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-charcoal dark:text-white">
                        A verification email has been sent to <strong>{newEmail}</strong>. 
                        Please check your inbox and click the link to confirm your new email address.
                      </p>
                      <p className="text-xs text-charcoal/60 dark:text-white/60">
                        You'll need to verify both your old and new email addresses.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Password Section */}
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Password
                </label>
                <div className="flex gap-3">
                  <input
                    type="password"
                    value="••••••••••••"
                    readOnly
                    className="flex-1 px-4 py-3 bg-charcoal/5 dark:bg-white/5 border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white cursor-not-allowed"
                  />
                  <button
                    onClick={handleStartChangePassword}
                    className="flex items-center gap-2 px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg font-semibold hover:bg-charcoal/5 dark:hover:bg-white/5 transition-all text-charcoal dark:text-white"
                  >
                    <Lock className="w-4 h-4" />
                    Change
                  </button>
                </div>
              </div>

              {/* Change Password Modal */}
              {showChangePassword && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-charcoal dark:text-white">Change Password</h3>
                    <button
                      onClick={() => setShowChangePassword(false)}
                      className="text-charcoal/60 dark:text-white/60 hover:text-charcoal dark:hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      minLength={8}
                      className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-white dark:bg-graphite text-charcoal dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      minLength={8}
                      className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-white dark:bg-graphite text-charcoal dark:text-white"
                    />
                  </div>

                  <p className="text-xs text-charcoal/60 dark:text-white/60">
                    Password must be at least 8 characters long
                  </p>

                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !newPassword || !confirmPassword}
                    className="w-full py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              )}
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
                  <p className="font-medium text-charcoal dark:text-white">Export Entries</p>
                  <p className="text-sm text-charcoal/60 dark:text-white/60">
                    Download your entries as Markdown or PDF
                  </p>
                </div>
                <Link
                  href="/app/export"
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 dark:bg-blue-400 text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-md"
                >
                  <Download className="w-5 h-5" />
                  Export
                </Link>
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-charcoal/10 dark:border-white/10">
                <div>
                  <p className="font-medium text-charcoal dark:text-white">Export All Data (JSON)</p>
                  <p className="text-sm text-charcoal/60 dark:text-white/60">
                    Download all your diary entries, people, and stories
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-6 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg font-semibold hover:bg-charcoal/5 dark:hover:bg-white/5 transition-all text-charcoal dark:text-white"
                >
                  <Download className="w-5 h-5" />
                  Export JSON
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

          {/* Notification Settings Section */}
          <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-6">
            <NotificationSettings />
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

      {/* Reauthentication Modal */}
      <ReauthModal
        isOpen={showReauthModal}
        onClose={() => {
          setShowReauthModal(false)
          setReauthAction(null)
        }}
        onSuccess={handleReauthSuccess}
        title="Confirm Your Identity"
        description="For your security, please re-enter your password to continue"
      />
    </div>
  )
}
