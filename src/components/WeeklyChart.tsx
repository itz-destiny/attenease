"use client";

import { useEffect, useState } from "react";

type DayData = { date: string; label: string; present: number; late: number; total: number };

export default function WeeklyChart() {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/weekly")
      .then((r) => r.json())
      .then((d) => { setData(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const today = new Date().toDateString();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-slate-800">7-Day Attendance</h2>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500 inline-block" />On time</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" />Late</span>
        </div>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center text-slate-300 text-sm">Loading chart…</div>
      ) : (
        <div className="flex items-end gap-2 h-36">
          {data.map((d) => {
            const isToday = new Date(d.date).toDateString() === today;
            const presentPct = (d.present / maxVal) * 100;
            const latePct = (d.late / maxVal) * 100;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                {/* Bar */}
                <div className="w-full flex flex-col-reverse gap-px" style={{ height: "96px" }}>
                  {d.total === 0 ? (
                    <div className="w-full rounded-lg bg-slate-100" style={{ height: "6px" }} />
                  ) : (
                    <>
                      <div className="w-full rounded-b-lg bg-indigo-500 transition-all duration-700"
                        style={{ height: `${(presentPct * 96) / 100}px`, minHeight: d.present > 0 ? 4 : 0 }} />
                      {d.late > 0 && (
                        <div className="w-full bg-amber-400 transition-all duration-700"
                          style={{ height: `${(latePct * 96) / 100}px`, minHeight: 4 }} />
                      )}
                    </>
                  )}
                </div>
                {/* Count */}
                <span className="text-xs font-semibold text-slate-600">{d.total || ""}</span>
                {/* Label */}
                <span className={`text-xs ${isToday ? "font-bold text-indigo-600" : "text-slate-400"}`}>{d.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
