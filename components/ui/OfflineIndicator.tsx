'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { isOnline, setupOnlineListener, syncPendingOperations, getPendingOperations } from '@/lib/offline-sync'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

/**
 * Compact connectivity indicator in the bottom-right corner.
 * - Shows a brief "Online" pill that auto-hides after 3 s.
 * - Stays visible when offline or when there are pending syncs.
 * - Positioned bottom-right to avoid overlapping ReminderAppPromo (bottom-left).
 */
export default function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [visible, setVisible] = useState(true)
  const supabase = createClient()

  const checkPending = useCallback(async () => {
    const pending = await getPendingOperations()
    setPendingCount(pending.length)
  }, [])

  const handleSync = useCallback(async () => {
    if (!online || syncing) return
    setSyncing(true)
    try {
      const results = await syncPendingOperations(supabase)
      if (results.success > 0) {
        toast.success(`Synced ${results.success} changes`)
        checkPending()
      }
      if (results.failed > 0) {
        toast.error(`${results.failed} changes failed to sync`)
      }
    } catch {
      toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }, [online, syncing, supabase, checkPending])

  // Auto-hide the "Online" indicator after 3 s unless offline or pending
  useEffect(() => {
    if (online && pendingCount === 0) {
      const t = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(t)
    }
    // Always visible when offline or pending
    setVisible(true)
  }, [online, pendingCount])

  useEffect(() => {
    setOnline(isOnline())

    const cleanup = setupOnlineListener((status) => {
      setOnline(status)
      setVisible(true) // flash on status change
      if (status) handleSync()
    })

    checkPending()
    const interval = setInterval(checkPending, 10000)
    return () => { cleanup?.(); clearInterval(interval) }
  }, [handleSync, checkPending])

  // Fully hidden once faded and online with nothing pending
  if (!visible && online && pendingCount === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6 transition-opacity duration-300">
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg text-white text-xs font-medium transition-colors ${
          online ? 'bg-emerald-500' : 'bg-red-500'
        }`}
      >
        {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        <span>
          {online ? 'Online' : 'Offline'}
          {pendingCount > 0 && ` · ${pendingCount} pending`}
        </span>
        {online && pendingCount > 0 && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="ml-1 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Sync pending changes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </div>
  )
}
