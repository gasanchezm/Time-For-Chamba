const CACHE_NAME = 'time-for-chamba-v10';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});

// ── NOTIFICATION from app ──────────────────────────────────────────
self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'SHOW_REMINDER') return;
  const { title, body, slot = 'reminder', badge } = e.data;
  const tag = 'chamba-' + slot;

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:     './icon-192.png',
      badge:    badge || './icon-192.png',
      tag,
      renotify: true,
      vibrate:  [200, 100, 200, 100, 200],
      data:     { url: './', slot },
      // Actions work on Android Chrome
      actions: [
        { action: 'open', title: '✅ Registrar', icon: './icon-192.png' },
        { action: 'dismiss', title: '✕ Luego' },
      ],
    })
  );
});

// ── NOTIFICATION CLICK ─────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('index.html') || client.url.endsWith('/')) {
          return client.focus();
        }
      }
      return clients.openWindow('./index.html');
    })
  );
});
