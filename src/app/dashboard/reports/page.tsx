"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

type AttendanceRecord = {
  id: string;
  checkIn: string;
  checkOut: string | null;
  status: string;
  inLatitude: number | null;
  inLongitude: number | null;
  employee: { name: string; email: string };
  location: { name: string } | null;
};

function duration(r: AttendanceRecord) {
  if (!r.checkOut) return "Active";
  const ms = new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function ReportsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(() => format(new Date(), "yyyy-MM-dd"));

  function load() {
    setLoading(true);
    fetch(`/api/reports?from=${dateFrom}&to=${dateTo}`)
      .then((r) => r.json())
      .then((d) => { setRecords(Array.isArray(d) ? d : []); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  function exportCSV() {
    const header = "Employee,Email,Date,Check In,Check Out,Location,Status,Duration (hrs)\n";
    const rows = records.map((r) => {
      const ci = new Date(r.checkIn);
      const co = r.checkOut ? new Date(r.checkOut) : null;
      const dur = co ? ((co.getTime() - ci.getTime()) / 3600000).toFixed(2) : "";
      return [r.employee.name, r.employee.email, format(ci, "yyyy-MM-dd"), format(ci, "HH:mm"), co ? format(co, "HH:mm") : "", r.location?.name ?? "", r.status, dur].join(",");
    });
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `attendance_${dateFrom}_${dateTo}.csv`;
    a.click();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">Filter and export attendance records</p>
        </div>
        <button onClick={exportCSV} disabled={records.length === 0}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 w-full sm:w-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

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
          <div className="p-12 text-center text-slate-400 text-sm">No records for this period</div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="sm:hidden divide-y divide-slate-50">
              {records.map((r) => (
                <div key={r.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 flex-shrink-0">
                        {r.employee.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{r.employee.name}</p>
                        <p className="text-xs text-slate-400">{r.location?.name ?? "—"}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                      r.status === "present" ? "bg-emerald-100 text-emerald-700" :
                      r.status === "late" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>{r.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400">Date</p>
                      <p className="font-medium text-slate-700">{format(new Date(r.checkIn), "MMM d")}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">In → Out</p>
                      <p className="font-medium text-slate-700 tabular-nums">
                        {format(new Date(r.checkIn), "HH:mm")} → {r.checkOut ? format(new Date(r.checkOut), "HH:mm") : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Duration</p>
                      <p className="font-medium text-slate-700">{duration(r)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Employee", "Date", "Check In", "Check Out", "Location", "Duration", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{r.employee.name}</div>
                        <div className="text-xs text-slate-400">{r.employee.email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{format(new Date(r.checkIn), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 tabular-nums">{format(new Date(r.checkIn), "HH:mm")}</td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">{r.checkOut ? format(new Date(r.checkOut), "HH:mm") : "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{r.location?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{duration(r)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          r.status === "present" ? "bg-emerald-100 text-emerald-700" :
                          r.status === "late" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>{r.status}</span>
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
