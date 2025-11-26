import { useEffect, useState } from 'react';

// Extend ServiceWorkerRegistration type to include sync (not in all browsers)
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync?: SyncManager;
}

interface SyncStatus {
  isOnline: boolean;
  hasPendingSync: boolean;
  lastSyncTime: number | null;
}

/**
 * Hook to manage PWA background sync functionality
 * Handles offline operations and syncs when connection is restored
 */
export function useBackgroundSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    hasPendingSync: false,
    lastSyncTime: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Update online status
    const handleOnline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: true }));
      
      // Trigger background sync when coming online
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          const extReg = registration as ExtendedServiceWorkerRegistration;
          if (extReg.sync) {
            return extReg.sync.register('diary-entry-sync');
          }
        }).catch((error) => {
          console.error('Background sync registration failed:', error);
        });
      }
    };

    const handleOffline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending sync operations on mount
    checkPendingOperations();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPendingOperations = async () => {
    try {
      const db = await openDB();
      const operations = await getAllPendingOperations(db);
      setSyncStatus((prev) => ({
        ...prev,
        hasPendingSync: operations.length > 0,
      }));
    } catch (error) {
      console.error('Failed to check pending operations:', error);
    }
  };

  const queueOperation = async (url: string, options: RequestInit) => {
    try {
      const db = await openDB();
      const operation = {
        url,
        method: options.method || 'POST',
        headers: options.headers ? Object.fromEntries(Object.entries(options.headers)) : {},
        body: options.body ? options.body.toString() : '',
        timestamp: Date.now(),
      };

      await addPendingOperation(db, operation);
      setSyncStatus((prev) => ({ ...prev, hasPendingSync: true }));

      // Register background sync
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        const extReg = registration as ExtendedServiceWorkerRegistration;
        if (extReg.sync) {
          await extReg.sync.register('diary-entry-sync');
        }
      }

      return { queued: true };
    } catch (error) {
      console.error('Failed to queue operation:', error);
      throw error;
    }
  };

  return {
    ...syncStatus,
    queueOperation,
    checkPendingOperations,
  };
}

// IndexedDB helpers
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('diary-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pending-operations')) {
        db.createObjectStore('pending-operations', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllPendingOperations(db: IDBDatabase): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-operations'], 'readonly');
    const store = transaction.objectStore('pending-operations');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function addPendingOperation(db: IDBDatabase, operation: any): Promise<number> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-operations'], 'readwrite');
    const store = transaction.objectStore('pending-operations');
    const request = store.add(operation);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as number);
  });
}

/**
 * Hook to request notification permission
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  return {
    permission,
    requestPermission,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
  };
}
