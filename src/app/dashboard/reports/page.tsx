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

export default function ReportsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(() => format(new Date(), "yyyy-MM-dd"));

  function load() {
    setLoading(true);
    fetch(`/api/reports?from=${dateFrom}&to=${dateTo}`)
      .then((r) => r.json())
      .then((d) => { setRecords(d); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  function exportCSV() {
    const header = "Employee,Email,Date,Check In,Check Out,Location,Status,Duration (hrs)\n";
    const rows = records.map((r) => {
      const checkIn = new Date(r.checkIn);
      const checkOut = r.checkOut ? new Date(r.checkOut) : null;
      const duration = checkOut ? ((checkOut.getTime() - checkIn.getTime()) / 3600000).toFixed(2) : "";
      return [
        r.employee.name,
        r.employee.email,
        format(checkIn, "yyyy-MM-dd"),
        format(checkIn, "HH:mm"),
        checkOut ? format(checkOut, "HH:mm") : "",
        r.location?.name ?? "",
        r.status,
        duration,
      ].join(",");
    });
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function duration(r: AttendanceRecord) {
    if (!r.checkOut) return "Active";
    const ms = new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Filter and export attendance records</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={records.length === 0}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={load}
          className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Apply
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50">
          <span className="text-sm text-slate-500">{records.length} record{records.length !== 1 ? "s" : ""}</span>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No records for this period</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Employee", "Date", "Check In", "Check Out", "Location", "Duration", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
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
                    <td className="px-4 py-3 text-slate-600">{format(new Date(r.checkIn), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{format(new Date(r.checkIn), "HH:mm")}</td>
                    <td className="px-4 py-3 text-slate-600">{r.checkOut ? format(new Date(r.checkOut), "HH:mm") : "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.location?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{duration(r)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        r.status === "present" ? "bg-emerald-100 text-emerald-700" :
                        r.status === "late" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
