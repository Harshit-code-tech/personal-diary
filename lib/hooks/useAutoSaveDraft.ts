import { useState, useEffect, useCallback, useRef } from 'react'

export interface DraftData {
  title?: string
  content?: string
  mood?: string
  entryDate?: string
  tags?: string[]
  selectedPeople?: string[]
  selectedFolders?: string[]
  lastSaved?: number
}

interface UseAutoSaveDraftOptions {
  key: string // Unique key for this draft (e.g., 'new-entry' or 'edit-entry-{id}')
  autoSaveDelay?: number // Delay in ms before auto-saving (default: 5000)
  onSave?: (draft: DraftData) => void // Callback when draft is saved
  onRestore?: (draft: DraftData) => void // Callback when draft is restored
}

interface UseAutoSaveDraftReturn {
  saveDraft: (data: DraftData) => void
  loadDraft: () => DraftData | null
  clearDraft: () => void
  hasDraft: boolean
  lastSaved: Date | null
  isDirty: boolean
}

/**
 * Hook for auto-saving and restoring drafts to/from localStorage
 * 
 * Features:
 * - Auto-saves draft after inactivity period
 * - Tracks dirty state (has unsaved changes)
 * - Provides manual save/load/clear functions
 * - Shows last saved timestamp
 * - Debounces rapid changes
 * 
 * Usage:
 * ```tsx
 * const { saveDraft, loadDraft, clearDraft, hasDraft, lastSaved, isDirty } = useAutoSaveDraft({
 *   key: 'new-entry',
 *   autoSaveDelay: 3000,
 *   onRestore: (draft) => {
 *     setTitle(draft.title || '')
 *     setContent(draft.content || '')
 *   }
 * })
 * 
 * // Auto-save on changes
 * useEffect(() => {
 *   saveDraft({ title, content, mood })
 * }, [title, content, mood])
 * 
 * // Clear draft after successful submit
 * await createEntry()
 * clearDraft()
 * ```
 */
export function useAutoSaveDraft({
  key,
  autoSaveDelay = 5000,
  onSave,
  onRestore,
}: UseAutoSaveDraftOptions): UseAutoSaveDraftReturn {
  const [hasDraft, setHasDraft] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataRef = useRef<DraftData | null>(null)
  const isSavingRef = useRef(false) // Prevent concurrent saves
  const hasRestoredRef = useRef(false) // Track if we've already restored

  const storageKey = `draft-${key}`

  // Load draft from localStorage
  const loadDraft = useCallback((): DraftData | null => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return null

      const draft = JSON.parse(stored) as DraftData
      lastDataRef.current = draft
      return draft
    } catch (error) {
      console.error('Failed to load draft:', error)
      return null
    }
  }, [storageKey])

  // Check if draft exists whenever storage key changes
  useEffect(() => {
    // Reset restoration flag when key changes
    hasRestoredRef.current = false
    
    const draft = loadDraft()
    if (draft) {
      hasRestoredRef.current = true
      setHasDraft(true)
      setLastSaved(draft.lastSaved ? new Date(draft.lastSaved) : null)
      setIsDirty(false)
      lastDataRef.current = draft
      onRestore?.(draft)
    } else {
      // No draft found, reset state
      setHasDraft(false)
      setLastSaved(null)
      setIsDirty(false)
      lastDataRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]) // Re-run when storage key changes (user/folder changes)

  // Save draft to localStorage
  const saveDraft = useCallback((data: DraftData) => {
    // Don't save if currently saving (prevent concurrent saves)
    if (isSavingRef.current) {
      return
    }

    const serializedData = JSON.stringify(data)
    const lastSerializedData = lastDataRef.current ? JSON.stringify(lastDataRef.current) : null

    // Don't save if data hasn't changed (prevents save on restore)
    if (serializedData === lastSerializedData) {
      return
    }

    lastDataRef.current = data
    
    // Only set dirty if not already dirty (prevent unnecessary re-renders)
    setIsDirty(prevDirty => prevDirty ? prevDirty : true)

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      isSavingRef.current = true // Set saving flag
      
      const draftWithTimestamp = {
        ...data,
        lastSaved: Date.now(),
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(draftWithTimestamp))
        setHasDraft(true)
        setLastSaved(new Date())
        setIsDirty(false)
        onSave?.(draftWithTimestamp)
      } catch (error) {
        console.error('Failed to save draft:', error)
      } finally {
        isSavingRef.current = false // Clear saving flag
      }
    }, autoSaveDelay)
  }, [storageKey, autoSaveDelay, onSave])

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      setHasDraft(false)
      setLastSaved(null)
      setIsDirty(false)
      lastDataRef.current = null

      // Clear any pending auto-save
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
    } catch (error) {
      console.error('Failed to clear draft:', error)
    }
  }, [storageKey])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    lastSaved,
    isDirty,
  }
}

/**
 * Utility function to format time ago
 * @param date Date object
 * @returns Formatted string like "2 minutes ago"
 */
export function formatTimeAgo(date: Date | null): string {
  if (!date) return ''

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec} seconds ago`
  if (diffMin === 1) return '1 minute ago'
  if (diffMin < 60) return `${diffMin} minutes ago`
  if (diffHour === 1) return '1 hour ago'
  if (diffHour < 24) return `${diffHour} hours ago`
  if (diffDay === 1) return '1 day ago'
  return `${diffDay} days ago`
}
