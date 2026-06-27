"use client";

import { useEffect, useState } from "react";

type Location = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  createdAt: string;
};

type QrModal = { locationId: string; name: string; qr: string; url: string } | null;

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", latitude: "", longitude: "", radius: "100" });
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [qrModal, setQrModal] = useState<QrModal>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    fetch("/api/locations").then((r) => r.json()).then((d) => { setLocations(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  function detectLocation() {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setForm((f) => ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) })); setDetecting(false); },
      () => { setError("Could not detect location. Please enter manually."); setDetecting(false); }
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true);
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude), radius: parseFloat(form.radius) }),
    });
    if (res.ok) {
      const newLoc = await res.json();
      setLocations((l) => [newLoc, ...l]);
      setForm({ name: "", latitude: "", longitude: "", radius: "100" });
    } else { setError("Failed to save location."); }
    setSaving(false);
  }

  async function deleteLocation(id: string) {
    if (!confirm("Delete this location?")) return;
    await fetch(`/api/locations/${id}`, { method: "DELETE" });
    setLocations((l) => l.filter((loc) => loc.id !== id));
  }

  async function showQr(loc: Location) {
    setQrLoading(true);
    setQrModal({ locationId: loc.id, name: loc.name, qr: "", url: "" });
    const res = await fetch(`/api/locations/qr?id=${loc.id}`);
    const data = await res.json();
    setQrModal({ locationId: loc.id, name: loc.name, qr: data.qr, url: data.url });
    setQrLoading(false);
  }

  function downloadQr(name: string, qr: string) {
    const a = document.createElement("a");
    a.href = qr;
    a.download = `qr-${name.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Office Locations</h1>
        <p className="text-slate-500 text-sm mt-0.5">Define geofenced zones and generate QR codes for check-in</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8">
        {/* Add form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Add New Location</h2>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Location Name</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Head Office"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Latitude</label>
                <input required value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} placeholder="6.5244"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Longitude</label>
                <input required value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} placeholder="3.3792"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <button type="button" onClick={detectLocation} disabled={detecting}
              className="w-full border border-dashed border-indigo-300 text-indigo-600 text-sm rounded-xl py-2 hover:bg-indigo-50 transition-colors disabled:opacity-50">
              {detecting ? "Detecting..." : "📍 Use My Current Location"}
            </button>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Check-in Radius (meters)</label>
              <input required type="number" min="10" max="5000" value={form.radius}
                onChange={(e) => setForm((f) => ({ ...f, radius: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-slate-400 mt-1">Employees must be within this distance to check in</p>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="submit" disabled={saving}
              className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save Location"}
            </button>
          </form>
        </div>

        {/* Locations list */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-800">Your Locations</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
          ) : locations.length === 0 ? (
            <div className="p-12 text-center"><div className="text-4xl mb-2">📍</div><p className="text-slate-400 text-sm">No locations added yet</p></div>
          ) : (
            <div className="divide-y divide-slate-50">
              {locations.map((loc) => (
                <div key={loc.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{loc.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</div>
                      <div className="text-xs text-indigo-600 mt-1 font-medium">Radius: {loc.radius}m</div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => showQr(loc)}
                        className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors font-medium">
                        QR Code
                      </button>
                      <button onClick={() => deleteLocation(loc.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 text-lg mb-1">{qrModal.name}</h3>
            <p className="text-xs text-slate-400 mb-4">Employees scan this to check in</p>
            {qrLoading || !qrModal.qr ? (
              <div className="w-48 h-48 bg-slate-100 rounded-xl mx-auto flex items-center justify-center text-slate-400 text-sm">Generating...</div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrModal.qr} alt="QR Code" className="w-48 h-48 mx-auto rounded-xl border border-slate-100" />
            )}
            <p className="text-xs text-slate-400 mt-3 break-all">{qrModal.url}</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setQrModal(null)}
                className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2 text-sm font-medium hover:bg-slate-50">
                Close
              </button>
              {qrModal.qr && (
                <button onClick={() => downloadQr(qrModal.name, qrModal.qr)}
                  className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-indigo-700">
                  Download
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
