/*
 * PWMS Service Worker — Phase 1 (Offline-First Foundation)
 *
 * Scope: cache the static app shell (this single-page HTML file, and any
 * same-origin CSS/JS/icon/font assets) so the application can open with
 * no network connection at all.
 *
 * Explicitly OUT of scope for Phase 1 (do not add here):
 *   - caching or queuing API/Supabase responses
 *   - background sync / retry queues
 *   - conflict resolution or merge logic
 * Those belong to a later phase and are handled in JS (loadDatabase/save),
 * not in this worker.
 */

const CACHE_NAME = "pwms-shell-v2";

// The app shell: everything needed to open the UI offline.
// This is a single-file app today (HTML/CSS/JS all inline in index.html),
// so caching index.html covers the shell; any future same-origin static
// assets (icons, fonts, manifest) can simply be added to this list.
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./api.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        SHELL_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            // Don't let one missing/renamed asset block the whole install —
            // the fetch handler below will still opportunistically cache it later.
            console.warn("[SW] Could not precache", asset, err);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle same-origin GET requests for the app shell.
  // Everything else (Supabase, backend API, cross-origin calls) passes
  // straight through to the network untouched and is never cached —
  // API responses must always be live, never served from cache.
  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isApiLike = url.pathname.includes("/api/") || url.pathname.includes("/rest/") || url.pathname.includes("/supabase");

  if (req.method !== "GET" || !isSameOrigin || isApiLike) {
    return; // let the browser handle it normally (network)
  }

  // Cache-first for the app shell: instant offline load, with a
  // background network fetch to keep the cached copy fresh over time.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached); // offline: fall back to cache on network failure

      return cached || network;
    })
  );
});
