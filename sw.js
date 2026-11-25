/* Service worker – Osmo Setări

   Ce face:
   - salvează aplicația pe telefon, ca să meargă offline;
   - o deschide instant din memorie și verifică în fundal dacă ai urcat ceva nou pe GitHub;
   - dacă da, aplicația îți arată „Versiune nouă disponibilă”. Nu se mai reîncarcă singură.
   - o versiune nouă a acestui fișier se activează singură (fără așteptare), deci un simplu
     refresh aduce deja versiunea nouă; bannerul nu mai rămâne agățat.

   VERSION: crește-o la fiecare commit care schimbă fișiere ale aplicației (vezi CLAUDE.md, regula 3). */
const VERSION = "v15";
const CACHE = "osmo-setari-" + VERSION;

/* Fără acestea aplicația nu poate porni offline → trebuie să existe toate */
const CORE = ["./", "./index.html", "./boot.js", "./app.js", "./presets.js"];
/* Utile, dar dacă una lipsește, aplicația tot se instalează */
const EXTRA = ["./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png", "./splash.jpg"];

/* Fișierele în care urmărim schimbări (ca să-ți arătăm „Versiune nouă”) */
const WATCH = /(\/|\/index\.html|\/boot\.js|\/app\.js|\/presets\.js)$/;

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(CORE.map(f => new Request(f, { cache: "reload" })))
        .then(() => Promise.all(EXTRA.map(f => c.add(new Request(f, { cache: "reload" })).catch(() => {}))))
    )
  );
  /* Trece imediat la versiunea nouă. Pagina deschisă rămâne cum e; ce e nou apare la
     următoarea încărcare (refresh sau „Actualizează”). */
  self.skipWaiting();
});

self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("osmo-setari-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Același fișier? Comparăm ETag / Last-Modified (GitHub Pages le trimite), altfel conținutul. */
async function differs(oldRes, newRes) {
  const tag = r => r.headers.get("etag") || r.headers.get("last-modified");
  const a = tag(oldRes), b = tag(newRes);
  if (a && b) return a !== b;
  const [x, y] = await Promise.all([oldRes.clone().text(), newRes.clone().text()]);
  return x !== y;
}

async function notify() {
  /* mică pauză: la deschidere, fereastra aplicației trebuie să fie gata să primească mesajul */
  await new Promise(r => setTimeout(r, 1500));
  const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  list.forEach(c => c.postMessage({ type: "CONTENT_UPDATED" }));
}

/* Aduce un fișier proaspăt de pe server, îl salvează și spune dacă s-a schimbat. */
async function refresh(cache, key, request) {
  const res = await fetch(request);
  if (!res || !res.ok || res.type !== "basic") return { res, changed: false };
  const old = await cache.match(key, { ignoreSearch: true });
  const changed = !!old && await differs(old, res);
  await cache.put(key, res.clone());
  return { res, changed };
}

/* Răspunde instant din memorie (merge offline) și aduce în fundal versiunea de pe internet. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const nav = req.mode === "navigate";
  /* cheia de cache = adresa fără „?…”, ca să existe o singură copie pe fișier */
  const key = nav ? new URL("./", self.registration.scope).href : url.origin + url.pathname;
  const watched = nav || WATCH.test(url.pathname);
  /* fișierele urmărite se verifică mereu la server (altfel browserul poate da o copie veche de ~10 min) */
  const fresh = watched ? new Request(url.origin + url.pathname, { cache: "no-cache", credentials: "same-origin" }) : req;

  /* ține service worker-ul treaz până termină verificarea din fundal */
  let finish;
  e.waitUntil(new Promise(r => { finish = r; }));

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(key, { ignoreSearch: true });

    const jobs = [refresh(cache, key, fresh)];
    /* la fiecare deschidere a aplicației verificăm și presetările + codul aplicației */
    if (nav) {
      for (const f of ["./presets.js", "./app.js", "./boot.js"]) {
        const fk = new URL(f, self.registration.scope).href;
        jobs.push(refresh(cache, fk, new Request(fk, { cache: "no-cache", credentials: "same-origin" })));
      }
    }
    const background = Promise.all(jobs.map(j => j.catch(() => ({ changed: false }))))
      .then(r => { if (r.some(x => x.changed)) return notify(); })
      .finally(finish);

    if (cached) return cached;
    try {
      const { res } = await jobs[0];
      return res;
    } catch (err) {
      if (nav) {
        const fallback = await cache.match("./index.html");
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
