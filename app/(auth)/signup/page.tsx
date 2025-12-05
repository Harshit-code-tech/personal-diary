'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { Book } from 'lucide-react'
import PasswordStrengthIndicator from '@/components/ui/PasswordStrengthIndicator'
import { useFormValidation, commonRules } from '@/lib/hooks/useFormValidation'
import { useCSRFToken } from '@/lib/hooks/useCSRFToken'
import { authLimiter } from '@/lib/rate-limit'
import { retryWithJitter } from '@/lib/retry-utils'

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const { csrfFetch, hasToken } = useCSRFToken()
  
  const { errors, touched, handleBlur, handleChange, validateAll } = useFormValidation({
    username: [
      {
        required: true,
        message: 'Username is required',
      },
      {
        minLength: 3,
        message: 'Username must be at least 3 characters',
      },
    ],
    email: commonRules.email,
    password: commonRules.passwordWithStrength,
    confirmPassword: [
      {
        required: true,
        message: 'Please confirm your password',
      },
      {
        custom: (value) => value === password,
        message: 'Passwords do not match',
      },
    ],
  })

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate all fields
    if (!validateAll({ username, email, password, confirmPassword })) {
      return
    }

    // Check rate limit on client side
    const rateLimitResult = await authLimiter.check(`signup-${email}`)
    if (!rateLimitResult.success) {
      const resetTime = new Date(rateLimitResult.reset)
      setError(
        `Too many signup attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`
      )
      return
    }

    setLoading(true)

    try {
      // Use retry logic for network resilience
      const { data, error: signupError } = await retryWithJitter(
        () => supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              username: username,
              display_name: username,
            },
          },
        }),
        {
          maxAttempts: 3,
          initialDelayMs: 300,
          maxDelayMs: 2000,
        }
      )

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
      console.error('Signup error:', err)
      
      // Provide helpful error messages
      if (err.message?.includes('confirmation email')) {
        setError(
          'Account created but confirmation email failed to send. ' +
          'Please contact support or try signing in directly if email confirmation is disabled.'
        )
      } else if (err.message?.includes('already registered') || err.message?.includes('already exists')) {
        setError('This email is already registered. Please sign in instead.')
      } else if (err.message?.includes('Invalid email')) {
        setError('Please enter a valid email address.')
      } else if (err.message?.includes('Password')) {
        setError('Password does not meet requirements. Use at least 8 characters with uppercase, number, and special character.')
      } else {
        setError(err.message || 'Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight flex items-center justify-center p-4">
      {/* Logo/Brand with Theme Switcher */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold text-charcoal dark:text-teal">
          <Book className="w-6 h-6" />
          <span>Noted.</span>
        </Link>
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md mt-8">

        {/* Card */}
        <div className="bg-white dark:bg-graphite rounded-2xl shadow-xl p-8 border border-charcoal/10 dark:border-white/10">
          {/* Header */}
          <div className="text-center mb-8">
            <Book className="w-16 h-16 text-gold dark:text-teal mx-auto mb-3" />
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
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-charcoal dark:text-white/90 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  handleChange('username', e.target.value)
                }}
                onBlur={(e) => handleBlur('username', e.target.value)}
                placeholder="Your username"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-midnight border-2 rounded-lg focus:outline-none focus:ring-2 transition-all text-charcoal dark:text-white placeholder-charcoal/40 dark:placeholder-white/40 ${
                  touched.username && errors.username
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900'
                    : touched.username && !errors.username && username
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-900'
                    : 'border-gray-200 dark:border-gray-700 focus:ring-gold dark:focus:ring-teal focus:border-gold dark:focus:border-teal'
                }`}
                disabled={loading}
                required
              />
              {touched.username && errors.username && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.username}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal dark:text-white/90 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  handleChange('email', e.target.value)
                }}
                onBlur={(e) => handleBlur('email', e.target.value)}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-midnight border-2 rounded-lg focus:outline-none focus:ring-2 transition-all text-charcoal dark:text-white placeholder-charcoal/40 dark:placeholder-white/40 ${
                  touched.email && errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900'
                    : touched.email && !errors.email && email
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-900'
                    : 'border-gray-200 dark:border-gray-700 focus:ring-gold dark:focus:ring-teal focus:border-gold dark:focus:border-teal'
                }`}
                disabled={loading}
                required
                aria-invalid={touched.email && errors.email ? 'true' : 'false'}
                aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
              />
              {touched.email && errors.email && (
                <div id="email-error" className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-2 animate-slideDown" role="alert">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                  {errors.email}
                </div>
              )}
              {touched.email && !errors.email && email && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-2 animate-slideDown">
                  <span className="inline-block w-1 h-1 rounded-full bg-green-500" />
                  Looks good!
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal dark:text-white/90 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  handleChange('password', e.target.value)
                }}
                onBlur={(e) => handleBlur('password', e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-midnight border-2 rounded-lg focus:outline-none focus:ring-2 transition-all text-charcoal dark:text-white placeholder-charcoal/40 dark:placeholder-white/40 ${
                  touched.password && errors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900'
                    : touched.password && !errors.password && password
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-900'
                    : 'border-gray-200 dark:border-gray-700 focus:ring-gold dark:focus:ring-teal focus:border-gold dark:focus:border-teal'
                }`}
                disabled={loading}
                required
                aria-invalid={touched.password && errors.password ? 'true' : 'false'}
                aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
              />
              {touched.password && errors.password && (
                <div id="password-error" className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-2 animate-slideDown" role="alert">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                  {errors.password}
                </div>
              )}
              {password && <PasswordStrengthIndicator password={password} showLabel={true} />}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal dark:text-white/90 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  handleChange('confirmPassword', e.target.value)
                }}
                onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-midnight border-2 rounded-lg focus:outline-none focus:ring-2 transition-all text-charcoal dark:text-white placeholder-charcoal/40 dark:placeholder-white/40 ${
                  touched.confirmPassword && errors.confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900'
                    : touched.confirmPassword && !errors.confirmPassword && confirmPassword
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-900'
                    : 'border-gray-200 dark:border-gray-700 focus:ring-gold dark:focus:ring-teal focus:border-gold dark:focus:border-teal'
                }`}
                disabled={loading}
                required
                aria-invalid={touched.confirmPassword && errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={touched.confirmPassword && errors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <div id="confirmPassword-error" className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-2 animate-slideDown" role="alert">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                  {errors.confirmPassword}
                </div>
              )}
              {touched.confirmPassword && !errors.confirmPassword && confirmPassword && password === confirmPassword && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-2 animate-slideDown">
                  <span className="inline-block w-1 h-1 rounded-full bg-green-500" />
                  Passwords match!
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
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
            By signing up, you&apos;ll receive a confirmation email to verify your account
          </p>
        </div>
      </div>
    </div>
  )
}
