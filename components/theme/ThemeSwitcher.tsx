'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Cloud } from 'lucide-react'

type Theme = 'light' | 'dark' | 'grey'

const themes = {
  light: {
    name: 'Sunlight on Paper',
    icon: Sun,
    description: 'Bright and cheerful',
    classes: 'bg-paper text-charcoal'
  },
  dark: {
    name: 'Midnight Study',
    icon: Moon,
    description: 'Easy on the eyes',
    classes: 'bg-midnight text-white'
  },
  grey: {
    name: "I'm Tired...",
    icon: Cloud,
    description: 'Neutral and calm',
    classes: 'bg-stone-600 text-stone-100'
  }
}

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load theme from localStorage
    const saved = localStorage.getItem('theme') as Theme
    if (saved && themes[saved]) {
      setCurrentTheme(saved)
      applyTheme(saved)
    }
  }, [])

  const applyTheme = (theme: Theme) => {
    const html = document.documentElement
    html.classList.remove('light', 'dark', 'grey', 'theme-grey')
    
    if (theme === 'grey') {
      html.classList.add('theme-grey')
    } else {
      html.classList.add(theme)
    }
    
    // Set data attribute for CSS
    html.setAttribute('data-theme', theme)
    
    // Save to localStorage
    localStorage.setItem('theme', theme)
  }

  const changeTheme = (theme: Theme) => {
    setCurrentTheme(theme)
    applyTheme(theme)
    setIsOpen(false)
  }

  const CurrentIcon = themes[currentTheme].icon

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg border border-charcoal/20 dark:border-white/20 hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
        title={themes[currentTheme].name}
      >
        <CurrentIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-graphite border border-charcoal/20 dark:border-white/20 rounded-lg shadow-xl z-50 overflow-hidden">
            {Object.entries(themes).map(([key, theme]) => {
              const Icon = theme.icon
              const isActive = currentTheme === key
              return (
                <button
                  key={key}
                  onClick={() => changeTheme(key as Theme)}
                  className={`w-full px-3 py-2.5 flex items-center gap-2 hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors ${isActive ? 'bg-gold/10 dark:bg-teal/10' : ''}`}
                >
                  <Icon className="w-4 h-4 text-charcoal dark:text-white" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{theme.name}</div>
                  </div>
                  {isActive && (
                    <svg className="w-4 h-4 text-gold dark:text-teal" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
