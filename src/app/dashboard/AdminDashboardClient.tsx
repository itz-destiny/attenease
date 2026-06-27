"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardClient() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(30);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          router.refresh();
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  function refreshNow() {
    setSpinning(true);
    router.refresh();
    setCountdown(30);
    setTimeout(() => setSpinning(false), 800);
  }

  const radius = 14;
  const circ = 2 * Math.PI * radius;
  const progress = ((30 - countdown) / 30) * circ;

  return (
    <button
      onClick={refreshNow}
      title={`Auto-refreshes in ${countdown}s — click to refresh now`}
      className="relative flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors group"
    >
      {/* Circular countdown ring */}
      <div className="relative w-8 h-8 flex-shrink-0">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
          <circle
            cx="18" cy="18" r={radius} fill="none"
            stroke="#6366f1" strokeWidth="2.5"
            strokeDasharray={`${progress} ${circ}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 ${spinning ? "animate-spin" : ""}`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>
      <div className="hidden sm:block text-left">
        <p className="text-xs font-medium text-slate-700 group-hover:text-indigo-700 leading-none">Refresh</p>
        <p className="text-xs text-slate-400 mt-0.5">{countdown}s</p>
      </div>
    </button>
  );
}
