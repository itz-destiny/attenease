"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const STEPS = [
  {
    icon: "📍",
    title: "Add your office location",
    desc: "Go to Locations and pin your office on a map. Employees must be physically within the defined radius to check in.",
    action: { label: "Add Location →", href: "/dashboard/locations" },
  },
  {
    icon: "👥",
    title: "Invite your team",
    desc: "Go to Employees and add your staff. They'll receive login credentials and can check in immediately from their phones.",
    action: { label: "Add Employees →", href: "/dashboard/employees" },
  },
  {
    icon: "📷",
    title: "Share QR codes",
    desc: "Generate QR codes for each location. Print or display them at your office entrance — employees scan to check in instantly.",
    action: { label: "Get QR Codes →", href: "/dashboard/locations" },
  },
  {
    icon: "📊",
    title: "Monitor in real time",
    desc: "Your dashboard shows live attendance — who's in, who's late, and who hasn't checked in. Reports refresh automatically.",
    action: { label: "View Dashboard →", href: "/dashboard" },
  },
];

type Props = { hasEmployees: boolean; hasLocations: boolean };

export default function OnboardingTour({ hasEmployees, hasLocations }: Props) {
  const [dismissed, setDismissed] = useState(true);
  const [step, setStep] = useState(0);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState("");
  const [seedDone, setSeedDone] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const d = localStorage.getItem("attendease_tour_dismissed");
    if (!d) setDismissed(false);
  }, []);

  function dismiss() {
    localStorage.setItem("attendease_tour_dismissed", "1");
    setDismissed(true);
  }

  async function loadDemo() {
    setSeeding(true);
    setSeedError("");
    const res = await fetch("/api/demo/seed", { method: "POST" });
    const data = await res.json();
    setSeeding(false);
    if (res.ok) { setSeedDone(true); setTimeout(() => { window.location.reload(); }, 1500); }
    else setSeedError(data.error || "Failed to load demo data.");
  }

  if (dismissed) return null;
  if (hasEmployees || hasLocations) return null;

  return (
    <>
      {/* Onboarding checklist card */}
      <AnimatePresence>
        {!showTour && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 mb-6 text-white relative overflow-hidden"
          >
            <button onClick={dismiss} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-sm transition-colors">✕</button>

            <div className="flex items-start gap-3">
              <div className="text-3xl flex-shrink-0">👋</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1">Welcome to AttendEase!</h3>
                <p className="text-indigo-200 text-sm mb-4">Your workspace is empty. Set it up yourself or load demo data to see how the platform works.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={() => setShowTour(true)}
                    className="bg-white text-indigo-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors">
                    Show me how it works
                  </button>
                  <button onClick={loadDemo} disabled={seeding || seedDone}
                    className="bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2">
                    {seeding ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Loading demo…</>
                    ) : seedDone ? (
                      <><span>✓</span> Demo loaded! Refreshing…</>
                    ) : (
                      "Load demo data"
                    )}
                  </button>
                </div>
                {seedError && <p className="text-xs text-red-300 mt-2">{seedError}</p>}

                {/* Quick checklist */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "Add a location", done: hasLocations, href: "/dashboard/locations" },
                    { label: "Invite an employee", done: hasEmployees, href: "/dashboard/employees" },
                    { label: "Generate QR code", done: false, href: "/dashboard/locations" },
                    { label: "View first report", done: false, href: "/dashboard/reports" },
                  ].map((item) => (
                    <Link key={item.label} href={item.href} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg px-3 py-2 text-sm">
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${item.done ? "bg-emerald-400 border-emerald-400" : "border-white/50"}`}>
                        {item.done && "✓"}
                      </span>
                      <span className={item.done ? "line-through text-white/50" : "text-white"}>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step-by-step tour modal */}
      <AnimatePresence>
        {showTour && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowTour(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[460px] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Progress bar */}
              <div className="h-1.5 bg-slate-100">
                <motion.div
                  className="h-full bg-indigo-600 rounded-full"
                  animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div key={step}
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}
                  >
                    <div className="text-5xl mb-5">{STEPS[step].icon}</div>
                    <div className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-2">
                      Step {step + 1} of {STEPS.length}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{STEPS[step].title}</h3>
                    <p className="text-slate-500 leading-relaxed mb-6">{STEPS[step].desc}</p>
                    <Link href={STEPS[step].action.href} onClick={() => { setShowTour(false); dismiss(); }}
                      className="inline-block bg-indigo-50 text-indigo-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors mb-6">
                      {STEPS[step].action.label}
                    </Link>
                  </motion.div>
                </AnimatePresence>

                {/* Step dots */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {STEPS.map((_, i) => (
                      <button key={i} onClick={() => setStep(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-indigo-600 w-5" : "bg-slate-200 hover:bg-slate-300"}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setShowTour(false); dismiss(); }} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Skip tour</button>
                    {step < STEPS.length - 1 ? (
                      <button onClick={() => setStep(step + 1)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                        Next →
                      </button>
                    ) : (
                      <button onClick={() => { setShowTour(false); dismiss(); }}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
                        Get started ✓
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
