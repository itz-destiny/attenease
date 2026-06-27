"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

const navLinks = [
  { href: "/employee", label: "My Dashboard", icon: "🏠" },
  { href: "/check-in", label: "Check In / Out", icon: "✅" },
  { href: "/employee/history", label: "My History", icon: "📋" },
  { href: "/employee/profile", label: "My Profile", icon: "👤" },
];

type ActiveSession = { id: string; checkIn: string; locationName: string | null } | null;

function useActiveSession() {
  const [active, setActive] = useState<ActiveSession>(null);

  useEffect(() => {
    fetch("/api/attendance/active")
      .then((r) => r.json())
      .then((d) => setActive(d || null))
      .catch(() => {});
  }, []);

  return active;
}

function CheckInBanner({ active }: { active: ActiveSession }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!active) { setElapsed(""); return; }
    function tick() {
      const ms = Date.now() - new Date(active!.checkIn).getTime();
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setElapsed(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [active]);

  if (!active) return null;

  return (
    <Link href="/check-in"
      className="block mx-4 mb-3 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white rounded-xl px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-emerald-100 font-medium">Currently checked in</p>
          <p className="text-sm font-bold truncate">{active.locationName ?? "Office"}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-emerald-100">Elapsed</p>
          <p className="text-sm font-bold tabular-nums">{elapsed}</p>
        </div>
      </div>
      <p className="text-xs text-emerald-200 mt-1">Tap to check out →</p>
    </Link>
  );
}

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const active = useActiveSession();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-slate-100">
        <Link href="/employee" className="flex items-center gap-2 mb-1" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-slate-800">AttendEase</span>
        </Link>
        {user && <p className="text-xs text-slate-400 ml-10 truncate">{user.organization.name}</p>}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}>
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Persistent active session banner */}
      <CheckInBanner active={active} />

      <div className="p-4 border-t border-slate-100">
        {user && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-400">Employee</p>
            </div>
          </div>
        )}
        <button onClick={signOut}
          className="w-full text-left text-sm text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white z-50 flex flex-col flex-shrink-0 shadow-2xl transition-transform duration-300 md:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Open menu">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="font-bold text-slate-800 text-sm">AttendEase</span>
          </div>
          {/* Mobile active check-in pill */}
          {active ? (
            <Link href="/check-in" className="flex items-center gap-1.5 bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Checked In
            </Link>
          ) : (
            <div className="w-9" />
          )}
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
