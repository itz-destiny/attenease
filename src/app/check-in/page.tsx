"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Location = { id: string; name: string; latitude: number; longitude: number; radius: number };
type ActiveRecord = { id: string; checkIn: string; locationName: string | null } | null;

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
  // Late reason dialog
  const [lateDialog, setLateDialog] = useState<{ locationId: string } | null>(null);
  const [lateReason, setLateReason] = useState("");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/locations").then((r) => r.json()),
      fetch("/api/attendance/active").then((r) => r.json()),
    ]).then(([locs, act]) => {
      setLocations(Array.isArray(locs) ? locs : []);
      setActive(act);
      setLoading(false);
    });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setGeoError("Location access denied. Enable GPS to check in."),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGeoError("Geolocation not supported by your browser.");
    }
  }, []);

  // Auto-trigger check-in when arriving via QR and coords are ready
  useEffect(() => {
    if (!qrLocationId || !userCoords || loading || active || autoCheckedIn.current) return;
    autoCheckedIn.current = true;
    checkIn(qrLocationId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrLocationId, userCoords, loading, active]);

  async function checkIn(locationId: string, note?: string) {
    if (!userCoords) { setMessage({ text: "GPS location required. Please enable location access.", ok: false }); return; }

    // If checking in late (>=9am) and no reason given yet, show dialog
    if (!note && new Date().getHours() >= 9) {
      setLateDialog({ locationId });
      return;
    }

    setLateDialog(null);
    setActionLoading(true);
    setMessage(null);
    const res = await fetch("/api/attendance/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId, latitude: userCoords.lat, longitude: userCoords.lon, note }),
    });
    const data = await res.json();
    if (res.ok) {
      setActive({ id: data.id, checkIn: data.checkIn, locationName: data.locationName });
      setMessage({ text: "✅ Checked in successfully!", ok: true });
    } else {
      setMessage({ text: data.error || "Check-in failed.", ok: false });
    }
    setActionLoading(false);
  }

  async function checkOut() {
    if (!active || !userCoords) return;
    setActionLoading(true);
    setMessage(null);
    const res = await fetch("/api/attendance/check-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendanceId: active.id, latitude: userCoords.lat, longitude: userCoords.lon }),
    });
    if (res.ok) {
      setActive(null);
      setMessage({ text: "👋 Checked out. Have a great day!", ok: true });
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
          <div className="bg-emerald-600 text-white rounded-2xl p-6 mb-5 shadow-lg shadow-emerald-200">
            <p className="text-emerald-100 text-sm font-medium mb-1">Currently Checked In</p>
            <p className="text-xl font-bold">{active.locationName ?? "Office"}</p>
            <p className="text-emerald-200 text-sm mt-1">Since {format(new Date(active.checkIn), "HH:mm")}</p>
            <p className="text-3xl font-extrabold tabular-nums mt-2">{elapsed}</p>
            <button onClick={checkOut} disabled={actionLoading || !userCoords}
              className="mt-4 w-full bg-white text-emerald-700 font-semibold py-3 rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-60">
              {actionLoading ? "Processing…" : "Check Out"}
            </button>
          </div>
        )}

        {/* Location list */}
        {!active && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-5">
            <div className="p-4 border-b border-slate-50">
              <h2 className="font-semibold text-slate-800">Select Your Office</h2>
              <p className="text-xs text-slate-400 mt-0.5">Or scan the office QR code for instant check-in</p>
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

        <p className="text-center text-xs text-slate-400 mt-5">You must be physically at the office to check in.</p>
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
