"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, eachDayOfInterval, isToday, isSameDay } from "date-fns";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type AttendanceRecord = {
  id: string;
  checkIn: string;
  checkOut: string | null;
  status: string;
  location: { name: string } | null;
};

type ActiveRecord = { id: string; checkIn: string; locationName: string | null } | null;

type Announcement = {
  id: string;
  title: string;
  body: string;
  priority: string;
  createdAt: string;
  author: { name: string };
};

function durationMs(r: AttendanceRecord) {
  if (!r.checkOut) return Date.now() - new Date(r.checkIn).getTime();
  return new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
}

function fmtDuration(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [active, setActive] = useState<ActiveRecord>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/attendance/mine?days=14").then((r) => r.json()),
      fetch("/api/attendance/active").then((r) => r.json()),
      fetch("/api/announcements").then((r) => r.json()),
    ]).then(([recs, act, ann]) => {
      setRecords(Array.isArray(recs) ? recs : []);
      setActive(act);
      setAnnouncements(Array.isArray(ann) ? ann : []);
      setLoading(false);
    });
  }, []);

  const todayRecord = records.find((r) => isToday(new Date(r.checkIn)));

  // Week grid — Mon to today
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: now });

  // Total hours this week
  const weekMs = records
    .filter((r) => new Date(r.checkIn) >= weekStart)
    .reduce((sum, r) => sum + durationMs(r), 0);

  // Total hours today
  const todayMs = records
    .filter((r) => isToday(new Date(r.checkIn)))
    .reduce((sum, r) => sum + durationMs(r), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Good {getGreeting()}, {user?.name.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{format(now, "EEE, MMM d, yyyy")}</p>
      </div>

      {/* Status card */}
      <div className={`rounded-2xl p-5 mb-5 ${active ? "bg-emerald-600 text-white" : "bg-white border border-slate-100"}`}>
        {active ? (
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-emerald-100 text-xs font-medium mb-1">Currently checked in</p>
              <p className="text-xl sm:text-2xl font-bold">{active.locationName ?? "Office"}</p>
              <p className="text-emerald-200 text-xs sm:text-sm mt-1">
                Since {format(new Date(active.checkIn), "h:mm a")} · {fmtDuration(Date.now() - new Date(active.checkIn).getTime())} elapsed
              </p>
            </div>
            <Link
              href="/check-in"
              className="bg-white text-emerald-700 font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm hover:bg-emerald-50 transition-colors flex-shrink-0"
            >
              Check Out
            </Link>
          </div>
        ) : (
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mb-1">
                {todayRecord ? "Checked out for today" : "Not checked in yet"}
              </p>
              <p className="text-lg sm:text-xl font-bold text-slate-800 tabular-nums">
                {todayRecord
                  ? `Today: ${fmtDuration(todayMs)}`
                  : format(now, "HH:mm:ss")}
              </p>
            </div>
            {!todayRecord && (
              <Link
                href="/check-in"
                className="bg-indigo-600 text-white font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm hover:bg-indigo-700 transition-colors flex-shrink-0"
              >
                Check In →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">Today</p>
          <p className="text-xl font-bold text-slate-900">{fmtDuration(todayMs)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">This Week</p>
          <p className="text-xl font-bold text-slate-900">{fmtDuration(weekMs)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">Status</p>
          <p className="text-xl font-bold text-slate-900 capitalize">
            {active ? "Active" : todayRecord ? todayRecord.status : "—"}
          </p>
        </div>
      </div>

      {/* This week attendance grid */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 mb-5">
        <h2 className="font-semibold text-slate-800 mb-4">This Week</h2>
        <div className="flex gap-2">
          {weekDays.map((day) => {
            const rec = records.find((r) => isSameDay(new Date(r.checkIn), day));
            const isNow = isToday(day);
            return (
              <div key={day.toISOString()} className="flex-1 text-center">
                <p className="text-xs text-slate-400 mb-2">{format(day, "EEE")}</p>
                <div className={`w-full aspect-square rounded-xl flex items-center justify-center text-sm font-semibold mx-auto max-w-[48px] ${
                  rec
                    ? rec.status === "late"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                    : isNow && active
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}>
                  {format(day, "d")}
                </div>
                <p className="text-xs mt-1 text-slate-400">
                  {rec ? fmtDuration(durationMs(rec)) : isNow ? "" : "—"}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 inline-block"></span>On time</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 inline-block"></span>Late</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 inline-block"></span>Absent</span>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="mb-6 space-y-2">
          {announcements.map((a) => (
            <div key={a.id} className={`rounded-2xl px-5 py-4 border ${a.priority === "urgent" ? "bg-red-50 border-red-200" : "bg-indigo-50 border-indigo-100"}`}>
              <div className="flex items-start gap-2">
                <span className="text-base mt-0.5">{a.priority === "urgent" ? "🔴" : "📢"}</span>
                <div>
                  <p className={`text-sm font-semibold ${a.priority === "urgent" ? "text-red-800" : "text-indigo-800"}`}>{a.title}</p>
                  <p className={`text-xs mt-1 leading-relaxed ${a.priority === "urgent" ? "text-red-700" : "text-indigo-700"}`}>{a.body}</p>
                  <p className="text-xs text-slate-400 mt-1.5">From {a.author.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-slate-100">
        <div className="flex items-center justify-between p-5 border-b border-slate-50">
          <h2 className="font-semibold text-slate-800">Recent Activity</h2>
          <Link href="/employee/history" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No attendance records yet.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {records.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{format(new Date(r.checkIn), "EEE, MMM d")}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.location?.name ?? "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-700">
                    {format(new Date(r.checkIn), "HH:mm")}
                    {r.checkOut ? ` – ${format(new Date(r.checkOut), "HH:mm")}` : " – Active"}
                  </p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === "present" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>{r.status}</span>
                    <span className="text-xs text-slate-400">{fmtDuration(durationMs(r))}</span>
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
