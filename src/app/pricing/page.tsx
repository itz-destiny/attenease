"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const PLANS = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    employees: "Up to 5 employees",
    color: "border-slate-200",
    badge: null,
    cta: "Get Started Free",
    features: [
      "1 office location",
      "GPS check-in & check-out",
      "7-day attendance history",
      "Employee mobile PWA",
      "Basic attendance reports",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    monthlyPrice: 14900,
    annualPrice: Math.round(14900 * 12 * 0.8),
    employees: "Up to 50 employees",
    color: "border-indigo-500",
    badge: "Most Popular",
    cta: "Upgrade to Growth",
    features: [
      "Unlimited office locations",
      "QR code check-in",
      "Full attendance reports",
      "CSV export",
      "Announcements board",
      "Real-time dashboard (auto-refresh)",
      "Overtime alerts",
      "Employee profile management",
      "PWA install on all devices",
    ],
  },
  {
    key: "business",
    name: "Business",
    monthlyPrice: 39900,
    annualPrice: Math.round(39900 * 12 * 0.8),
    employees: "Up to 200 employees",
    color: "border-purple-500",
    badge: null,
    cta: "Upgrade to Business",
    features: [
      "Everything in Growth",
      "Multiple admin accounts",
      "Department groupings",
      "Advanced analytics",
      "Priority email support",
      "Dedicated account manager",
      "Audit logs",
      "Custom branding (coming soon)",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    employees: "200+ employees",
    color: "border-slate-300",
    badge: null,
    cta: "Contact Sales",
    features: [
      "Everything in Business",
      "Dedicated infrastructure",
      "SLA guarantee",
      "Custom integrations",
      "On-premise option",
      "24/7 phone support",
      "Compliance & audit reports",
    ],
  },
];

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleUpgrade(planKey: string) {
    if (planKey === "free") { router.push("/sign-up"); return; }
    if (planKey === "enterprise") { window.location.href = "mailto:support@attendease.com?subject=Enterprise Enquiry"; return; }
    if (!user) { router.push(`/sign-up?plan=${planKey}`); return; }

    setLoading(planKey);
    setError("");
    const res = await fetch("/api/paystack/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planKey, billing }),
    });
    const data = await res.json();
    setLoading(null);

    if (!res.ok) { setError(data.error || "Something went wrong."); return; }
    window.location.href = data.authorizationUrl;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-slate-800">AttendEase</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href={user.role === "employee" ? "/employee" : "/dashboard"}
              className="text-sm text-slate-600 hover:text-indigo-600 font-medium transition-colors">
              Back to Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors">Sign in</Link>
              <Link href="/sign-up" className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center pt-14 pb-12 px-4">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span>🇳🇬</span> Priced for Nigerian businesses
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Flat-rate per organisation — no per-seat surprises. Cancel anytime.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center mt-8">
          <div className="inline-flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 gap-1 shadow-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                billing === "monthly" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                billing === "annual" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Annual
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                billing === "annual" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
              }`}>
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Plans */}
      {error && (
        <p className="text-center text-red-600 text-sm mb-4 bg-red-50 max-w-md mx-auto px-4 py-2 rounded-xl">{error}</p>
      )}

      <div className="max-w-6xl mx-auto px-4 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((plan) => {
          const isCurrentPlan = user?.organization?.plan === plan.key;
          const price = billing === "annual" ? plan.annualPrice : plan.monthlyPrice;
          const isPopular = plan.badge === "Most Popular";

          return (
            <div key={plan.key} className={`relative bg-white rounded-3xl border-2 ${isPopular ? "border-indigo-500 shadow-xl shadow-indigo-100" : plan.color} p-6 flex flex-col`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-800 mb-1">{plan.name}</h2>
                <p className="text-xs text-slate-400">{plan.employees}</p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={`${plan.key}-${billing}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
                  className="mb-6"
                >
                  {plan.monthlyPrice === null ? (
                    <p className="text-3xl font-extrabold text-slate-900">Custom</p>
                  ) : plan.monthlyPrice === 0 ? (
                    <p className="text-3xl font-extrabold text-slate-900">Free</p>
                  ) : (
                    <>
                      <p className="text-3xl font-extrabold text-slate-900">
                        {fmt(billing === "annual" ? Math.round(price! / 12) : price!)}
                        <span className="text-base font-normal text-slate-400">/mo</span>
                      </p>
                      {billing === "annual" && (
                        <p className="text-xs text-emerald-600 font-medium mt-1">{fmt(price!)} billed annually</p>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <ul className="space-y-2.5 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-indigo-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.key)}
                disabled={isCurrentPlan || loading === plan.key}
                className={`w-full py-3 rounded-2xl text-sm font-semibold transition-colors ${
                  isCurrentPlan
                    ? "bg-slate-100 text-slate-400 cursor-default"
                    : isPopular
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : plan.key === "enterprise"
                    ? "bg-slate-800 text-white hover:bg-slate-900"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                } disabled:opacity-60`}
              >
                {loading === plan.key ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Redirecting…
                  </span>
                ) : isCurrentPlan ? (
                  "Current Plan"
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="text-center pb-16 px-4">
        <p className="text-slate-400 text-sm">
          All plans include SSL security, 99.9% uptime, and free updates. · Payments secured by{" "}
          <span className="font-semibold text-slate-600">Paystack</span>
        </p>
        <p className="text-slate-300 text-xs mt-2">Prices in Nigerian Naira (NGN). VAT may apply.</p>
      </div>
    </div>
  );
}
