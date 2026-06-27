"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/employees", label: "Employees", icon: "👥" },
  { href: "/dashboard/locations", label: "Locations", icon: "📍" },
  { href: "/dashboard/reports", label: "Reports", icon: "📋" },
  { href: "/check-in", label: "Check In", icon: "✅" },
  { href: "/dashboard/announcements", label: "Announcements", icon: "📢" },
  { href: "/dashboard/profile", label: "My Profile", icon: "👤" },
  { href: "/pricing", label: "Upgrade Plan", icon: "⭐" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2 mb-1" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-slate-800">AttendEase</span>
        </Link>
        {user && <p className="text-xs text-slate-400 ml-10 truncate">{user.organization.name}</p>}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}>
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        {user && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
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
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
