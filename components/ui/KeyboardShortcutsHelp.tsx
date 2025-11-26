'use client'

import { useState, useEffect } from 'react'
import { X, Command, Keyboard } from 'lucide-react'
import { useGlobalShortcuts } from '@/lib/hooks/useKeyboardShortcuts'

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)
  const shortcuts = useGlobalShortcuts()

  // Listen for ? key to toggle help
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
      // Also listen for Ctrl+/ or Cmd+/
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 bg-gold dark:bg-teal text-white rounded-full shadow-lg hover:opacity-90 transition-opacity z-40"
        aria-label="Keyboard Shortcuts"
        title="Press ? for keyboard shortcuts"
      >
        <Keyboard className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-graphite rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-graphite border-b border-charcoal/10 dark:border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold/10 dark:bg-teal/10 rounded-lg">
              <Keyboard className="w-5 h-5 text-gold dark:text-teal" />
            </div>
            <h2 className="text-2xl font-bold text-charcoal dark:text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors active:scale-95"
            aria-label="Close keyboard shortcuts"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
            >
              <span className="text-charcoal dark:text-white font-medium">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {(shortcut.ctrl || shortcut.meta) && (
                  <>
                    <kbd className="px-2 py-1 bg-charcoal/10 dark:bg-white/10 border border-charcoal/20 dark:border-white/20 rounded text-xs font-mono text-charcoal dark:text-white">
                      {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? (
                        <Command className="w-3 h-3 inline" />
                      ) : (
                        'Ctrl'
                      )}
                    </kbd>
                    <span className="text-charcoal/40 dark:text-white/40">+</span>
                  </>
                )}
                {shortcut.shift && (
                  <>
                    <kbd className="px-2 py-1 bg-charcoal/10 dark:bg-white/10 border border-charcoal/20 dark:border-white/20 rounded text-xs font-mono text-charcoal dark:text-white">
                      Shift
                    </kbd>
                    <span className="text-charcoal/40 dark:text-white/40">+</span>
                  </>
                )}
                <kbd className="px-2 py-1 bg-charcoal/10 dark:bg-white/10 border border-charcoal/20 dark:border-white/20 rounded text-xs font-mono text-charcoal dark:text-white uppercase">
                  {shortcut.key}
                </kbd>
              </div>
            </div>
          ))}

          {/* Help Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gold/10 dark:bg-teal/10 border border-gold/20 dark:border-teal/20">
            <span className="text-charcoal dark:text-white font-medium">
              Toggle this help
            </span>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white dark:bg-charcoal border border-charcoal/20 dark:border-white/20 rounded text-xs font-mono text-charcoal dark:text-white">
                ?
              </kbd>
              <span className="text-charcoal/40 dark:text-white/40">or</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white dark:bg-charcoal border border-charcoal/20 dark:border-white/20 rounded text-xs font-mono text-charcoal dark:text-white">
                  Ctrl
                </kbd>
                <span className="text-charcoal/40 dark:text-white/40">+</span>
                <kbd className="px-2 py-1 bg-white dark:bg-charcoal border border-charcoal/20 dark:border-white/20 rounded text-xs font-mono text-charcoal dark:text-white">
                  /
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-charcoal/5 dark:bg-white/5 text-center text-sm text-charcoal/60 dark:text-white/60">
          Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-charcoal border border-charcoal/20 dark:border-white/20 rounded text-xs font-mono">Esc</kbd> to close
        </div>
      </div>
    </div>
  )
}
