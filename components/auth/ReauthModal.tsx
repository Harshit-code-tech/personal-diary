'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

interface ReauthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  title?: string
  description?: string
}

export default function ReauthModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Confirm Your Identity',
  description = 'Please re-enter your password to continue'
}: ReauthModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleReauth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.email) {
        throw new Error('User not found')
      }

      // Attempt to sign in with current credentials to verify password
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      })

      if (error) throw error

      toast.success('Authentication successful')
      setPassword('')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Invalid password')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-graphite rounded-2xl shadow-2xl border border-charcoal/10 dark:border-white/10 p-8 animate-in zoom-in-95">
        <h2 className="font-serif text-2xl font-bold text-charcoal dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-charcoal/70 dark:text-white/70 mb-6 text-sm">
          {description}
        </p>

        <form onSubmit={handleReauth} className="space-y-6">
          <div>
            <label htmlFor="reauth-password" className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="reauth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoFocus
                autoComplete="current-password"
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
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white rounded-lg font-semibold hover:bg-charcoal/5 dark:hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
