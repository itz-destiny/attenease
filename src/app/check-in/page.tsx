"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Location = { id: string; name: string; latitude: number; longitude: number; radius: number };
type ActiveRecord = { id: string; checkIn: string; locationName: string | null } | null;

// ─── IndexedDB helpers (runs in page context) ────────────────────────────────
const IDB_NAME = "attendease-offline";
const IDB_STORE = "pendingActions";

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function addPending(action: object): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).add(action);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getPendingCount(): Promise<number> {
  const db = await openIDB();
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });
}

async function registerSync() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    // @ts-ignore — Background Sync API
    if (reg?.sync) await reg.sync.register("attendance-sync");
  } catch {
    // Browser doesn't support Background Sync — SW will try on next message
    navigator.serviceWorker?.controller?.postMessage({ type: "SYNC_NOW" });
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CheckInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>}>
      <CheckInInner />
    </Suspense>
  );
}

function CheckInInner() {
  const { user, signOut } = useAuth();
  const searchParams = useSearchParams();
  const qrLocationId = searchParams.get("location");

  const [locations, setLocations] = useState<Location[]>([]);
  const [active, setActive] = useState<ActiveRecord>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoError, setGeoError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [now, setNow] = useState(new Date());
  const autoCheckedIn = useRef(false);

  const [lateDialog, setLateDialog] = useState<{ locationId: string } | null>(null);
  const [lateReason, setLateReason] = useState("");

  // Offline / sync state
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done">("idle");

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load data on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/locations").then((r) => r.json()).catch(() => []),
      fetch("/api/attendance/active").then((r) => r.json()).catch(() => null),
    ]).then(([locs, act]) => {
      setLocations(Array.isArray(locs) ? locs : []);
      setActive(act);
      setLoading(false);
      // Cache locations for offline use
      if (Array.isArray(locs) && locs.length > 0) {
        localStorage.setItem("attendease_locations", JSON.stringify(locs));
      }
    });

    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setGeoError("Location access denied. Enable GPS to check in."),
      { enableHighAccuracy: true, timeout: 10000 }
    ) ?? setGeoError("Geolocation not supported.");
  }, []);

  // Online / offline detection
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline = () => {
      setIsOnline(true);
      setSyncStatus("syncing");
      registerSync().then(() => {
        navigator.serviceWorker?.controller?.postMessage({ type: "SYNC_NOW" });
      });
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Read pending count from IDB
  useEffect(() => {
    getPendingCount().then(setPendingCount);
  }, []);

  // Listen for messages from service worker
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data;
      if (msg?.type === "SYNC_SUCCESS") {
        getPendingCount().then(setPendingCount);
        // If the synced check-in succeeded, refresh the active session from the server
        if (msg.action?.type === "checkIn") {
          fetch("/api/attendance/active").then((r) => r.json()).then((act) => {
            if (act) setActive(act);
          });
        }
        if (msg.action?.type === "checkOut") {
          // If active was an offline placeholder, clear it
          setActive((prev) => (prev?.id === "offline-pending" ? null : prev));
        }
      }
      if (msg?.type === "SYNC_DONE") {
        setSyncStatus("done");
        getPendingCount().then(setPendingCount);
        setTimeout(() => setSyncStatus("idle"), 3000);
      }
      if (msg?.type === "SYNC_ERROR") {
        setSyncStatus("idle");
      }
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, []);

  // Fall back to cached locations if offline and server returned nothing
  useEffect(() => {
    if (!loading && locations.length === 0 && !isOnline) {
      try {
        const cached = JSON.parse(localStorage.getItem("attendease_locations") ?? "[]");
        if (cached.length > 0) setLocations(cached);
      } catch { /* ignore */ }
    }
  }, [loading, locations.length, isOnline]);

  // Auto check-in via QR
  useEffect(() => {
    if (!qrLocationId || !userCoords || loading || active || autoCheckedIn.current) return;
    autoCheckedIn.current = true;
    checkIn(qrLocationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrLocationId, userCoords, loading, active]);

  // ─── Check in ──────────────────────────────────────────────────────────────
  async function checkIn(locationId: string, note?: string) {
    if (!userCoords) {
      setMessage({ text: "GPS location required. Please enable location access.", ok: false });
      return;
    }

    if (!note && new Date().getHours() >= 9) {
      setLateDialog({ locationId });
      return;
    }

    setLateDialog(null);
    setActionLoading(true);
    setMessage(null);

    if (!isOnline) {
      const loc = locations.find((l) => l.id === locationId);
      const ts = new Date().toISOString();
      await addPending({ type: "checkIn", locationId, latitude: userCoords.lat, longitude: userCoords.lon, note, timestamp: ts });
      await registerSync();
      setPendingCount((c) => c + 1);
      setActive({ id: "offline-pending", checkIn: ts, locationName: loc?.name ?? null });
      setMessage({ text: "Saved offline — will upload automatically when back online.", ok: true });
      setActionLoading(false);
      return;
    }

    const res = await fetch("/api/attendance/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId, latitude: userCoords.lat, longitude: userCoords.lon, note }),
    });
    const data = await res.json();
    if (res.ok) {
      setActive({ id: data.id, checkIn: data.checkIn, locationName: data.locationName });
      setMessage({ text: "Checked in successfully!", ok: true });
    } else {
      setMessage({ text: data.error || "Check-in failed.", ok: false });
    }
    setActionLoading(false);
  }

  // ─── Check out ─────────────────────────────────────────────────────────────
  async function checkOut() {
    if (!active) return;
    setActionLoading(true);
    setMessage(null);

    if (!isOnline) {
      const ts = new Date().toISOString();
      const attendanceId = active.id !== "offline-pending" ? active.id : null;
      await addPending({ type: "checkOut", attendanceId, latitude: userCoords?.lat ?? null, longitude: userCoords?.lon ?? null, timestamp: ts });
      await registerSync();
      setPendingCount((c) => c + 1);
      setActive(null);
      setMessage({ text: "Saved offline — will upload automatically when back online.", ok: true });
      setActionLoading(false);
      return;
    }

    const res = await fetch("/api/attendance/check-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attendanceId: active.id !== "offline-pending" ? active.id : null,
        latitude: userCoords?.lat ?? null,
        longitude: userCoords?.lon ?? null,
      }),
    });
    if (res.ok) {
      setActive(null);
      setMessage({ text: "Checked out. Have a great day!", ok: true });
    } else {
      const data = await res.json();
      setMessage({ text: data.error || "Check-out failed.", ok: false });
    }
    setActionLoading(false);
  }

  const elapsed = active
    ? (() => {
        const ms = Date.now() - new Date(active.checkIn).getTime();
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      })()
    : null;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Offline / Sync banner */}
        {!isOnline && (
          <div className="bg-amber-500 text-white text-sm font-medium text-center py-2 px-4 flex items-center justify-center gap-2">
            <span>📵</span>
            <span>You&apos;re offline — check-ins will be saved and uploaded automatically when connected.</span>
          </div>
        )}
        {isOnline && pendingCount > 0 && syncStatus === "syncing" && (
          <div className="bg-indigo-600 text-white text-sm font-medium text-center py-2 px-4 flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
            <span>Uploading {pendingCount} saved action{pendingCount !== 1 ? "s" : ""}…</span>
          </div>
        )}
        {isOnline && syncStatus === "done" && pendingCount === 0 && (
          <div className="bg-emerald-600 text-white text-sm font-medium text-center py-2 px-4 flex items-center justify-center gap-2">
            <span>✓</span>
            <span>All offline records uploaded successfully.</span>
          </div>
        )}
        {isOnline && pendingCount > 0 && syncStatus === "idle" && (
          <div className="bg-slate-700 text-white text-sm font-medium text-center py-2 px-4 flex items-center justify-center gap-2">
            <span>⏳</span>
            <span>{pendingCount} record{pendingCount !== 1 ? "s" : ""} pending upload</span>
            <button onClick={() => { setSyncStatus("syncing"); navigator.serviceWorker?.controller?.postMessage({ type: "SYNC_NOW" }); }}
              className="underline text-white/80 hover:text-white ml-1">Sync now</button>
          </div>
        )}

        <nav className="flex items-center justify-between px-4 py-3 max-w-xl mx-auto">
          <Link
            href={user?.role === "employee" ? "/employee" : "/dashboard"}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-indigo-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span className="text-sm font-medium">
              {user?.role === "employee" ? "My Dashboard" : "Dashboard"}
            </span>
          </Link>

          <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-1.5">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="font-bold text-slate-800 text-sm">AttendEase</span>
          </div>

          <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:block">Sign out</span>
          </button>
        </nav>

        <div className="max-w-xl mx-auto px-6 pt-6 pb-10">
          {/* Clock */}
          <div className="text-center mb-6">
            <div className="text-5xl font-extrabold text-slate-900 tabular-nums">{format(now, "HH:mm:ss")}</div>
            <div className="text-slate-500 text-sm mt-1">{format(now, "EEEE, MMMM d, yyyy")}</div>
            {user && <p className="text-slate-700 font-medium mt-2">{user.name}</p>}
          </div>

          {/* GPS status */}
          <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl mb-5 ${userCoords ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            <span className="text-base">{userCoords ? "📍" : "⚠️"}</span>
            <span>{userCoords ? `GPS locked · ${userCoords.lat.toFixed(4)}, ${userCoords.lon.toFixed(4)}` : geoError || "Getting your location…"}</span>
          </div>

          {/* QR notice */}
          {qrLocationId && !active && !actionLoading && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4 text-sm text-indigo-700 flex items-center gap-2">
              <span>📷</span>
              <span>QR check-in detected — {userCoords ? "verifying your location…" : "waiting for GPS…"}</span>
            </div>
          )}

          {/* Active session */}
          {active && (
            <div className={`text-white rounded-2xl p-6 mb-5 shadow-lg ${active.id === "offline-pending" ? "bg-amber-500 shadow-amber-200" : "bg-emerald-600 shadow-emerald-200"}`}>
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-medium ${active.id === "offline-pending" ? "text-amber-100" : "text-emerald-100"}`}>
                  {active.id === "offline-pending" ? "Checked In (Offline — pending sync)" : "Currently Checked In"}
                </p>
                {active.id === "offline-pending" && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">📵 offline</span>}
              </div>
              <p className="text-xl font-bold">{active.locationName ?? "Office"}</p>
              <p className={`text-sm mt-1 ${active.id === "offline-pending" ? "text-amber-200" : "text-emerald-200"}`}>
                Since {format(new Date(active.checkIn), "HH:mm")}
              </p>
              <p className="text-3xl font-extrabold tabular-nums mt-2">{elapsed}</p>
              <button
                onClick={checkOut}
                disabled={actionLoading}
                className={`mt-4 w-full font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 ${active.id === "offline-pending" ? "bg-white text-amber-700 hover:bg-amber-50" : "bg-white text-emerald-700 hover:bg-emerald-50"}`}
              >
                {actionLoading ? "Processing…" : "Check Out"}
              </button>
              {!userCoords && (
                <p className="text-xs text-center mt-2 opacity-75">GPS not required for check-out</p>
              )}
            </div>
          )}

          {/* Location list */}
          {!active && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-5">
              <div className="p-4 border-b border-slate-50">
                <h2 className="font-semibold text-slate-800">Select Your Office</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isOnline ? "Or scan the office QR code for instant check-in" : "Offline — using cached locations"}
                </p>
              </div>
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm">Loading locations…</div>
              ) : locations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No locations set up. Contact your admin.</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {locations.map((loc) => (
                    <button key={loc.id} onClick={() => checkIn(loc.id)} disabled={actionLoading || !userCoords}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-indigo-50 transition-colors disabled:opacity-50 text-left">
                      <div>
                        <div className="font-medium text-slate-800 text-sm">{loc.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">Within {loc.radius}m radius</div>
                      </div>
                      <span className="text-indigo-600 text-sm font-medium">{actionLoading ? "…" : "Check In →"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`text-sm text-center p-3.5 rounded-xl font-medium ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {message.text}
            </div>
          )}

          <p className="text-center text-xs text-slate-400 mt-5">
            {isOnline ? "You must be physically at the office to check in." : "Offline mode — actions saved and will sync when connected."}
          </p>
        </div>
      </div>

      {/* Late reason dialog */}
      {lateDialog && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setLateDialog(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[380px] bg-white rounded-3xl shadow-2xl p-6 z-50">
            <div className="text-center mb-5">
              <div className="text-3xl mb-2">⏰</div>
              <h3 className="font-bold text-slate-800">You&apos;re checking in late</h3>
              <p className="text-sm text-slate-400 mt-1">Please add a reason for your late arrival</p>
            </div>
            <textarea
              value={lateReason}
              onChange={(e) => setLateReason(e.target.value)}
              rows={3}
              placeholder="e.g. Traffic, doctor appointment…"
              autoFocus
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { checkIn(lateDialog.locationId, lateReason || "No reason provided"); setLateReason(""); }}
                disabled={actionLoading}
                className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {actionLoading ? "Checking in…" : "Check In"}
              </button>
              <button onClick={() => { setLateDialog(null); setLateReason(""); }}
                className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
