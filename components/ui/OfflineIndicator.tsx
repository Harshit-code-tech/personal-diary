'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { isOnline, setupOnlineListener, syncPendingOperations, getPendingOperations } from '@/lib/offline-sync'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export default function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setOnline(isOnline())
    
    const cleanup = setupOnlineListener((status) => {
      setOnline(status)
      if (status) {
        // Auto-sync when coming back online
        handleSync()
      }
    })

    // Check pending operations count
    checkPending()
    const interval = setInterval(checkPending, 10000) // Check every 10s

    return () => {
      cleanup?.()
      clearInterval(interval)
    }
  }, [])

  const checkPending = async () => {
    const pending = await getPendingOperations()
    setPendingCount(pending.length)
  }

  const handleSync = async () => {
    if (!online || syncing) {
      return
    }
    
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
    } catch (error) {
      toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  if (online && pendingCount === 0) return null

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
        online 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        {online ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {online ? 'Online' : 'Offline'}
          {pendingCount > 0 && ` • ${pendingCount} pending`}
        </span>
        {online && pendingCount > 0 && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </div>
  )
}
