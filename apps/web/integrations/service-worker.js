// Heart Atlas service worker. post-build.ts prepends `const CONFIG = {...}` and writes the
// result to dist/sw.js. Plain JavaScript on purpose: it is copied, not bundled.

const PRECACHE = `heart-atlas-precache-${CONFIG.version}`;
const PAGES = 'heart-atlas-pages';
const MEDIA = 'heart-atlas-media';
const MEDIA_FILE = /\.(glb|gltf|bin|ktx2|mp3|ogg|wav|webm)$/;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PRECACHE).then((cache) => cache.addAll(CONFIG.precache)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('heart-atlas-precache-') && key !== PRECACHE)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
});

// The page asks for this when the reader accepts the "new version" notice.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function segments(url) {
  return url.pathname.slice(CONFIG.base.length).split('/');
}

function localeOf(url) {
  const first = segments(url)[0];
  return CONFIG.locales.includes(first) ? first : CONFIG.defaultLocale;
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)));
}

async function page(request) {
  const url = new URL(request.url);
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES);
      await cache.put(request, response.clone());
      await trim(PAGES, 100);
    }
    return response;
  } catch {
    return (
      (await caches.match(request, { ignoreSearch: true, ignoreVary: true })) ??
      (await caches.match(`${CONFIG.base}${localeOf(url)}/offline/`, { ignoreVary: true })) ??
      Response.error()
    );
  }
}

async function media(request) {
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(MEDIA);
    await cache.put(request, response.clone());
    await trim(MEDIA, 30);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(CONFIG.base)) return;
  // Embedded modules live inside other sites; leave them to the network.
  if (segments(url)[1] === 'embed') return;

  if (request.mode === 'navigate') {
    event.respondWith(page(request));
  } else if (MEDIA_FILE.test(url.pathname)) {
    event.respondWith(media(request));
  } else {
    // Pagefind requests pagefind-entry.json?ts=…, so the query is ignored when matching.
    // ignoreVary: module imports send Origin, and a `Vary: Origin` response would never match.
    const ignoreSearch = url.pathname.startsWith(`${CONFIG.base}pagefind/`);
    event.respondWith(
      caches
        .match(request, { ignoreSearch, ignoreVary: true })
        .then((cached) => cached ?? fetch(request)),
    );
  }
});
