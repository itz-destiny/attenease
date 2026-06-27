import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { format, startOfDay, endOfDay } from "date-fns";
import Link from "next/link";
import AdminDashboardClient from "./AdminDashboardClient";
import WeeklyChart from "@/components/WeeklyChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role === "employee") redirect("/employee");

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const [totalEmployees, todayAttendances, totalLocations] = await Promise.all([
    prisma.user.count({ where: { orgId: session.orgId } }),
    prisma.attendance.findMany({
      where: { orgId: session.orgId, checkIn: { gte: todayStart, lte: todayEnd } },
      include: { user: { select: { name: true } }, location: { select: { name: true } } },
      orderBy: { checkIn: "desc" },
    }),
    prisma.location.count({ where: { orgId: session.orgId } }),
  ]);

  const checkedIn = todayAttendances.filter((a) => !a.checkOut).length;
  const checkedOut = todayAttendances.filter((a) => a.checkOut).length;
  const lateCount = todayAttendances.filter((a) => a.status === "late").length;

  const stats = [
    { label: "Total Employees", value: totalEmployees, color: "bg-indigo-500", emoji: "👥" },
    { label: "Currently In", value: checkedIn, color: "bg-emerald-500", emoji: "✅" },
    { label: "Checked Out", value: checkedOut, color: "bg-amber-500", emoji: "🚪" },
    { label: "Late Today", value: lateCount, color: "bg-red-400", emoji: "⏰" },
    { label: "Locations", value: totalLocations, color: "bg-purple-500", emoji: "📍" },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good {getGreeting()}, {session.name.split(" ")[0]}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{format(today, "EEEE, MMMM d, yyyy")}</p>
        </div>
        <AdminDashboardClient />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={`w-9 h-9 ${s.color} rounded-xl flex items-center justify-center text-base mb-3`}>{s.emoji}</div>
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <WeeklyChart />

      {/* Today's activity */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-50">
          <h2 className="font-semibold text-slate-800">Today&apos;s Attendance</h2>
          <Link href="/dashboard/reports" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Full report →</Link>
        </div>
        {todayAttendances.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No check-ins yet today</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {todayAttendances.map((a) => {
              const hoursIn = a.checkOut
                ? null
                : (Date.now() - new Date(a.checkIn).getTime()) / 3600000;
              const overtime = hoursIn !== null && hoursIn > 9;
              return (
                <div key={a.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${overtime ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"}`}>
                      {a.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 text-sm flex items-center gap-2">
                        {a.user.name}
                        {overtime && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">Overtime</span>}
                      </div>
                      <div className="text-xs text-slate-400">{a.location?.name ?? "No location"}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-700">
                      {format(new Date(a.checkIn), "HH:mm")}
                      {a.checkOut ? ` – ${format(new Date(a.checkOut), "HH:mm")}` : ""}
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.checkOut ? "bg-slate-100 text-slate-500"
                        : overtime ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {a.checkOut ? "Checked out" : overtime ? "⚠ Overtime" : "Active"}
                      </span>
                      {a.status === "late" && !a.checkOut && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Late</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
