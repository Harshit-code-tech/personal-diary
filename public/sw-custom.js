// Custom service worker enhancements for background sync
// This extends the auto-generated workbox service worker

const SYNC_TAG = 'diary-entry-sync';
const PENDING_QUEUE = 'pending-operations';

// Background sync for offline entry changes
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncPendingOperations());
  }
});

async function syncPendingOperations() {
  try {
    // Open IndexedDB to get pending operations
    const db = await openDB();
    const operations = await getAllPendingOperations(db);
    
    for (const operation of operations) {
      try {
        // Attempt to sync the operation
        const response = await fetch(operation.url, {
          method: operation.method,
          headers: operation.headers,
          body: operation.body,
        });

        if (response.ok) {
          // Remove from pending queue if successful
          await removePendingOperation(db, operation.id);
        }
      } catch (error) {
        console.error('Failed to sync operation:', operation.id, error);
        // Leave in queue for next sync attempt
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('diary-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(PENDING_QUEUE)) {
        db.createObjectStore(PENDING_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllPendingOperations(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PENDING_QUEUE], 'readonly');
    const store = transaction.objectStore(PENDING_QUEUE);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removePendingOperation(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PENDING_QUEUE], 'readwrite');
    const store = transaction.objectStore(PENDING_QUEUE);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Enhanced offline handling with better error messages
self.addEventListener('fetch', (event) => {
  // Handle API requests specially
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(async (error) => {
          // If offline and it's a state-changing request, queue it
          if (event.request.method !== 'GET' && 'sync' in self.registration) {
            const db = await openDB();
            const operation = {
              url: event.request.url,
              method: event.request.method,
              headers: Object.fromEntries(event.request.headers.entries()),
              body: await event.request.clone().text(),
              timestamp: Date.now(),
            };
            
            await addPendingOperation(db, operation);
            
            // Register background sync
            await self.registration.sync.register(SYNC_TAG);
            
            // Return a response indicating the operation was queued
            return new Response(
              JSON.stringify({ 
                queued: true, 
                message: 'Operation saved and will sync when online' 
              }),
              { 
                status: 202,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
          
          throw error;
        })
    );
  }
});

function addPendingOperation(db, operation) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PENDING_QUEUE], 'readwrite');
    const store = transaction.objectStore(PENDING_QUEUE);
    const request = store.add(operation);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notification for sync completion (optional)
self.addEventListener('sync', async (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(
      syncPendingOperations().then(() => {
        // Optionally notify user that sync completed
        if (self.Notification && Notification.permission === 'granted') {
          self.registration.showNotification('Diary Synced', {
            body: 'Your offline changes have been synced successfully',
            icon: '/icons/icon-192x192.svg',
            badge: '/icons/icon-192x192.svg',
            tag: 'sync-complete',
          });
        }
      })
    );
  }
});

console.log('Custom service worker loaded with background sync support');
