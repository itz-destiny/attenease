const CACHE = "attendease-v2";
const OFFLINE = "/offline.html";
const DB_NAME = "attendease-offline";
const DB_VERSION = 1;
const STORE = "pendingActions";

const PRECACHE = ["/", "/sign-in", "/check-in", "/offline.html", "/manifest.json"];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGetAll(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbDelete(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function dbUpdateError(db, id, error) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const get = store.get(id);
    get.onsuccess = () => {
      const record = { ...get.result, lastError: error, retries: (get.result.retries || 0) + 1 };
      const put = store.put(record);
      put.onsuccess = () => resolve();
      put.onerror = () => reject(put.error);
    };
    get.onerror = () => reject(get.error);
  });
}

// ─── Broadcast to all open tabs ───────────────────────────────────────────────
async function broadcast(msg) {
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach((c) => c.postMessage(msg));
}

// ─── Sync pending actions ─────────────────────────────────────────────────────
async function syncPendingActions() {
  const db = await openDB();
  const actions = await dbGetAll(db);
  if (actions.length === 0) return;

  for (const action of actions) {
    try {
      let url, body;

      if (action.type === "checkIn") {
        url = "/api/attendance/check-in";
        body = {
          locationId: action.locationId,
          latitude: action.latitude,
          longitude: action.longitude,
          note: action.note || undefined,
          offlineTimestamp: action.timestamp,
        };
      } else {
        url = "/api/attendance/check-out";
        body = {
          attendanceId: action.attendanceId,
          latitude: action.latitude,
          longitude: action.longitude,
          offlineTimestamp: action.timestamp,
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await dbDelete(db, action.id);
        await broadcast({ type: "SYNC_SUCCESS", action });
      } else {
        const data = await res.json().catch(() => ({}));
        await dbUpdateError(db, action.id, data.error || `HTTP ${res.status}`);
        await broadcast({ type: "SYNC_ERROR", action, error: data.error || `HTTP ${res.status}` });
      }
    } catch (err) {
      await dbUpdateError(db, action.id, String(err));
    }
  }

  await broadcast({ type: "SYNC_DONE" });
}

// ─── Background Sync event ────────────────────────────────────────────────────
self.addEventListener("sync", (e) => {
  if (e.tag === "attendance-sync") {
    e.waitUntil(syncPendingActions());
  }
});

// ─── Message from page (manual sync trigger) ──────────────────────────────────
self.addEventListener("message", (e) => {
  if (e.data?.type === "SYNC_NOW") {
    syncPendingActions();
  }
});

// ─── Fetch handler ────────────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Static assets: cache first
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          caches.open(CACHE).then((c) => c.put(request, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // API: network only — offline handled at the page level via IndexedDB
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Pages: network first, cache fallback
  e.respondWith(
    fetch(request)
      .then((res) => {
        caches.open(CACHE).then((c) => c.put(request, res.clone()));
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached ?? caches.match(OFFLINE);
      })
  );
});

// ─── Push notifications ───────────────────────────────────────────────────────
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
