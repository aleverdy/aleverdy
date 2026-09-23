/* Rutin service worker: menyimpan aplikasi untuk offline dan menangani klik notifikasi. */
const CACHE = 'rutin-v2';
// Tanpa './': host berkas statis seperti githack tidak menyajikan folder, hanya berkas.
const SHELL = ['index.html', 'style.css', 'app.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Jaringan dulu supaya perubahan langsung terlihat; cache dipakai saat offline.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: sameOrigin }).then(r => r || caches.match('index.html')))
  );
});

self.addEventListener('notificationclick', e => {
  const { id, date } = e.notification.data || {};
  const done = e.action === 'done' && id;
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = all.find(c => new URL(c.url).pathname.startsWith(new URL(self.registration.scope).pathname));
    if (client) {
      if (done) client.postMessage({ type: 'done', id, date });
      return client.focus();
    }
    const q = done ? `?done=${encodeURIComponent(id)}&date=${encodeURIComponent(date || '')}` : '';
    return self.clients.openWindow('index.html' + q);
  })());
});
