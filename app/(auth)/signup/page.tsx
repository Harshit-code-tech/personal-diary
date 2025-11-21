'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const checkPasswordStrength = (pwd: string) => {
    if (pwd.length < 8) return 'Too Short'
    
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    
    if (strength < 2) return 'Weak'
    if (strength < 4) return 'Medium'
    return 'Strong'
  }

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd)
    setPasswordStrength(checkPasswordStrength(pwd))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain an uppercase letter')
      return
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain a number')
      return
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('Password must contain a special character')
      return
    }

    setLoading(true)

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signupError) throw signupError

      // Check if email confirmation is required
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('This email is already registered. Please sign in instead.')
        setLoading(false)
        return
      }

      // Success - redirect to verification page
      router.push('/verify-email')
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'Strong': return 'text-green-600 dark:text-green-400'
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'Weak': return 'text-orange-600 dark:text-orange-400'
      default: return 'text-red-600 dark:text-red-400'
    }
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="text-charcoal/60 dark:text-white/60 hover:text-gold dark:hover:text-teal transition-colors inline-flex items-center gap-2"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-graphite rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-graphite">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">📔</div>
            <h1 className="font-serif text-3xl font-bold text-charcoal dark:text-teal mb-2">
              Create Account
            </h1>
            <p className="text-charcoal/60 dark:text-white/60">
              Start your journaling journey
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white/90 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-midnight border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal focus:border-transparent text-charcoal dark:text-white placeholder-charcoal/40 dark:placeholder-white/40"
                disabled={loading}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white/90 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-midnight border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal focus:border-transparent text-charcoal dark:text-white placeholder-charcoal/40 dark:placeholder-white/40"
                disabled={loading}
                required
              />
              {password && (
                <p className={`text-sm mt-2 font-medium ${getStrengthColor()}`}>
                  Strength: {passwordStrength}
                </p>
              )}
              <p className="text-xs text-charcoal/60 dark:text-white/60 mt-2">
                Must be 8+ characters with uppercase, number & special character
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white/90 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-midnight border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal focus:border-transparent text-charcoal dark:text-white placeholder-charcoal/40 dark:placeholder-white/40"
                disabled={loading}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-charcoal/60 dark:text-white/60 text-sm">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-gold dark:text-teal font-semibold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-charcoal/50 dark:text-white/50">
            By signing up, you'll receive a confirmation email to verify your account
          </p>
        </div>
      </div>
    </div>
  )
}
