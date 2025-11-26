'use client'

import { useGlobalShortcuts } from '@/lib/hooks/useKeyboardShortcuts'

export default function KeyboardShortcutsProvider() {
  useGlobalShortcuts()
  return null
}
