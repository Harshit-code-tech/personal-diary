'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import NotificationBell from '@/components/notifications/NotificationBell'
import StreakBadge from '@/components/analytics/StreakBadge'
import Tooltip from '@/components/ui/Tooltip'
import {
  BookOpen,
  PenTool,
  Menu,
  X,
  Settings,
  LogOut,
  Search,
  BarChart3,
  Smile,
  Bell,
  Star,
  Target,
  FileText,
  Users,
  BookMarked,
  Calendar,
  TrendingUp,
  Sparkles,
  Trash2,
} from 'lucide-react'

interface NavLink {
  href: string
  label: string
  icon: React.ElementType
  color: string
  hoverColor: string
}

const navLinks: NavLink[] = [
  {
    href: '/app',
    label: 'Entries',
    icon: FileText,
    color: 'text-gold dark:text-teal',
    hoverColor: 'hover:text-gold dark:hover:text-teal hover:bg-gold/10 dark:hover:bg-teal/10',
  },

  {
    href: '/app/analytics',
    label: 'Analytics',
    icon: BarChart3,
    color: 'text-purple-500 dark:text-purple-400',
    hoverColor: 'hover:text-purple-500 dark:hover:text-purple-400 hover:bg-purple-500/10 dark:hover:bg-purple-400/10',
  },
  {
    href: '/app/mood',
    label: 'Moods',
    icon: Smile,
    color: 'text-pink-500 dark:text-pink-400',
    hoverColor: 'hover:text-pink-500 dark:hover:text-pink-400 hover:bg-pink-500/10 dark:hover:bg-pink-400/10',
  },
  {
    href: '/app/reminders',
    label: 'Reminders',
    icon: Bell,
    color: 'text-yellow-500 dark:text-yellow-400',
    hoverColor: 'hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-500/10 dark:hover:bg-yellow-400/10',
  },
  {
    href: '/app/timeline',
    label: 'Timeline',
    icon: TrendingUp,
    color: 'text-indigo-500 dark:text-indigo-400',
    hoverColor: 'hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/10 dark:hover:bg-indigo-400/10',
  },
  {
    href: '/app/goals',
    label: 'Goals',
    icon: Target,
    color: 'text-green-500 dark:text-green-400',
    hoverColor: 'hover:text-green-500 dark:hover:text-green-400 hover:bg-green-500/10 dark:hover:bg-green-400/10',
  },
  {
    href: '/app/people',
    label: 'People',
    icon: Users,
    color: 'text-blue-500 dark:text-blue-400',
    hoverColor: 'hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-400/10',
  },
  {
    href: '/app/stories',
    label: 'Stories',
    icon: BookMarked,
    color: 'text-orange-500 dark:text-orange-400',
    hoverColor: 'hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-500/10 dark:hover:bg-orange-400/10',
  },
]

export default function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [menuOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (href: string) => {
    if (href === '/app') return pathname === '/app'
    return pathname?.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 vintage-header">
      <div className="max-w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Logo — compact on mobile */}
          <Link
            href="/app"
            className="group flex items-center gap-2 sm:gap-3 flex-shrink-0"
            aria-label="Go to home page"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden group-hover:scale-110 transition-transform duration-300 shadow-md flex-shrink-0" style={{backgroundColor: '#6B2D3E'}}>
              <img src="/textures/wax-seal.png" alt="" className="w-full h-full object-cover scale-[1.5]" />
            </div>
            <span className="font-script text-2xl sm:text-3xl lg:text-4xl tracking-wide text-gold dark:text-teal">
              Noted<span className="text-xl sm:text-2xl lg:text-3xl">.</span>
            </span>
          </Link>

          {/* Desktop Navigation — hidden below md */}
          <nav
            className="hidden md:flex items-center gap-1 lg:gap-1.5 xl:gap-2 flex-1 justify-center max-w-5xl mx-2 lg:mx-4"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-2 lg:px-2.5 py-2 text-sm font-medium rounded-xl transition-all duration-300 whitespace-nowrap ${
                    active
                      ? `${link.color} bg-opacity-10 scale-105 shadow-sm`
                      : `text-charcoal dark:text-white ${link.hoverColor}`
                  }`}
                  aria-label={`Navigate to ${link.label}`}
                  aria-current={active ? 'page' : undefined}
                  title={link.label}
                  data-tour={link.href === '/app/analytics' ? 'analytics' : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="hidden xl:inline">{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* ── Right-side actions ──────────────────────────────────────── */}
          {/* Mobile: only show streak + notification + hamburger.           */}
          {/* Search, Theme, Settings, SignOut live inside the mobile menu.  */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {/* Streak Badge — always visible when active */}
            <StreakBadge />

            {/* Search — desktop only (mobile: in hamburger menu) */}
            <Tooltip content="Search entries" position="bottom">
              <Link
                href="/app/search"
                className="hidden md:flex p-2 md:p-2.5 min-w-[40px] min-h-[40px] items-center justify-center text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-all duration-300 rounded-xl hover:bg-gold/10 dark:hover:bg-teal/10 active:scale-95"
                aria-label="Search entries"
                data-tour="search"
              >
                <Search className="w-5 h-5" aria-hidden="true" />
              </Link>
            </Tooltip>

            {/* Theme Switcher — desktop only */}
            <div className="hidden md:block">
              <ThemeSwitcher />
            </div>

            {/* Notification Bell — always visible, with visible ring */}
            <NotificationBell />

            {/* Settings — large desktop only */}
            <Tooltip content="Settings" position="bottom">
              <Link
                href="/app/settings"
                className="hidden lg:flex p-2.5 min-w-[44px] min-h-[44px] items-center justify-center text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-all duration-300 rounded-xl hover:bg-gold/10 dark:hover:bg-teal/10 active:scale-95"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </Tooltip>

            {/* Hamburger Menu — visible below md */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border border-charcoal/15 dark:border-white/15 hover:bg-gold/10 dark:hover:bg-teal/10 transition-all duration-300 active:scale-95"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-charcoal dark:text-white" />
              ) : (
                <Menu className="w-5 h-5 text-charcoal dark:text-white" />
              )}
            </button>

            {/* Sign Out — desktop only */}
            <Tooltip content="Sign Out" position="bottom">
              <button
                onClick={handleSignOut}
                className="hidden md:flex p-2 md:p-2.5 min-w-[40px] min-h-[40px] items-center justify-center text-charcoal dark:text-white hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95"
                aria-label="Sign out of your account"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* ── Mobile Dropdown Menu ─────────────────────────────────────────── */}
      {mounted && (
        <div
          className={`md:hidden absolute top-full left-0 right-0 bg-white dark:bg-midnight border-b border-gold/20 dark:border-teal/20 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${
            menuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="px-4 py-3 space-y-0.5 max-h-[calc(80vh-2rem)] overflow-y-auto">
            {/* Quick-access row: Search + Theme on mobile */}
            <div className="flex items-center gap-2 pb-3 mb-2 border-b border-charcoal/10 dark:border-white/10">
              <Link
                href="/app/search"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal dark:text-white bg-charcoal/5 dark:bg-white/5 rounded-xl hover:bg-gold/10 dark:hover:bg-teal/10 transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Link>
              <div className="flex-shrink-0">
                <ThemeSwitcher />
              </div>
            </div>

            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                    active
                      ? `${link.color} bg-opacity-10 scale-[1.02] shadow-sm`
                      : `text-charcoal dark:text-white ${link.hoverColor}`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}

            {/* Settings & Sign Out */}
            <div className="pt-3 mt-2 border-t border-charcoal/10 dark:border-white/10 space-y-0.5">
              <Link
                href="/app/settings"
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-charcoal dark:text-white hover:text-gold dark:hover:text-teal rounded-xl hover:bg-gold/10 dark:hover:bg-teal/10 transition-all duration-300"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-charcoal dark:text-white hover:text-red-500 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Overlay */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 dark:bg-black/40 z-[-1] top-[60px] sm:top-[73px] backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  )
}
