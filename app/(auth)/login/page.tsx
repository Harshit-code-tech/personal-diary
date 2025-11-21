'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { Book } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
    } else {
      router.push('/app')
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF5E6] dark:bg-midnight flex items-center justify-center px-4">
      {/* Logo/Brand with Theme Switcher */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold text-charcoal dark:text-teal">
          <Book className="w-6 h-6" />
          <span>My Diary</span>
        </Link>
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-graphite rounded-2xl shadow-xl border border-charcoal/10 dark:border-white/10 p-8">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold text-charcoal dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-charcoal/60 dark:text-white/60">
            Sign in to your private diary or{' '}
            <Link href="/signup" className="text-gold dark:text-teal hover:underline font-medium">
              create a new account
            </Link>
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-0 mb-8 border-b border-charcoal/10 dark:border-white/10">
          <button className="flex-1 pb-3 text-charcoal dark:text-white font-semibold border-b-2 border-gold dark:border-teal">
            Sign In
          </button>
          <Link 
            href="/signup"
            className="flex-1 pb-3 text-charcoal/40 dark:text-white/40 text-center hover:text-charcoal dark:hover:text-white transition-colors"
          >
            Sign Up
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white dark:bg-graphite border border-charcoal/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-gold dark:focus:border-teal transition-colors text-charcoal dark:text-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white dark:bg-graphite border border-charcoal/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-gold dark:focus:border-teal transition-colors text-charcoal dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-charcoal/50 dark:text-white/50 hover:text-charcoal dark:hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
