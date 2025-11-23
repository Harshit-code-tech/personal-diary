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
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : true
        const metaMatch = shortcut.meta ? event.metaKey : true
        const shiftMatch = shortcut.shift ? event.shiftKey : true
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch) {
          // Check if Ctrl or Meta is actually required
          if ((shortcut.ctrl || shortcut.meta) && (event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            shortcut.action()
          }
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
      key: 'n',
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
