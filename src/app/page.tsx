"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  { icon: "📍", title: "GPS Geofencing", desc: "Set office locations with a custom radius. Employees can only check in when physically present — no buddy punching." },
  { icon: "📷", title: "QR Code Check-In", desc: "Print or display QR codes at your office entrance. Scan to check in instantly — no app hunting required." },
  { icon: "📊", title: "Real-Time Dashboard", desc: "See exactly who's in, who's late, and who's absent — live. The dashboard silently refreshes every 30 seconds." },
  { icon: "⏰", title: "Overtime Alerts", desc: "Get flagged automatically when an employee has been checked in for over 9 hours. Protect your team's wellbeing." },
  { icon: "📁", title: "CSV Export", desc: "Download attendance reports for any date range with one click. Works directly with Excel and Google Sheets for payroll." },
  { icon: "📣", title: "Announcements Board", desc: "Post urgent notices or general updates. All employees see them on their dashboard the moment they log in." },
];

const STEPS = [
  { n: "01", title: "Sign up your company", desc: "Create your organization account in under 2 minutes. No credit card required to start." },
  { n: "02", title: "Add locations & employees", desc: "Pin your office on a map and invite your team via email. They get login credentials instantly." },
  { n: "03", title: "Track attendance automatically", desc: "Employees tap Check In from their phone. GPS verifies they're on-site. You see it in real time." },
];

const PLANS_PREVIEW = [
  { name: "Free", monthlyPrice: 0, annualPrice: 0, employees: "Up to 5 employees", features: ["1 office location", "GPS check-in", "Basic reports"], highlighted: false },
  { name: "Growth", monthlyPrice: 14900, annualPrice: Math.round(14900 * 12 * 0.8), employees: "Up to 50 employees", features: ["Unlimited locations", "QR code check-in", "Full reports + CSV", "Overtime alerts"], highlighted: true },
  { name: "Business", monthlyPrice: 39900, annualPrice: Math.round(39900 * 12 * 0.8), employees: "Up to 200 employees", features: ["Everything in Growth", "Multiple admins", "Priority support"], highlighted: false },
];

const STATS = [
  { value: "500+", label: "Companies using AttendEase" },
  { value: "10k+", label: "Employees tracked" },
  { value: "99.9%", label: "Uptime guaranteed" },
  { value: "₦0", label: "Setup fee" },
];

const TESTIMONIALS = [
  { name: "Emeka Okafor", role: "HR Manager, Lagos", text: "AttendEase replaced our paper register completely. Our 45-person team now checks in from their phones and I can see everything live." },
  { name: "Amaka Nwachukwu", role: "CEO, Abuja", text: "The GPS verification means no one can fake attendance anymore. It paid for itself in the first month." },
  { name: "Tunde Adewale", role: "Operations Lead, PH", text: "Setup took 10 minutes. The QR codes at our gate are a hit with staff. Very professional." },
];

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, delay, ease: "easeOut" as const },
  };
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  // GSAP hero stagger
  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-anim",
        { y: 48, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.12, duration: 0.8, ease: "power3.out", delay: 0.1 }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  // GSAP counter animation
  useEffect(() => {
    if (!statsRef.current) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: statsRef.current,
        start: "top 80%",
        once: true,
        onEnter: () => {
          gsap.fromTo(
            ".stat-card",
            { y: 32, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 0.6, ease: "back.out(1.5)" }
          );
        },
      });
    }, statsRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-xl text-slate-800">AttendEase</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-slate-600 hover:text-slate-900 font-medium text-sm hidden sm:block">Sign In</Link>
            <Link href="/sign-up" className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-20 text-center">
        <div className="hero-anim inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-7">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          GPS-verified attendance · Built for Nigerian teams
        </div>
        <h1 className="hero-anim text-4xl sm:text-6xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
          Your Team, Always<br />
          <span className="text-indigo-600">Accounted For</span>
        </h1>
        <p className="hero-anim text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Replace paper registers and manual tracking. AttendEase lets employees check in with GPS verification — and gives you a real-time view of who's in, who's late, and who's absent.
        </p>
        <div className="hero-anim flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/sign-up"
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-semibold text-base hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 w-full sm:w-auto">
            Start for Free →
          </Link>
          <Link href="/pricing"
            className="border border-slate-200 text-slate-700 px-8 py-3.5 rounded-2xl font-semibold text-base hover:bg-slate-50 transition-colors w-full sm:w-auto">
            See Pricing
          </Link>
        </div>
        <p className="hero-anim text-xs text-slate-400 mt-5">No credit card · Free forever for small teams · 5 employees included</p>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          className="mt-16 mx-auto max-w-4xl"
        >
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-1 shadow-2xl shadow-indigo-900/20">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[20px] p-6 text-left">
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 mb-5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="ml-3 flex-1 bg-slate-700 rounded-md h-6 flex items-center px-3">
                  <span className="text-slate-400 text-xs">app.attendease.com/dashboard</span>
                </div>
              </div>
              {/* Mock stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Total Employees", value: "24", color: "bg-indigo-500" },
                  { label: "Currently In", value: "18", color: "bg-emerald-500" },
                  { label: "Late Today", value: "2", color: "bg-amber-500" },
                  { label: "Locations", value: "3", color: "bg-purple-500" },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className={`w-7 h-7 ${s.color} rounded-lg mb-2 opacity-80`} />
                    <div className="text-xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Mock attendance list */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700">
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-slate-300 text-sm font-semibold">Today&apos;s Attendance</span>
                  <span className="text-xs text-indigo-400">Live</span>
                </div>
                {[
                  { name: "Chisom Eze", time: "08:02", status: "Active", dot: "bg-emerald-500" },
                  { name: "Biodun Adeyemi", time: "09:15", status: "Late", dot: "bg-amber-500" },
                  { name: "Ngozi Obi", time: "08:45", status: "Active", dot: "bg-emerald-500" },
                ].map((r) => (
                  <div key={r.name} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-indigo-100">
                        {r.name[0]}
                      </div>
                      <div>
                        <div className="text-sm text-slate-200 font-medium">{r.name}</div>
                        <div className="text-xs text-slate-500">Checked in {r.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${r.dot}`} />
                      <span className="text-xs text-slate-400">{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section ref={statsRef} className="bg-indigo-600 py-12">
        <div className="max-w-4xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="stat-card text-center opacity-0">
              <div className="text-3xl font-extrabold text-white mb-1">{s.value}</div>
              <div className="text-indigo-200 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-5 sm:px-8 py-24">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Everything you need to manage attendance</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">From GPS check-in to overtime alerts — all in one place, accessible from any device.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} {...fadeUp(i * 0.08)}
              className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-bold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-50 py-24">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Up and running in 10 minutes</h2>
            <p className="text-slate-500 text-lg">No hardware, no complex setup. Just sign up and go.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} {...fadeUp(i * 0.15)} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%_-_24px)] w-12 h-px bg-indigo-200 z-0" />
                )}
                <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm relative z-10">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg mb-5">
                    {s.n}
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mb-2">{s.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-24">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Trusted by teams across Nigeria</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} {...fadeUp(i * 0.1)}
              className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, k) => <span key={k} className="text-amber-400 text-sm">★</span>)}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section id="pricing" className="bg-slate-50 py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Simple, flat-rate pricing in Naira</h2>
            <p className="text-slate-500 text-lg mb-8">No per-seat fees. One price, your whole team.</p>

            {/* Toggle */}
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 gap-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  billing === "monthly" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  billing === "annual" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Annual
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${billing === "annual" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                  Save 20%
                </span>
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS_PREVIEW.map((plan, i) => {
              const monthlyEq = billing === "annual" && plan.monthlyPrice > 0
                ? Math.round(plan.annualPrice / 12)
                : plan.monthlyPrice;

              return (
                <motion.div key={plan.name} {...fadeUp(i * 0.1)}
                  className={`bg-white rounded-3xl border-2 p-7 flex flex-col ${
                    plan.highlighted ? "border-indigo-500 shadow-xl shadow-indigo-100" : "border-slate-100"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full self-start mb-4">
                      Most Popular
                    </div>
                  )}
                  <h3 className="font-bold text-slate-800 text-lg mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mb-5">{plan.employees}</p>

                  <AnimatePresence mode="wait">
                    <motion.div key={`${plan.name}-${billing}`}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                      className="mb-6"
                    >
                      {plan.monthlyPrice === 0 ? (
                        <p className="text-3xl font-extrabold text-slate-900">Free</p>
                      ) : (
                        <>
                          <p className="text-3xl font-extrabold text-slate-900">
                            {fmt(monthlyEq)}
                            <span className="text-base font-normal text-slate-400">/mo</span>
                          </p>
                          {billing === "annual" && (
                            <p className="text-xs text-emerald-600 font-medium mt-1">
                              {fmt(plan.annualPrice)} billed annually
                            </p>
                          )}
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  <ul className="space-y-2.5 flex-1 mb-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-indigo-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.monthlyPrice === 0 ? "/sign-up" : "/pricing"}
                    className={`block text-center py-3 rounded-2xl text-sm font-semibold transition-colors ${
                      plan.highlighted
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    {plan.monthlyPrice === 0 ? "Get Started Free" : "Get Started"}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <motion.p {...fadeUp(0.3)} className="text-center text-slate-400 text-sm mt-8">
            Need 200+ employees?{" "}
            <Link href="/pricing" className="text-indigo-600 font-semibold hover:text-indigo-700">View Enterprise →</Link>
          </motion.p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-5 sm:px-8">
        <motion.div {...fadeUp()} className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-12 text-white shadow-2xl shadow-indigo-200">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to modernise your attendance?</h2>
            <p className="text-indigo-200 text-lg mb-8">Join hundreds of Nigerian businesses already using AttendEase. Free to start, no card needed.</p>
            <Link href="/sign-up"
              className="inline-block bg-white text-indigo-700 font-bold px-8 py-4 rounded-2xl text-base hover:bg-indigo-50 transition-colors shadow-lg">
              Create Your Free Account →
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-10 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="font-bold text-slate-800">AttendEase</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/pricing" className="hover:text-slate-700 transition-colors">Pricing</Link>
            <Link href="/sign-in" className="hover:text-slate-700 transition-colors">Sign In</Link>
            <Link href="/sign-up" className="hover:text-slate-700 transition-colors">Sign Up</Link>
          </div>
          <p className="text-slate-400 text-xs">© 2026 AttendEase · Built for Nigerian teams</p>
        </div>
      </footer>
    </div>
  );
}
