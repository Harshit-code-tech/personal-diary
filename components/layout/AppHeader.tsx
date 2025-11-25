'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import NotificationBell from '@/components/notifications/NotificationBell'
import {
  BookOpen,
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
    href: '/app/insights',
    label: 'Insights',
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
    icon: Star,
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
  {
    href: '/app/calendar',
    label: 'Calendar',
    icon: Calendar,
    color: 'text-purple-500 dark:text-purple-400',
    hoverColor: 'hover:text-purple-500 dark:hover:text-purple-400 hover:bg-purple-500/10 dark:hover:bg-purple-400/10',
  },
  {
    href: '/app/statistics',
    label: 'Stats',
    icon: TrendingUp,
    color: 'text-blue-500 dark:text-blue-400',
    hoverColor: 'hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-400/10',
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
    // Close menu on route change
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    // Prevent body scroll when menu is open on mobile
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [menuOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (href: string) => {
    if (href === '/app') {
      return pathname === '/app'
    }
    return pathname?.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-midnight/80 border-b border-gold/20 dark:border-teal/20 shadow-lg">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/app" className="group flex items-center gap-3 flex-shrink-0">
            <div className="p-2 bg-gradient-to-br from-gold/20 to-gold/10 dark:from-teal/20 dark:to-teal/10 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-gold dark:text-teal" />
            </div>
            <span className="hidden sm:block font-serif text-2xl lg:text-3xl font-black bg-gradient-to-r from-charcoal to-charcoal/70 dark:from-teal dark:to-teal/70 bg-clip-text text-transparent">
              My Diary
            </span>
          </Link>

          {/* Desktop Navigation - Show all items, hide on mobile */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 xl:gap-2 flex-1 justify-center max-w-5xl mx-2 lg:mx-4">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-2 lg:px-2.5 py-2 text-sm font-bold rounded-xl transition-all duration-300 whitespace-nowrap ${
                    active
                      ? `${link.color} bg-opacity-10 scale-105 shadow-sm`
                      : `text-charcoal dark:text-white ${link.hoverColor}`
                  }`}
                  title={link.label}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden xl:inline">{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search - Always visible on desktop, hidden on mobile when menu open */}
            <Link
              href="/app/search"
              className={`p-2 sm:p-2.5 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-all duration-300 rounded-xl hover:bg-gold/10 dark:hover:bg-teal/10 ${
                menuOpen ? 'hidden sm:flex' : 'flex'
              }`}
              title="Search"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Theme Switcher - Hide on mobile when menu open */}
            <div className={menuOpen ? 'hidden sm:block' : 'block'}>
              <ThemeSwitcher />
            </div>

            {/* Notification Bell - Hide on mobile when menu open */}
            <div className={menuOpen ? 'hidden sm:block' : 'block'}>
              <NotificationBell />
            </div>

            {/* Settings - Hide on mobile when menu open */}
            <Link
              href="/app/settings"
              className={`hidden lg:flex p-2.5 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-all duration-300 rounded-xl hover:bg-gold/10 dark:hover:bg-teal/10 ${
                menuOpen ? 'lg:hidden xl:flex' : ''
              }`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* Hamburger Menu Button - Visible only on mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 sm:p-2.5 hover:bg-gradient-to-r hover:from-gold/10 hover:to-gold/5 dark:hover:from-teal/10 dark:hover:to-teal/5 rounded-xl transition-all duration-300 group hover:scale-110"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-gold dark:group-hover:text-teal transition-colors" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-gold dark:group-hover:text-teal transition-colors" />
              )}
            </button>

            {/* Sign Out - Hidden on xl+ when visible in desktop nav */}
            <button
              onClick={handleSignOut}
              className="hidden sm:flex lg:flex p-2.5 text-charcoal dark:text-white hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Dropdown Menu */}
      {mounted && (
        <div
          className={`xl:hidden absolute top-full left-0 right-0 bg-white dark:bg-midnight border-b border-gold/20 dark:border-teal/20 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${
            menuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="px-4 py-4 space-y-1 max-h-[calc(80vh-2rem)] overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 text-base font-bold rounded-xl transition-all duration-300 ${
                    active
                      ? `${link.color} bg-opacity-10 scale-[1.02] shadow-md`
                      : `text-charcoal dark:text-white ${link.hoverColor}`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}

            {/* Additional mobile menu items */}
            <div className="pt-4 mt-4 border-t border-charcoal/10 dark:border-white/10 space-y-1">
              <Link
                href="/app/settings"
                className="flex items-center gap-3 px-4 py-3 text-base font-bold text-charcoal dark:text-white hover:text-gold dark:hover:text-teal rounded-xl hover:bg-gold/10 dark:hover:bg-teal/10 transition-all duration-300"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-base font-bold text-charcoal dark:text-white hover:text-red-500 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Overlay for mobile menu */}
      {menuOpen && (
        <div
          className="xl:hidden fixed inset-0 bg-black/20 dark:bg-black/40 z-[-1] top-[73px] backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  )
}
