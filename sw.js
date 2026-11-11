const C = 'teorica-20261111160032';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  // keep the copy of extra.json (questions Tom added) across app updates
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C && k !== 'teorica-extra').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // only this site's own files; API calls (Anthropic, GitHub) go straight to the network
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/extra.json')) {
    // questions added from the phone: newest copy when online, last saved copy offline
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then(res => {
      if (res && res.ok) { const cp = res.clone(); caches.open('teorica-extra').then(c => c.put('extra.json', cp)); }
      return res;
    }).catch(() => caches.open('teorica-extra').then(c => c.match('extra.json')).then(r => r || new Response('{"questions":[]}', { headers: { 'Content-Type': 'application/json' } }))));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(cached => {
    const net = fetch(e.request).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return res; }).catch(() => cached);
    return cached || net;
  }));
});
