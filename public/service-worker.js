const CACHE_NAME = 'axe-map-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: Cache-first strategy with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip API requests (don't cache dynamic data)
  if (request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Return cached version but fetch update in background
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
            });
          }
        }).catch(() => {});
        return cached;
      }
      
      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        
        // Clone and cache the response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // Offline fallback
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Background Sync for pending uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-terreiros') {
    event.waitUntil(syncPendingTerreiros());
  }
});

// Push notifications (future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'Axé Map', {
        body: data.body || 'Novo terreiro mapeado!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: data.url || '/'
      })
    );
  }
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

async function syncPendingTerreiros() {
  try {
    const db = await openDB('axe-map-pending', 1);
    const pending = await db.getAll('terreiros');
    
    for (const terreiro of pending) {
      try {
        const response = await fetch('/api/terreiros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(terreiro)
        });
        
        if (response.ok) {
          await db.delete('terreiros', terreiro.id);
        }
      } catch (err) {
        console.error('Sync failed for terreiro:', terreiro.id);
      }
    }
  } catch (err) {
    console.error('Background sync error:', err);
  }
}

// IndexedDB helper
function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve({
      getAll: (store) => new Promise((res, rej) => {
        const tx = request.result.transaction(store, 'readonly');
        const st = tx.objectStore(store);
        const q = st.getAll();
        q.onsuccess = () => res(q.result);
        q.onerror = () => rej(q.error);
      }),
      delete: (store, key) => new Promise((res, rej) => {
        const tx = request.result.transaction(store, 'readwrite');
        const st = tx.objectStore(store);
        const q = st.delete(key);
        q.onsuccess = () => res();
        q.onerror = () => rej(q.error);
      })
    });
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('terreiros')) {
        db.createObjectStore('terreiros', { keyPath: 'id' });
      }
    };
  });
}
