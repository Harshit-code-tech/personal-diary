import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        
        // Support both Ctrl (Windows/Linux) and Cmd (Mac)
        const modifierPressed = (shortcut.ctrl || shortcut.meta) 
          ? (event.ctrlKey || event.metaKey) 
          : true
        
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey

        if (keyMatch && modifierPressed && shiftMatch) {
          event.preventDefault()
          shortcut.action()
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Global keyboard shortcuts hook for app pages
export function useGlobalShortcuts() {
  const router = useRouter()

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'e',
      ctrl: true,
      meta: true,
      action: () => router.push('/app/new'),
      description: 'New Entry',
    },
    {
      key: 'k',
      ctrl: true,
      meta: true,
      action: () => router.push('/app/search'),
      description: 'Search',
    },
    {
      key: ',',
      ctrl: true,
      meta: true,
      action: () => router.push('/app/settings'),
      description: 'Settings',
    },
    {
      key: 'h',
      ctrl: true,
      meta: true,
      action: () => router.push('/app'),
      description: 'Home',
    },
    {
      key: 'i',
      ctrl: true,
      meta: true,
      action: () => router.push('/app/insights'),
      description: 'Insights',
    },
    {
      key: 'p',
      ctrl: true,
      meta: true,
      action: () => router.push('/app/people'),
      description: 'People',
    },
    {
      key: 's',
      ctrl: true,
      meta: true,
      shift: true,
      action: () => router.push('/app/stories'),
      description: 'Stories',
    },
  ]

  useKeyboardShortcuts(shortcuts)

  return shortcuts
}
