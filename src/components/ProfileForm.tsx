"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ProfileForm() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ text: "New passwords don't match.", ok: false });
      return;
    }

    setSaving(true);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage({ text: "Profile updated successfully.", ok: true });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await refresh();
    } else {
      setMessage({ text: data.error || "Update failed.", ok: false });
    }
    setSaving(false);
  }

  return (
    <div className="max-w-lg">
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700">
          {(name || user?.name || "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-slate-800">{user?.name}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
            user?.role === "owner" ? "bg-indigo-100 text-indigo-700"
            : user?.role === "admin" ? "bg-purple-100 text-purple-700"
            : "bg-slate-100 text-slate-600"
          }`}>{user?.role}</span>
        </div>
      </div>

      <form onSubmit={save} className="space-y-5">
        {/* Name */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Personal Info</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Email</label>
              <input value={user?.email ?? ""} disabled
                className="w-full border border-slate-100 rounded-xl px-3 py-2 text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-1">Change Password</h3>
          <p className="text-xs text-slate-400 mb-4">Leave blank to keep your current password</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Required to change password"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} placeholder="Min. 8 characters"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {message && (
          <div className={`text-sm px-4 py-3 rounded-xl ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {message.text}
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full bg-indigo-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60">
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
