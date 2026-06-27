"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardClient() {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          router.refresh();
          setLastRefresh(new Date());
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  function refreshNow() {
    router.refresh();
    setLastRefresh(new Date());
    setCountdown(30);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-xs text-slate-400">Auto-refresh in {countdown}s</p>
        <p className="text-xs text-slate-300">Last: {lastRefresh.toLocaleTimeString()}</p>
      </div>
      <button onClick={refreshNow}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-colors">
        <span className="text-base">🔄</span> Refresh
      </button>
    </div>
  );
}
