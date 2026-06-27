const CACHE = "attendease-v1";
const OFFLINE = "/offline.html";

const PRECACHE = [
  "/",
  "/sign-in",
  "/offline.html",
  "/manifest.json",
  "/icons/icon.svg",
];

// Install — precache shells
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - API calls → network only (no stale data), fallback offline page on failure
// - Pages → network first, cache fallback
// - Assets (_next/static) → cache first
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // API: network only
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "You are offline." }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Static assets: cache first
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Pages: network first, fallback to offline page
  e.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(request, clone));
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached ?? caches.match(OFFLINE);
      })
  );
});

// Push notifications
self.addEventListener("push", (e) => {
  const data = e.data?.json() ?? {};
  e.waitUntil(
    self.registration.showNotification(data.title ?? "AttendEase", {
      body: data.body ?? "",
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      tag: data.tag ?? "attendease",
      data: { url: data.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});
