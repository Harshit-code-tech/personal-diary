'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { Book, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user has a valid session (from reset link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error('Invalid or expired reset link')
        router.push('/forgot-password')
      }
    })
  }, [router, supabase])

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      toast.success('Password updated successfully!')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'Strong': return 'text-green-500'
      case 'Medium': return 'text-yellow-500'
      case 'Weak': return 'text-orange-500'
      case 'Too Short': return 'text-red-500'
      default: return 'text-charcoal/50 dark:text-white/50'
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF5E6] dark:bg-midnight flex items-center justify-center px-4">
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold text-charcoal dark:text-teal">
          <Book className="w-6 h-6" />
          <span>Noted.</span>
        </Link>
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-graphite rounded-2xl shadow-xl border border-charcoal/10 dark:border-white/10 p-8">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold text-charcoal dark:text-white mb-2">
            Set New Password
          </h1>
          <p className="text-charcoal/70 dark:text-white/70">
            Choose a strong password for your account
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Enter your new password"
                required
                minLength={8}
                className="w-full px-4 py-3 pr-12 border border-charcoal/20 dark:border-white/20 rounded-lg bg-transparent text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 dark:text-white/40 hover:text-charcoal dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {password && (
              <p className={`text-xs mt-2 font-medium ${getStrengthColor(passwordStrength)}`}>
                Password Strength: {passwordStrength}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                minLength={8}
                className="w-full px-4 py-3 pr-12 border border-charcoal/20 dark:border-white/20 rounded-lg bg-transparent text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 dark:text-white/40 hover:text-charcoal dark:hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs mt-2 text-red-500 font-medium">
                Passwords do not match
              </p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-charcoal/5 dark:bg-white/5 rounded-lg p-4 text-xs text-charcoal/60 dark:text-white/60 space-y-1">
            <p className="font-semibold mb-2">Password must contain:</p>
            <p>• At least 8 characters</p>
            <p>• Mix of uppercase and lowercase letters</p>
            <p>• At least one number</p>
            <p>• At least one special character</p>
          </div>

          <button
            type="submit"
            disabled={loading || password !== confirmPassword || password.length < 8}
            className="w-full py-3.5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </main>
  )
}
