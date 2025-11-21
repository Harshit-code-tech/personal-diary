'use client'

import Link from 'next/link'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { Lock, BookOpen, Download, Book } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FFF5E6] dark:bg-midnight transition-colors duration-300">
      {/* Sticky Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF5E6]/80 dark:bg-midnight/80 border-b border-charcoal/10 dark:border-white/10 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="w-6 h-6 text-gold dark:text-teal" />
            <h1 className="font-serif text-2xl font-bold text-charcoal dark:text-teal">
              My Diary
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Link 
              href="/login"
              className="text-sm font-medium text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="flex justify-center mb-8">
            <Book className="w-20 h-20 text-gold dark:text-teal" strokeWidth={1.5} />
          </div>
          
          <h1 className="font-serif text-6xl md:text-7xl font-bold mb-6">
            <span className="text-charcoal dark:text-white">Your Space.</span>
            <br />
            <span className="text-gold dark:text-teal">Your Thoughts.</span>
          </h1>
          
          <p className="text-xl text-charcoal/70 dark:text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            A private, elegant digital diary for your daily thoughts, memories, and reflections. Write freely in your own secure space.
          </p>

          {/* CTA Button */}
          <div className="flex justify-center mb-40">
            <Link 
              href="/signup" 
              className="px-10 py-5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg text-lg"
            >
              Start Writing Today
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-gold dark:border-teal mb-6">
                <Lock className="w-10 h-10 text-gold dark:text-teal" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3 text-charcoal dark:text-white">
                Private & Secure
              </h3>
              <p className="text-charcoal/60 dark:text-white/60 leading-relaxed">
                Your entries are encrypted and protected. Only you can access your thoughts.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-gold dark:border-teal mb-6">
                <BookOpen className="w-10 h-10 text-gold dark:text-teal" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3 text-charcoal dark:text-white">
                Rich Writing
              </h3>
              <p className="text-charcoal/60 dark:text-white/60 leading-relaxed">
                Beautiful WYSIWYG editor with image support. Express yourself fully.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-gold dark:border-teal mb-6">
                <Download className="w-10 h-10 text-gold dark:text-teal" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3 text-charcoal dark:text-white">
                Export Anytime
              </h3>
              <p className="text-charcoal/60 dark:text-white/60 leading-relaxed">
                Your data, your control. Export your diary entries whenever you want.
              </p>
            </div>
          </div>

          {/* Call to Action Section */}
          <div className="mt-40 bg-white dark:bg-graphite rounded-2xl shadow-xl p-12 max-w-2xl mx-auto">
            <h2 className="font-serif text-4xl font-bold text-charcoal dark:text-teal mb-4">
              Begin Your Journey Today
            </h2>
            <p className="text-charcoal/70 dark:text-white/70 mb-8 text-lg">
              Join others who've made journaling a daily habit.
            </p>
            <Link 
              href="/signup"
              className="inline-block px-10 py-5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg text-lg"
            >
              Create Your Diary
            </Link>
          </div>

          {/* Footer */}
          <p className="mt-20 text-sm text-charcoal/50 dark:text-white/50">
            © 2025 My Personal Diary. Your thoughts, forever private.
          </p>
        </div>
      </div>
    </main>
  )
}
