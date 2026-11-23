/* Service worker – Osmo Setări
   Când schimbi ceva (ex. presets.js), mărește VERSION: v1 → v2 → v3 ...
   Telefonul va descărca automat versiunea nouă la următoarea deschidere cu internet. */
const VERSION = "v5";
const CACHE = "osmo-setari-" + VERSION;
const FILES = [
  "./",
  "./index.html",
  "./presets.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Răspunde instant din cache (merge offline) și, în fundal,
   aduce versiunea nouă de pe internet dacă există. */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request, { ignoreSearch: true }).then(cached => {
        const fresh = fetch(e.request).then(res => {
          if (res && res.ok && new URL(e.request.url).origin === location.origin) {
            cache.put(e.request, res.clone());
          }
          return res;
        }).catch(() => cached || (e.request.mode === "navigate" ? cache.match("./index.html") : undefined));
        return cached || fresh;
      })
    )
  );
});
