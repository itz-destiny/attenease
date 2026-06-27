"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

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
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => { loadEmployees(); }, []);

  function loadEmployees() {
    setLoading(true);
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => { setEmployees(d); setLoading(false); });
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviting(true);
    const res = await fetch("/api/employees/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setEmployees((prev) => [data, ...prev]);
      setForm({ name: "", email: "", password: "", role: "employee" });
      setShowInvite(false);
    } else {
      setInviteError(data.error);
    }
    setInviting(false);
  }

  async function deleteEmployee(id: string) {
    if (!confirm("Remove this employee?")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }

  async function changeRole(id: string, role: string) {
    await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, role } : e)));
  }

  const filtered = employees.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-500 text-sm mt-1">{employees.length} team member{employees.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Add Employee
        </button>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Add New Employee</h2>
            <form onSubmit={invite} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Full Name</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="jane@company.com"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Temporary Password</label>
                <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {inviteError && <p className="text-xs text-red-500">{inviteError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowInvite(false)}
                  className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2 text-sm font-medium hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={inviting}
                  className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {inviting ? "Adding..." : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-4 border-b border-slate-50">
          <input type="text" placeholder="Search employees..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-slate-500 text-sm">{search ? "No employees match your search" : "No employees yet. Click \"Add Employee\" to get started."}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{emp.name}</div>
                    <div className="text-xs text-slate-400">{emp.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={emp.role}
                    onChange={(e) => changeRole(emp.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${ROLE_COLORS[emp.role] ?? "bg-slate-100 text-slate-600"}`}
                    disabled={emp.role === "owner"}
                  >
                    <option value="employee">employee</option>
                    <option value="admin">admin</option>
                    {emp.role === "owner" && <option value="owner">owner</option>}
                  </select>
                  <span className="text-xs text-slate-400">{format(new Date(emp.createdAt), "MMM d, yyyy")}</span>
                  {emp.role !== "owner" && (
                    <button onClick={() => deleteEmployee(emp.id)} className="text-xs text-red-400 hover:text-red-600">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
