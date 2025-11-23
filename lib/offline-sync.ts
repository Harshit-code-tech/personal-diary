// Offline sync utilities for PWA
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface DiaryDB extends DBSchema {
  pendingEntries: {
    key: string
    value: {
      id: string
      action: 'create' | 'update' | 'delete'
      data: any
      timestamp: number
    }
  }
  cachedEntries: {
    key: string
    value: {
      id: string
      data: any
      cachedAt: number
    }
  }
}

let db: IDBPDatabase<DiaryDB>

// Initialize IndexedDB
export async function initOfflineDB() {
  if (db) return db

  db = await openDB<DiaryDB>('diary-offline', 1, {
    upgrade(db) {
      // Store for pending operations
      if (!db.objectStoreNames.contains('pendingEntries')) {
        db.createObjectStore('pendingEntries', { keyPath: 'id' })
      }
      
      // Store for cached data
      if (!db.objectStoreNames.contains('cachedEntries')) {
        db.createObjectStore('cachedEntries', { keyPath: 'id' })
      }
    },
  })

  return db
}

// Save pending operation for sync
export async function savePendingOperation(
  action: 'create' | 'update' | 'delete',
  data: any
) {
  const db = await initOfflineDB()
  const id = data.id || `temp_${Date.now()}`

  await db.put('pendingEntries', {
    id,
    action,
    data,
    timestamp: Date.now(),
  })

  return id
}

// Get all pending operations
export async function getPendingOperations() {
  const db = await initOfflineDB()
  return await db.getAll('pendingEntries')
}

// Remove synced operation
export async function removePendingOperation(id: string) {
  const db = await initOfflineDB()
  await db.delete('pendingEntries', id)
}

// Cache entry for offline viewing
export async function cacheEntry(entry: any) {
  const db = await initOfflineDB()
  await db.put('cachedEntries', {
    id: entry.id,
    data: entry,
    cachedAt: Date.now(),
  })
}

// Get cached entries
export async function getCachedEntries() {
  const db = await initOfflineDB()
  const cached = await db.getAll('cachedEntries')
  return cached.map(c => c.data)
}

// Clear old cached entries (older than 7 days)
export async function clearOldCache() {
  const db = await initOfflineDB()
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  
  const allCached = await db.getAll('cachedEntries')
  
  for (const cached of allCached) {
    if (cached.cachedAt < sevenDaysAgo) {
      await db.delete('cachedEntries', cached.id)
    }
  }
}

// Sync pending operations when online
export async function syncPendingOperations(supabase: any) {
  const pending = await getPendingOperations()
  const results = { success: 0, failed: 0 }

  for (const operation of pending) {
    try {
      switch (operation.action) {
        case 'create':
          await supabase.from('entries').insert(operation.data)
          break
        case 'update':
          await supabase
            .from('entries')
            .update(operation.data)
            .eq('id', operation.data.id)
          break
        case 'delete':
          await supabase.from('entries').delete().eq('id', operation.data.id)
          break
      }
      
      await removePendingOperation(operation.id)
      results.success++
    } catch (error) {
      console.error('Sync failed for operation:', operation, error)
      results.failed++
    }
  }

  return results
}

// Check if online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

// Listen for online/offline events
export function setupOnlineListener(callback: (online: boolean) => void) {
  if (typeof window === 'undefined') return

  window.addEventListener('online', () => callback(true))
  window.addEventListener('offline', () => callback(false))

  return () => {
    window.removeEventListener('online', () => callback(true))
    window.removeEventListener('offline', () => callback(false))
  }
}
