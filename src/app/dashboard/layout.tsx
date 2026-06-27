"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/employees", label: "Employees", icon: "👥" },
  { href: "/dashboard/locations", label: "Locations", icon: "📍" },
  { href: "/dashboard/reports", label: "Reports", icon: "📋" },
  { href: "/check-in", label: "Check In", icon: "✅" },
  { href: "/dashboard/announcements", label: "Announcements", icon: "📢" },
  { href: "/dashboard/profile", label: "My Profile", icon: "👤" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-slate-800">AttendEase</span>
          </Link>
          {user && (
            <p className="text-xs text-slate-400 ml-10 truncate">{user.organization.name}</p>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
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
          <button
            onClick={signOut}
            className="w-full text-left text-sm text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
