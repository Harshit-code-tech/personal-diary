'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { Book, ArrowLeft, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setSent(true)
      toast.success('Password reset link sent to your email!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-[#FFF5E6] dark:bg-midnight flex items-center justify-center px-4">
        <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold text-charcoal dark:text-teal">
            <Book className="w-6 h-6" />
            <span>My Diary</span>
          </Link>
          <ThemeSwitcher />
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-graphite rounded-2xl shadow-xl border border-charcoal/10 dark:border-white/10 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 dark:bg-teal/10 rounded-full mb-4">
              <Mail className="w-8 h-8 text-gold dark:text-teal" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-charcoal dark:text-white mb-2">
              Check Your Email
            </h1>
            <p className="text-charcoal/70 dark:text-white/70 mb-6">
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </p>
            <div className="space-y-3 text-sm text-left text-charcoal/60 dark:text-white/60 mb-6 bg-charcoal/5 dark:bg-white/5 rounded-lg p-4">
              <p>• Check your inbox and spam folder</p>
              <p>• Click the link in the email to reset your password</p>
              <p>• The link will expire in 15 minutes</p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-gold dark:text-teal hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FFF5E6] dark:bg-midnight flex items-center justify-center px-4">
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold text-charcoal dark:text-teal">
          <Book className="w-6 h-6" />
          <span>My Diary</span>
        </Link>
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-graphite rounded-2xl shadow-xl border border-charcoal/10 dark:border-white/10 p-8">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold text-charcoal dark:text-white mb-2">
            Reset Password
          </h1>
          <p className="text-charcoal/70 dark:text-white/70">
            Enter your email address and we&apos;ll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg bg-transparent text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-charcoal/70 dark:text-white/70 hover:text-charcoal dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </main>
  )
}
