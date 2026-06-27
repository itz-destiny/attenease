"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

type Announcement = {
  id: string;
  title: string;
  body: string;
  priority: string;
  expiresAt: string | null;
  createdAt: string;
  author: { name: string };
};

export default function AnnouncementsPage() {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("normal");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const r = await fetch("/api/announcements");
    const d = await r.json();
    setList(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, priority, expiresAt: expiresAt || null }),
    });
    const data = await res.json();
    if (res.ok) {
      setTitle(""); setBody(""); setPriority("normal"); setExpiresAt("");
      setShowForm(false);
      load();
    } else {
      setError(data.error || "Failed to post.");
    }
    setSaving(false);
  }

  async function remove(id: string) {
    await fetch("/api/announcements", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setList((l) => l.filter((a) => a.id !== id));
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="text-slate-500 text-sm mt-1">Post notices visible to all employees</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          + New Announcement
        </button>
      </div>

      {/* New form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">New Announcement</h3>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Office closed Friday"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Message</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={3} placeholder="Details…"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Expires (optional)</label>
                <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
                {saving ? "Posting…" : "Post Announcement"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-slate-500 hover:text-slate-700 text-sm px-3 py-2">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading…</div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="text-4xl mb-3">📢</div>
          <p className="text-slate-500 text-sm">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <div key={a.id} className={`bg-white rounded-2xl border p-5 shadow-sm ${a.priority === "urgent" ? "border-red-200 bg-red-50/30" : "border-slate-100"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {a.priority === "urgent" && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">🔴 Urgent</span>}
                    <h3 className="font-semibold text-slate-800">{a.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{a.body}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {a.author.name} · {format(new Date(a.createdAt), "MMM d, yyyy 'at' HH:mm")}
                    {a.expiresAt && ` · Expires ${format(new Date(a.expiresAt), "MMM d")}`}
                  </p>
                </div>
                <button onClick={() => remove(a.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors text-sm flex-shrink-0 p-1">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
