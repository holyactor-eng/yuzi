// Hors ligne : on sert depuis le cache tout de suite et on le met à jour en arrière-plan.
// Sons, moteur et modèle de reconnaissance sont mis en cache au premier usage.
const CACHE = 'yuzi-v18';
const COQUILLE = [
  './', 'index.html', 'style.css', 'app.js', 'content.js', 'exercices.js', 'srs.js', 'progres.js', 'audio.js', 'parole.js', 'tracer.js',
  'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.includes('/spike/')) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const garde = await c.match(e.request, { ignoreSearch: true });
    const frais = () => fetch(e.request).then((r) => {
      if (r.ok || r.type === 'opaque') c.put(e.request, r.clone());
      return r;
    });
    // Moteur et modèle (53 Mo) ne changent pas : jamais retéléchargés en arrière-plan.
    if (garde && url.pathname.includes('/vendor/')) return garde;
    if (garde) {
      e.waitUntil(frais().catch(() => {}));
      return garde;
    }
    return frais();
  }));
});
