"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";

type AttendanceRecord = {
  id: string;
  checkIn: string;
  checkOut: string | null;
  status: string;
  user: { name: string; email: string };
  location: { name: string } | null;
};

type Employee = { id: string; name: string };
type Location = { id: string; name: string };

function duration(r: AttendanceRecord) {
  if (!r.checkOut) return "Active";
  const ms = new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function ReportsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(() => format(new Date(), "yyyy-MM-dd"));

  // Add entry modal
  const [showAdd, setShowAdd] = useState(false);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [addForm, setAddForm] = useState({ employeeId: "", locationId: "", date: format(new Date(), "yyyy-MM-dd"), checkIn: "08:00", checkOut: "", status: "present", note: "" });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/reports?from=${dateFrom}&to=${dateTo}`)
      .then((r) => r.json())
      .then((d) => { setRecords(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => {
    load();
    fetch("/api/employees").then((r) => r.json()).then((d) => setEmployees(Array.isArray(d) ? d : []));
    fetch("/api/locations").then((r) => r.json()).then((d) => setLocations(Array.isArray(d) ? d : []));
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  function exportCSV() {
    const header = "Employee,Email,Date,Check In,Check Out,Location,Status,Duration (hrs)\n";
    const rows = records.map((r) => {
      const ci = new Date(r.checkIn);
      const co = r.checkOut ? new Date(r.checkOut) : null;
      const dur = co ? ((co.getTime() - ci.getTime()) / 3600000).toFixed(2) : "";
      return [r.user.name, r.user.email, format(ci, "yyyy-MM-dd"), format(ci, "HH:mm"), co ? format(co, "HH:mm") : "", r.location?.name ?? "", r.status, dur].join(",");
    });
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `attendance_${dateFrom}_${dateTo}.csv`;
    a.click();
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    const res = await fetch("/api/attendance/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: addForm.employeeId, locationId: addForm.locationId || null, date: addForm.date, checkInTime: addForm.checkIn, checkOutTime: addForm.checkOut || null, status: addForm.status, note: addForm.note || null }),
    });
    const data = await res.json();
    setAddLoading(false);
    if (res.ok) { setShowAdd(false); setAddForm({ employeeId: "", locationId: "", date: format(new Date(), "yyyy-MM-dd"), checkIn: "08:00", checkOut: "", status: "present", note: "" }); load(); }
    else setAddError(data.error);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editRecord) return;
    setAddError("");
    setAddLoading(true);
    const dateStr = editRecord.checkIn.split("T")[0];
    const res = await fetch("/api/attendance/manual", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editRecord.id,
        checkInTime: format(new Date(editRecord.checkIn), "HH:mm"),
        checkOutTime: editRecord.checkOut ? format(new Date(editRecord.checkOut), "HH:mm") : "",
        status: editRecord.status,
        note: editRecord.note,
      }),
    });
    const data = await res.json();
    setAddLoading(false);
    if (res.ok) { setEditRecord(null); load(); }
    else setAddError(data.error);
  }

  async function deleteRecord(id: string) {
    if (!confirm("Delete this attendance record?")) return;
    await fetch("/api/attendance/manual", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">Filter, manage and export attendance records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Entry
          </button>
          <button onClick={exportCSV} disabled={records.length === 0}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-800 text-lg">Add Attendance Entry</h2>
              <button onClick={() => { setShowAdd(false); setAddError(""); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">✕</button>
            </div>
            <form onSubmit={submitAdd} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Employee</label>
                <select required value={addForm.employeeId} onChange={(e) => setAddForm((f) => ({ ...f, employeeId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select employee…</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Date</label>
                <input type="date" required value={addForm.date} onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Check In</label>
                  <input type="time" required value={addForm.checkIn} onChange={(e) => setAddForm((f) => ({ ...f, checkIn: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Check Out <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input type="time" value={addForm.checkOut} onChange={(e) => setAddForm((f) => ({ ...f, checkOut: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Location <span className="text-slate-400 font-normal">(optional)</span></label>
                  <select value={addForm.locationId} onChange={(e) => setAddForm((f) => ({ ...f, locationId: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">None</option>
                    {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Status</label>
                  <select value={addForm.status} onChange={(e) => setAddForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Note <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="text" value={addForm.note} onChange={(e) => setAddForm((f) => ({ ...f, note: e.target.value }))} placeholder="e.g. Manual entry — remote work"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {addError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{addError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowAdd(false); setAddError(""); }}
                  className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={addLoading}
                  className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {addLoading ? "Saving…" : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editRecord && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-slate-800 text-lg">Edit Entry</h2>
                <p className="text-xs text-slate-400 mt-0.5">{editRecord.user.name} · {format(new Date(editRecord.checkIn), "MMM d, yyyy")}</p>
              </div>
              <button onClick={() => { setEditRecord(null); setAddError(""); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">✕</button>
            </div>
            <form onSubmit={submitEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Check In</label>
                  <input type="time" value={format(new Date(editRecord.checkIn), "HH:mm")}
                    onChange={(e) => { const d = new Date(editRecord.checkIn); const [h, m] = e.target.value.split(":").map(Number); d.setHours(h, m); setEditRecord({ ...editRecord, checkIn: d.toISOString() }); }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Check Out</label>
                  <input type="time" value={editRecord.checkOut ? format(new Date(editRecord.checkOut), "HH:mm") : ""}
                    onChange={(e) => { if (!e.target.value) { setEditRecord({ ...editRecord, checkOut: null }); return; } const d = new Date(editRecord.checkIn); const [h, m] = e.target.value.split(":").map(Number); d.setHours(h, m); setEditRecord({ ...editRecord, checkOut: d.toISOString() }); }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Status</label>
                <select value={editRecord.status} onChange={(e) => setEditRecord({ ...editRecord, status: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                </select>
              </div>
              {addError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{addError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setEditRecord(null); setAddError(""); }}
                  className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={addLoading}
                  className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {addLoading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs font-medium text-slate-500 w-8">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs font-medium text-slate-500 w-8">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={load}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors w-full sm:w-auto">
            Apply
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
          <span className="text-sm text-slate-500 font-medium">{records.length} record{records.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading…</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm">No records for this period</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-indigo-600 text-sm font-medium hover:text-indigo-700">+ Add a manual entry</button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-50">
              {records.map((r) => (
                <div key={r.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 flex-shrink-0">
                        {r.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{r.user.name}</p>
                        <p className="text-xs text-slate-400">{r.location?.name ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        r.status === "present" ? "bg-emerald-100 text-emerald-700" :
                        r.status === "late" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      }`}>{r.status}</span>
                      <button onClick={() => { setEditRecord(r); setAddError(""); }} className="p-1.5 text-slate-400 hover:text-indigo-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => deleteRecord(r.id)} className="p-1.5 text-slate-400 hover:text-red-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-slate-400">Date</p><p className="font-medium text-slate-700">{format(new Date(r.checkIn), "MMM d")}</p></div>
                    <div><p className="text-slate-400">In → Out</p><p className="font-medium text-slate-700 tabular-nums">{format(new Date(r.checkIn), "HH:mm")} → {r.checkOut ? format(new Date(r.checkOut), "HH:mm") : "—"}</p></div>
                    <div><p className="text-slate-400">Duration</p><p className="font-medium text-slate-700">{duration(r)}</p></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Employee", "Date", "In", "Out", "Location", "Duration", "Status", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 group">
                      <td className="px-4 py-3"><div className="font-medium text-slate-800">{r.user.name}</div><div className="text-xs text-slate-400">{r.user.email}</div></td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{format(new Date(r.checkIn), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 tabular-nums">{format(new Date(r.checkIn), "HH:mm")}</td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">{r.checkOut ? format(new Date(r.checkOut), "HH:mm") : <span className="text-emerald-600 font-medium">Active</span>}</td>
                      <td className="px-4 py-3 text-slate-600">{r.location?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{duration(r)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          r.status === "present" ? "bg-emerald-100 text-emerald-700" :
                          r.status === "late" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        }`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditRecord(r); setAddError(""); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors" title="Edit">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => deleteRecord(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
