'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink, Gift, Sparkles, Calendar, Bell, Heart, Star, PartyPopper } from 'lucide-react'

const DISCOVER_DISMISSED_KEY = 'discover-card-dismissed'
const REMINDER_APP_URL = 'https://reminder-app-gap4.onrender.com/reminders/'

interface DiscoverCardProps {
  /** 'dashboard' shows the full spotlight card; 'people' shows a contextual birthday tip */
  variant?: 'dashboard' | 'people'
}

interface DashboardContent {
  title: string
  body: string
  cta: string
  badge: string
  pills: Array<{ icon: 'bell' | 'gift' | 'calendar' | 'heart' | 'star'; label: string }>
}

const DASHBOARD_VARIANTS: DashboardContent[] = [
  {
    title: '🎉 Reminder App: Never Forget a Special Day',
    body: 'Track birthdays, anniversaries and important events. Get email reminders days in advance and share beautiful animated greeting cards with your loved ones, completely free.',
    cta: 'Check it out',
    badge: 'FREE',
    pills: [
      { icon: 'bell', label: 'Auto reminders' },
      { icon: 'gift', label: 'Animated cards' },
      { icon: 'calendar', label: 'Birthday tracker' },
    ],
  },
  {
    title: '🎂 Birthdays remembered, every time',
    body: 'Stop relying on social media to remind you. Set up your own birthday tracker, get early email alerts, and send a personal animated card that actually feels special.',
    cta: 'Try it free',
    badge: 'FREE',
    pills: [
      { icon: 'bell', label: 'Email alerts' },
      { icon: 'heart', label: 'Personal touch' },
      { icon: 'calendar', label: 'Birthday tracker' },
    ],
  },
  {
    title: '💌 Send cards people will actually remember',
    body: 'Animated greeting cards for birthdays, anniversaries, graduations and more. Write your message, pick a design, and let Reminder App deliver it right on time, no cost at all.',
    cta: 'Send a free card',
    badge: 'FREE',
    pills: [
      { icon: 'gift', label: 'Animated cards' },
      { icon: 'star', label: 'Custom messages' },
      { icon: 'bell', label: 'Timed delivery' },
    ],
  },
  {
    title: '📅 All your important dates, one place',
    body: 'Anniversaries, graduations, name days, festivals — add any event and get reminded well before it arrives. Never scramble for a gift or a message at the last minute again.',
    cta: 'Start tracking',
    badge: 'FREE',
    pills: [
      { icon: 'calendar', label: 'Any event type' },
      { icon: 'bell', label: 'Early reminders' },
      { icon: 'gift', label: 'Greeting cards' },
    ],
  },
  {
    title: '🔔 Reminders that actually reach you',
    body: 'Email reminders land in your inbox days before the occasion, so you have time to plan, buy a gift, or just send a heartfelt message. Built by the same creator as Noted.',
    cta: 'Set up reminders',
    badge: 'FREE',
    pills: [
      { icon: 'bell', label: 'Inbox reminders' },
      { icon: 'heart', label: 'From the creator' },
      { icon: 'calendar', label: 'Occasion planner' },
    ],
  },
  {
    title: '🌟 Made by the same person who built Noted',
    body: 'Reminder App is a free companion tool for keeping the people in your life feeling remembered. Birthdays, anniversaries, custom events — tracked, reminded, and celebrated.',
    cta: 'Explore Reminder App',
    badge: 'FREE',
    pills: [
      { icon: 'star', label: 'From the creator' },
      { icon: 'gift', label: 'Animated cards' },
      { icon: 'bell', label: 'Auto reminders' },
    ],
  },
]

const PEOPLE_VARIANTS: Array<{ title: string; body: string }> = [
  {
    title: '🎂 Never miss a birthday again!',
    body: 'Get automatic email reminders for birthdays, anniversaries and special events. Send beautiful animated greeting cards, completely free.',
  },
  {
    title: '💌 Make people feel remembered',
    body: 'Set up reminders for anyone in your life and send animated greeting cards right on time, no subscriptions, no fees.',
  },
  {
    title: '🔔 Early reminders, every occasion',
    body: 'Birthdays, anniversaries, custom events — get email alerts days in advance so you are never caught off guard.',
  },
  {
    title: '🎁 A free card for every celebration',
    body: 'Reminder App lets you track special dates and send animated greeting cards to the people who matter most.',
  },
]

const PillIcon = ({ type }: { type: DashboardContent['pills'][number]['icon'] }) => {
  const cls = 'w-3 h-3 sm:w-3.5 sm:h-3.5'
  switch (type) {
    case 'bell': return <Bell className={cls} />
    case 'gift': return <Gift className={cls} />
    case 'calendar': return <Calendar className={cls} />
    case 'heart': return <Heart className={cls} />
    case 'star': return <Star className={cls} />
  }
}

/**
 * Inline "Discover" promotion card.
 * Blends naturally into page content rather than floating as an overlay.
 * Dismissible for 14 days via localStorage.
 */
export default function DiscoverCard({ variant = 'dashboard' }: DiscoverCardProps) {
  const [visible, setVisible] = useState(false)
  // Pick a random variant once on mount — stable across re-renders
  const [dashIdx] = useState(() => Math.floor(Math.random() * DASHBOARD_VARIANTS.length))
  const [peopleIdx] = useState(() => Math.floor(Math.random() * PEOPLE_VARIANTS.length))

  useEffect(() => {
    const dismissed = localStorage.getItem(DISCOVER_DISMISSED_KEY)
    if (dismissed) {
      const fourteenDays = 14 * 24 * 60 * 60 * 1000
      if (Date.now() - new Date(dismissed).getTime() < fourteenDays) return
    }
    setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISCOVER_DISMISSED_KEY, new Date().toISOString())
    setVisible(false)
  }

  if (!visible) return null

  // ── People page variant: contextual birthday tip ──────────────────
  if (variant === 'people') {
    const p = PEOPLE_VARIANTS[peopleIdx]
    return (
      <div className="relative bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-rose-900/20 rounded-xl border border-amber-200/50 dark:border-amber-700/30 p-3 sm:p-4 mb-4 sm:mb-6">
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 p-1 text-charcoal/40 dark:text-white/40 hover:text-charcoal dark:hover:text-white rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <div className="p-2 bg-amber-100 dark:bg-amber-800/30 rounded-lg shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-charcoal dark:text-white mb-0.5">
              {p.title}
            </p>
            <p className="text-[11px] sm:text-xs text-charcoal/60 dark:text-white/60 mb-2 leading-relaxed">
              {p.body}
            </p>
            <a
              href={REMINDER_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Try Reminder App
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Dashboard variant: full spotlight card ────────────────────────
  const d = DASHBOARD_VARIANTS[dashIdx]
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gold/5 via-amber-50 to-orange-50 dark:from-teal/5 dark:via-teal/10 dark:to-cyan-900/20 rounded-xl sm:rounded-2xl border border-gold/20 dark:border-teal/20 shadow-lg p-4 sm:p-6">
      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 text-charcoal/40 dark:text-white/40 hover:text-charcoal dark:hover:text-white hover:bg-charcoal/10 dark:hover:bg-white/10 rounded-lg transition-colors z-10"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Decorative sparkles */}
      <div className="absolute top-0 right-8 sm:right-16 opacity-10">
        <Sparkles className="w-20 h-20 sm:w-32 sm:h-32 text-gold dark:text-teal" />
      </div>

      <div className="relative flex flex-col sm:flex-row items-start gap-3 sm:gap-5">
        {/* Icon */}
        <div className="p-3 sm:p-4 bg-gradient-to-br from-gold/20 to-amber-200/30 dark:from-teal/20 dark:to-cyan-400/20 rounded-xl sm:rounded-2xl shadow-inner shrink-0">
          <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-gold dark:text-teal" />
        </div>

        {/* Content */}
        <div className="flex-1 pr-6 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gold dark:text-teal">
              From the Creator
            </span>
            <span className="px-1.5 py-0.5 bg-gold/10 dark:bg-teal/10 rounded text-[10px] font-bold text-gold dark:text-teal">
              {d.badge}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-charcoal dark:text-white mb-1 sm:mb-2 leading-snug">
            {d.title}
          </h3>

          <p className="text-xs sm:text-sm text-charcoal/70 dark:text-white/70 mb-3 sm:mb-4 leading-relaxed max-w-lg">
            {d.body}
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            {d.pills.map((pill) => (
              <span key={pill.label} className="flex items-center gap-1 text-[10px] sm:text-xs text-charcoal/60 dark:text-white/60">
                <PillIcon type={pill.icon} /> {pill.label}
              </span>
            ))}
          </div>

          <a
            href={REMINDER_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:opacity-90 hover:shadow-lg transition-all"
          >
            {d.cta}
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
