'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink, Gift } from 'lucide-react'

const PROMO_DISMISSED_KEY = 'reminder-app-promo-dismissed'

const PROMO_MESSAGES = [
  { text: 'Never forget a birthday again!', emoji: '🎂' },
  { text: 'Send beautiful greeting cards for free', emoji: '💌' },
  { text: 'Auto-reminders for anniversaries & events', emoji: '🎉' },
  { text: 'Celebrate special moments with animated cards', emoji: '✨' },
  { text: 'Track birthdays, anniversaries & more', emoji: '📅' },
]

const REMINDER_APP_URL = 'https://reminder-app-gap4.onrender.com/reminders/'

/**
 * Floating promo bubble for the Reminder App.
 * Bottom-left on all screens (OfflineIndicator is bottom-right).
 * On mobile: shows a small round icon button; expanded card is narrow.
 * Dismissible for 7 days via localStorage.
 */
export default function ReminderAppPromo() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const dismissed = localStorage.getItem(PROMO_DISMISSED_KEY)
    if (dismissed) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - new Date(dismissed).getTime() < sevenDays) return
    }
    const t = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!expanded) return
    const interval = setInterval(
      () => setMessageIndex(prev => (prev + 1) % PROMO_MESSAGES.length),
      5000,
    )
    return () => clearInterval(interval)
  }, [expanded])

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    localStorage.setItem(PROMO_DISMISSED_KEY, new Date().toISOString())
    setVisible(false)
  }

  if (!visible) return null

  const msg = PROMO_MESSAGES[messageIndex]

  return (
    <div className="fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6 max-w-[calc(100vw-5rem)]">
      {/* Expanded card */}
      {expanded && (
        <div className="mb-2 w-60 sm:w-72 bg-white dark:bg-graphite rounded-xl shadow-2xl border border-gold/20 dark:border-teal/20 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-gold/10 to-amber-100/50 dark:from-teal/10 dark:to-teal/5 px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-lg">{msg.emoji}</span>
              <span className="text-xs sm:text-sm font-bold text-charcoal dark:text-white">
                Reminder App
              </span>
            </div>
            <button
              onClick={dismiss}
              className="p-1 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded transition-colors"
              title="Dismiss for 7 days"
            >
              <X className="w-3.5 h-3.5 text-charcoal/50 dark:text-white/50" />
            </button>
          </div>

          {/* Body */}
          <div className="px-3 py-2.5 sm:px-4 sm:py-3">
            <p className="text-xs sm:text-sm text-charcoal/80 dark:text-white/80 leading-relaxed mb-2 transition-all duration-300">
              {msg.text}
            </p>
            <p className="text-[10px] sm:text-xs text-charcoal/50 dark:text-white/50 mb-2.5">
              Free app to track birthdays, anniversaries &amp; special events.
              Get email reminders &amp; share animated greeting cards!
            </p>
            <a
              href={REMINDER_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg text-xs sm:text-sm font-bold hover:opacity-90 transition-all"
            >
              Check it out
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </a>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1 pb-2.5">
            {PROMO_MESSAGES.map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full transition-colors ${
                  i === messageIndex
                    ? 'bg-gold dark:bg-teal'
                    : 'bg-charcoal/15 dark:bg-white/15'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating trigger — round icon on mobile, pill on desktop */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className={`group flex items-center justify-center gap-2 rounded-full shadow-lg transition-all duration-300 ${
          expanded
            ? 'px-3 py-2 bg-gold/10 dark:bg-teal/10 border border-gold/30 dark:border-teal/30'
            : 'w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-white dark:bg-graphite border border-gold/20 dark:border-teal/20 hover:shadow-xl hover:scale-105'
        }`}
        title="Check out our Reminder App!"
      >
        <Gift
          className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
            expanded ? 'text-gold dark:text-teal' : 'text-gold dark:text-teal'
          }`}
        />
        <span className="text-xs sm:text-sm font-medium text-charcoal dark:text-white hidden sm:inline">
          {expanded ? 'Close' : '🎂 Reminder App'}
        </span>
      </button>
    </div>
  )
}
