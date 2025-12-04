'use client'

import Link from 'next/link'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { Lock, BookOpen, Download, Book, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [menuOpen])

  return (
    <main className="min-h-screen bg-[#FFF5E6] dark:bg-midnight transition-colors duration-300">
      {/* Sticky Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF5E6]/80 dark:bg-midnight/80 border-b border-charcoal/10 dark:border-white/10 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5 sm:w-6 sm:h-6 text-gold dark:text-teal" />
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-charcoal dark:text-teal">
              Noted
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-4">
            <ThemeSwitcher />
            <Link 
              href="/login"
              className="text-sm font-medium text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? (
              <X className="w-5 h-5 text-charcoal dark:text-white" />
            ) : (
              <Menu className="w-5 h-5 text-charcoal dark:text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <>
            <div
              className="sm:hidden fixed inset-0 bg-black/20 dark:bg-black/40 z-40 top-[56px]"
              onClick={() => setMenuOpen(false)}
            />
            <div className="sm:hidden bg-[#FFF5E6] dark:bg-midnight border-b border-charcoal/10 dark:border-white/10 py-4 px-4 space-y-3">
              <div className="flex justify-center">
                <ThemeSwitcher />
              </div>
              <Link 
                href="/login"
                className="block w-full text-center py-2 text-sm font-medium text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </>
        )}
      </nav>

      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <Book className="w-16 h-16 sm:w-20 sm:h-20 text-gold dark:text-teal" strokeWidth={1.5} />
          </div>
          
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
            <span className="text-charcoal dark:text-white">Your Space.</span>
            <br />
            <span className="text-gold dark:text-teal">Your Thoughts.</span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-charcoal/70 dark:text-white/70 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            A private, elegant digital diary for your daily thoughts, memories, and reflections. Write freely in your own secure space.
          </p>

          {/* CTA Button */}
          <div className="flex justify-center mb-20 sm:mb-32 lg:mb-40">
            <Link 
              href="/signup" 
              className="px-8 sm:px-10 py-4 sm:py-5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg text-base sm:text-lg w-full sm:w-auto max-w-xs"
            >
              Start Writing Today
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gold dark:border-teal mb-4 sm:mb-6">
                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-gold dark:text-teal" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-charcoal dark:text-white">
                Private & Secure
              </h3>
              <p className="text-sm sm:text-base text-charcoal/60 dark:text-white/60 leading-relaxed">
                Your entries are encrypted and protected. Only you can access your thoughts.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gold dark:border-teal mb-4 sm:mb-6">
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-gold dark:text-teal" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-charcoal dark:text-white">
                Rich Writing
              </h3>
              <p className="text-sm sm:text-base text-charcoal/60 dark:text-white/60 leading-relaxed">
                Beautiful WYSIWYG editor with image support. Express yourself fully.
              </p>
            </div>

            <div className="text-center sm:col-span-2 md:col-span-1">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gold dark:border-teal mb-4 sm:mb-6">
                <Download className="w-8 h-8 sm:w-10 sm:h-10 text-gold dark:text-teal" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-charcoal dark:text-white">
                Export Anytime
              </h3>
              <p className="text-sm sm:text-base text-charcoal/60 dark:text-white/60 leading-relaxed">
                Your data, your control. Export your diary entries whenever you want.
              </p>
            </div>
          </div>

          {/* Call to Action Section */}
          <div className="mt-24 sm:mt-32 lg:mt-40 bg-white dark:bg-graphite rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-10 lg:p-12 max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal dark:text-teal mb-3 sm:mb-4">
              Begin Your Journey Today
            </h2>
            <p className="text-charcoal/70 dark:text-white/70 mb-6 sm:mb-8 text-base sm:text-lg">
              Join others who&apos;ve made journaling a daily habit.
            </p>
            <Link 
              href="/signup"
              className="inline-block px-8 sm:px-10 py-4 sm:py-5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg text-base sm:text-lg w-full sm:w-auto"
            >
              Create Your Diary
            </Link>
          </div>

          {/* Footer */}
          <p className="mt-12 sm:mt-16 lg:mt-20 text-xs sm:text-sm text-charcoal/50 dark:text-white/50">
            © 2025 Noted. Your thoughts, forever private.
          </p>
        </div>
      </div>
    </main>
  )
}
