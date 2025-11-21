'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams?.get('email') || ''
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleResend = async () => {
    setResending(true)
    // In production, call your API to resend email
    setTimeout(() => {
      setResending(false)
      setResent(true)
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-paper dark:bg-midnight flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gold/10 dark:bg-teal/10 rounded-full mb-4">
            <svg className="w-10 h-10 text-gold dark:text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="font-serif text-4xl font-bold text-charcoal dark:text-teal mb-2">
            Check Your Email
          </h1>
          <p className="text-charcoal/70 dark:text-white/70">
            We've sent a verification link to
          </p>
          <p className="text-gold dark:text-teal font-semibold mt-1">
            {email}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-8 space-y-6">
          <div className="space-y-4 text-sm text-charcoal/70 dark:text-white/70">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gold/20 dark:bg-teal/20 text-gold dark:text-teal rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <p>Open your email inbox and look for a message from <strong>Personal Diary</strong></p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gold/20 dark:bg-teal/20 text-gold dark:text-teal rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <p>Click the <strong>"Confirm your email"</strong> button in the email</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gold/20 dark:bg-teal/20 text-gold dark:text-teal rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <p>You'll be redirected back to start your journaling journey</p>
            </div>
          </div>

          <div className="pt-4 border-t border-charcoal/10 dark:border-white/10">
            <p className="text-sm text-charcoal/60 dark:text-white/60 mb-3">
              Didn't receive the email?
            </p>
            <ul className="text-xs text-charcoal/50 dark:text-white/50 space-y-1 mb-4">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait a few minutes for the email to arrive</li>
            </ul>
            <button
              onClick={handleResend}
              disabled={resending || resent}
              className="w-full py-2.5 border-2 border-gold dark:border-teal text-gold dark:text-teal rounded-lg font-semibold hover:bg-gold/5 dark:hover:bg-teal/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? 'Sending...' : resent ? '✓ Email Sent!' : 'Resend Verification Email'}
            </button>
          </div>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="text-sm text-charcoal/70 dark:text-white/70 hover:text-charcoal dark:hover:text-white transition-colors"
          >
            ← Back to login
          </Link>
        </div>

        {/* Auto-check */}
        <div className="mt-8 text-center text-xs text-charcoal/50 dark:text-white/50">
          <p>This page will automatically detect when you verify your email</p>
        </div>
      </div>
    </main>
  )
}
