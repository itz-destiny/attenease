"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";

type Employee = { id: string; name: string; email: string; role: string; createdAt: string };

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-indigo-100 text-indigo-700",
  admin: "bg-purple-100 text-purple-700",
  employee: "bg-slate-100 text-slate-600",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee" });
  const [showPwd, setShowPwd] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => { loadEmployees(); }, []);

  function loadEmployees() {
    setLoading(true);
    fetch("/api/employees").then((r) => r.json()).then((d) => { setEmployees(d); setLoading(false); });
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviting(true);
    const res = await fetch("/api/employees/invite", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setEmployees((prev) => [data, ...prev]);
      setForm({ name: "", email: "", password: "", role: "employee" });
      setShowInvite(false);
    } else { setInviteError(data.error); }
    setInviting(false);
  }

  async function deleteEmployee(id: string) {
    if (!confirm("Remove this employee?")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }

  async function changeRole(id: string, role: string) {
    await fetch(`/api/employees/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, role } : e)));
  }

  const filtered = employees.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-500 text-sm mt-0.5">{employees.length} team member{employees.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/employees/import"
            className="border border-slate-200 text-slate-600 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span className="hidden sm:inline">Import</span>
          </Link>
          <button onClick={() => setShowInvite(true)}
            className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
            <span className="text-base leading-none">+</span>
            <span className="hidden sm:inline">Add Employee</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-800 text-lg">Add New Employee</h2>
              <button onClick={() => setShowInvite(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">✕</button>
            </div>
            <form onSubmit={invite} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Full Name</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Smith"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@company.com"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Temporary Password</label>
                <div className="relative">
                  <input required type={showPwd ? "text" : "password"} minLength={8} value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                    {showPwd ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {inviteError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{inviteError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowInvite(false)}
                  className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={inviting}
                  className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {inviting ? "Adding…" : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-4 border-b border-slate-50">
          <input type="text" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-slate-500 text-sm">{search ? "No employees match your search" : "No employees yet. Click \"Add\" to get started."}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((emp) => (
              <div key={emp.id} className="px-4 sm:px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700 flex-shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{emp.name}</p>
                    <p className="text-xs text-slate-400 truncate">{emp.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select value={emp.role} onChange={(e) => changeRole(emp.id, e.target.value)} disabled={emp.role === "owner"}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${ROLE_COLORS[emp.role] ?? "bg-slate-100 text-slate-600"}`}>
                      <option value="employee">employee</option>
                      <option value="admin">admin</option>
                      {emp.role === "owner" && <option value="owner">owner</option>}
                    </select>
                    {emp.role !== "owner" && (
                      <button onClick={() => deleteEmployee(emp.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 ml-[52px]">Added {format(new Date(emp.createdAt), "MMM d, yyyy")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
