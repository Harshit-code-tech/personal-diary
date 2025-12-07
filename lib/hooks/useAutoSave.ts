// Auto-save hook with debouncing
import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { countWords } from '@/lib/sanitize'

interface AutoSaveOptions {
  entryId: string
  title: string
  content: string
  delay?: number // milliseconds
  enabled?: boolean
  onSave?: () => void
  onError?: (error: Error) => void
}

export function useAutoSave({
  entryId,
  title,
  content,
  delay = 3000, // 3 seconds
  enabled = true,
  onSave,
  onError,
}: AutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedRef = useRef({ title, content })
  const supabase = createClient()
  const savingRef = useRef(false)

  const autoSave = useCallback(async () => {
    // Don't save if nothing changed or if currently saving
    if (
      (lastSavedRef.current.title === title && lastSavedRef.current.content === content) ||
      savingRef.current ||
      !enabled
    ) {
      return
    }

    // Don't save if content is empty
    if (!title.trim() || !content.trim()) {
      return
    }

    savingRef.current = true

    try {
      // Calculate word count securely using DOMPurify
      const wordCount = countWords(content)

      const { error } = await supabase
        .from('entries')
        .update({
          title: title.trim(),
          content: content,
          word_count: wordCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)

      if (error) throw error

      lastSavedRef.current = { title, content }
      
      // Show subtle toast
      toast.success('Auto-saved', {
        duration: 1500,
        style: {
          background: '#10B981',
          color: '#fff',
          fontSize: '14px',
        },
      })

      onSave?.()
    } catch (error) {
      console.error('Auto-save error:', error)
      onError?.(error as Error)
      
      toast.error('Auto-save failed', {
        duration: 2000,
      })
    } finally {
      savingRef.current = false
    }
  }, [entryId, title, content, enabled, onSave, onError, supabase])

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for auto-save
    if (enabled) {
      timeoutRef.current = setTimeout(() => {
        autoSave()
      }, delay)
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [title, content, delay, enabled, autoSave])

  // Save on unmount (component cleanup)
  useEffect(() => {
    return () => {
      if (enabled && (lastSavedRef.current.title !== title || lastSavedRef.current.content !== content)) {
        // Trigger one final save
        autoSave()
      }
    }
  }, [])

  return {
    isSaving: savingRef.current,
    lastSaved: lastSavedRef.current,
  }
}
