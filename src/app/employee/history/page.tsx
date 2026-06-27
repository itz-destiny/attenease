"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

type AttendanceRecord = {
  id: string;
  checkIn: string;
  checkOut: string | null;
  status: string;
  location: { name: string } | null;
};

function duration(r: AttendanceRecord) {
  if (!r.checkOut) return "Active";
  const ms = new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function HistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/attendance/mine?days=${days}`)
      .then((r) => r.json())
      .then((d) => { setRecords(Array.isArray(d) ? d : []); setLoading(false); });
  }, [days]);

  const totalPresent = records.filter((r) => r.status === "present").length;
  const totalLate = records.filter((r) => r.status === "late").length;
  const totalMs = records.reduce((sum, r) => {
    if (!r.checkOut) return sum;
    return sum + new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
  }, 0);
  const avgHours = records.length > 0 ? (totalMs / records.filter((r) => r.checkOut).length / 3600000).toFixed(1) : "0";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Attendance History</h1>
          <p className="text-slate-500 text-sm mt-1">Your personal attendance records</p>
        </div>
        <button
          onClick={() => {
            const header = "Date,Check In,Check Out,Location,Status,Duration\n";
            const rows = records.map((r) => [
              format(new Date(r.checkIn), "yyyy-MM-dd"),
              format(new Date(r.checkIn), "HH:mm"),
              r.checkOut ? format(new Date(r.checkOut), "HH:mm") : "",
              r.location?.name ?? "",
              r.status,
              duration(r),
            ].join(","));
            const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
            a.download = "my-attendance.csv"; a.click();
          }}
          disabled={records.length === 0}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Days", value: records.length, color: "text-indigo-600" },
          { label: "On Time", value: totalPresent, color: "text-emerald-600" },
          { label: "Late", value: totalLate, color: "text-amber-600" },
          { label: "Avg Hours/Day", value: avgHours + "h", color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-50">
          <span className="text-sm text-slate-500">{records.length} records</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No records in this period.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{format(new Date(r.checkIn), "EEEE, MMMM d, yyyy")}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.location?.name ?? "No location"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-700 font-medium">
                    {format(new Date(r.checkIn), "HH:mm")}
                    {r.checkOut ? ` – ${format(new Date(r.checkOut), "HH:mm")}` : " – Active"}
                  </p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === "present" ? "bg-emerald-100 text-emerald-700"
                      : r.status === "late" ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                    }`}>{r.status}</span>
                    <span className="text-xs text-slate-400">{duration(r)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
