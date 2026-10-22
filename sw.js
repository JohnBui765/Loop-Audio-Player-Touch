// Echo Loop+ Touch service worker: keeps the app itself available with no internet.
// Your recordings, play counts and flags live in the app's database, not here.
// Bump the version whenever you upload changed files, so phones pick them up.
// The "elt-" prefix keeps this cache apart from Echo Loop+ ("elp-"), Echo Loop+ Desktop ("eld-") and Echo Loop ("echo-loop-").
const CACHE = 'elt-v5';
const SHELL = ['./', './index.html', './worklet.js', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('elt-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Serve from the cache first (instant, works offline), refresh the cache in the background.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;

  let saved = Promise.resolve();
  const network = fetch(req).then((res) => {
    if (res && res.ok && res.type === 'basic' && !res.redirected) {
      const copy = res.clone();
      saved = caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
    }
    return res;
  });
  event.waitUntil(network.then(() => saved, () => {}));
  event.respondWith(
    caches.open(CACHE)
      .then((c) => c.match(req, { ignoreSearch: true }))
      .then((hit) => hit || network.catch(() => (req.mode === 'navigate' ? caches.open(CACHE).then((c) => c.match('./index.html')) : undefined)))
      .then((res) => res || new Response('Offline', { status: 503, statusText: 'Offline' }))
  );
});
