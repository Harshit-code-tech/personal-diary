'use client'

import Link from 'next/link'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { Lock, BookOpen, Download, Book, Menu, X, Feather, PenTool } from 'lucide-react'
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
    <main className="min-h-screen transition-colors duration-300 relative overflow-hidden book-page">
      {/* Ornate corner flourishes — CSS-based, always visible */}
      <div className="fixed top-4 left-4 text-[#8B5E3C]/20 dark:text-[#D4A44F]/15 text-5xl pointer-events-none select-none hidden lg:block font-serif" aria-hidden="true" style={{textShadow: '1px 1px 2px rgba(139,94,60,0.15)'}}>❦</div>
      <div className="fixed top-4 right-4 text-[#8B5E3C]/20 dark:text-[#D4A44F]/15 text-5xl pointer-events-none select-none hidden lg:block font-serif" style={{transform: 'scaleX(-1)', textShadow: '1px 1px 2px rgba(139,94,60,0.15)'}} aria-hidden="true">❦</div>
      <div className="fixed bottom-4 left-4 text-[#8B5E3C]/20 dark:text-[#D4A44F]/15 text-5xl pointer-events-none select-none hidden lg:block font-serif" style={{transform: 'scaleY(-1)', textShadow: '1px 1px 2px rgba(139,94,60,0.15)'}} aria-hidden="true">❦</div>
      <div className="fixed bottom-4 right-4 text-[#8B5E3C]/20 dark:text-[#D4A44F]/15 text-5xl pointer-events-none select-none hidden lg:block font-serif" style={{transform: 'scale(-1)', textShadow: '1px 1px 2px rgba(139,94,60,0.15)'}} aria-hidden="true">❦</div>

      {/* Decorative quill pens in corners — optional image overlay */}
      <img src="/textures/quill-pen.png" alt="" aria-hidden="true" className="fixed top-6 left-6 w-24 h-24 sm:w-32 sm:h-32 opacity-20 dark:opacity-10 pointer-events-none select-none hidden lg:block object-contain" style={{transform: 'rotate(-30deg)'}} />
      <img src="/textures/quill-pen.png" alt="" aria-hidden="true" className="fixed top-6 right-6 w-24 h-24 sm:w-32 sm:h-32 opacity-20 dark:opacity-10 pointer-events-none select-none hidden lg:block object-contain" style={{transform: 'rotate(30deg) scaleX(-1)'}} />
      <img src="/textures/quill-pen.png" alt="" aria-hidden="true" className="fixed bottom-6 left-6 w-24 h-24 sm:w-32 sm:h-32 opacity-20 dark:opacity-10 pointer-events-none select-none hidden lg:block object-contain" style={{transform: 'rotate(30deg) scaleY(-1)'}} />
      <img src="/textures/quill-pen.png" alt="" aria-hidden="true" className="fixed bottom-6 right-6 w-24 h-24 sm:w-32 sm:h-32 opacity-20 dark:opacity-10 pointer-events-none select-none hidden lg:block object-contain" style={{transform: 'rotate(-30deg) scale(-1)'}} />

      {/* CSS ink splatters — always visible */}
      <div className="ink-splatter ink-splatter-1 hidden sm:block" aria-hidden="true" />
      <div className="ink-splatter ink-splatter-2 hidden sm:block" aria-hidden="true" />
      <div className="ink-splatter ink-splatter-3 hidden lg:block" aria-hidden="true" />

      {/* Real ink splatter overlay — optional enhancement */}
      <img src="/textures/ink-splatters.png" alt="" aria-hidden="true" className="fixed top-[10%] left-[5%] w-28 h-28 opacity-15 dark:opacity-8 pointer-events-none select-none hidden sm:block object-contain" />
      <img src="/textures/ink-splatters.png" alt="" aria-hidden="true" className="fixed bottom-[15%] right-[8%] w-24 h-24 opacity-12 dark:opacity-6 pointer-events-none select-none hidden sm:block object-contain" style={{transform: 'rotate(120deg)'}} />

      {/* Sticky Header */}
      <nav className="sticky top-0 z-50 vintage-header">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="wax-seal w-9 h-9 sm:w-10 sm:h-10 text-sm font-bold">
              <PenTool className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="font-script text-2xl sm:text-3xl font-bold text-charcoal dark:text-teal">
              Noted.
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-4">
            <ThemeSwitcher />
            <Link 
              href="/login"
              className="text-sm font-medium text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors font-ui"
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
            <div className="sm:hidden bg-paper dark:bg-midnight border-b border-charcoal/10 dark:border-white/10 py-4 px-4 space-y-3">
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
          <div className="flex justify-center mb-8 sm:mb-10">
            <img src="/textures/wax-seal.png" alt="Noted. wax seal" className="w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-lg" />
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight ink-accent">
            <span className="text-charcoal dark:text-white">Your Space.</span>
            <br />
            <span className="text-gold dark:text-teal quill-underline">Your Thoughts.</span>
          </h1>
          
          {/* Vintage divider */}
          <div className="vintage-divider max-w-xs mx-auto mb-6 sm:mb-8">
            <span className="text-sm">✦</span>
          </div>

          <p className="text-base sm:text-lg lg:text-xl text-charcoal/70 dark:text-white/70 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4 font-body italic">
            A private, elegant digital diary for your daily thoughts, memories, and reflections. Write freely in your own secure space.
          </p>

          {/* CTA Button */}
          <div className="flex justify-center mb-16 sm:mb-24 lg:mb-32">
            <Link 
              href="/signup" 
              className="btn-vintage text-base sm:text-lg w-full sm:w-auto max-w-xs text-center"
            >
              ✍️ Start Writing Today
            </Link>
          </div>

          {/* Vintage ornament */}
          <div className="vintage-flourish mb-12 sm:mb-16">❧ ✦ ❦</div>

          {/* Features Grid — Vintage frame cards */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-5xl mx-auto">
            <div className="vintage-card rounded-xl p-6 sm:p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative" style={{backgroundImage: 'url(/textures/card-texture.png)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
              <div className="relative z-10">
              <div className="wax-seal w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6">
                <Lock className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-charcoal dark:text-white">
                Private & Secure
              </h3>
              <div className="vintage-divider mb-3"><span className="text-xs">✦</span></div>
              <p className="text-sm sm:text-base text-charcoal/60 dark:text-white/60 leading-relaxed">
                Your entries are encrypted and protected. Only you can access your thoughts.
              </p>
              </div>
            </div>

            <div className="vintage-card rounded-xl p-6 sm:p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative" style={{backgroundImage: 'url(/textures/card-texture.png)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
              <div className="relative z-10">
              <div className="wax-seal w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-charcoal dark:text-white">
                Rich Writing
              </h3>
              <div className="vintage-divider mb-3"><span className="text-xs">✦</span></div>
              <p className="text-sm sm:text-base text-charcoal/60 dark:text-white/60 leading-relaxed">
                Beautiful WYSIWYG editor with image support. Express yourself fully.
              </p>
              </div>
            </div>

            <div className="vintage-card rounded-xl p-6 sm:p-8 text-center sm:col-span-2 md:col-span-1 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative" style={{backgroundImage: 'url(/textures/card-texture.png)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
              <div className="relative z-10">
              <div className="wax-seal w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6">
                <Download className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-charcoal dark:text-white">
                Export Anytime
              </h3>
              <div className="vintage-divider mb-3"><span className="text-xs">✦</span></div>
              <p className="text-sm sm:text-base text-charcoal/60 dark:text-white/60 leading-relaxed">
                Your data, your control. Export your diary entries whenever you want.
              </p>
              </div>
            </div>
          </div>

          {/* Vintage ornament */}
          <div className="vintage-flourish mt-16 sm:mt-20 mb-16 sm:mb-20">✦ ❋ ✦</div>

          {/* Call to Action Section — Vintage framed card */}
          <div className="vintage-card vintage-frame rounded-xl sm:rounded-2xl p-8 sm:p-10 lg:p-12 max-w-2xl mx-auto candlelight-glow">
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="wax-seal w-14 h-14">
                  <Book className="w-6 h-6" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-charcoal dark:text-teal mb-3 sm:mb-4">
                Begin Your Journey
              </h2>
              <div className="vintage-divider max-w-[200px] mx-auto mb-4">
                <span className="text-xs">❦</span>
              </div>
              <p className="text-charcoal/70 dark:text-white/70 mb-6 sm:mb-8 text-base sm:text-lg font-body italic">
                Join others who&apos;ve made journaling a daily habit.
              </p>
              <Link 
                href="/signup"
                className="btn-vintage inline-block text-base sm:text-lg"
              >
                📖 Create Your Diary
              </Link>
            </div>
          </div>

          {/* Footer with vintage flourish */}
          <div className="mt-12 sm:mt-16 lg:mt-20">
            <div className="vintage-divider max-w-xs mx-auto mb-4">
              <span className="text-xs">✦</span>
            </div>
            <p className="text-xs sm:text-sm text-charcoal/50 dark:text-white/50 font-ui">
              © 2025 Noted. Your thoughts, forever private.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
