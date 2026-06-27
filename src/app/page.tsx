import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-xl text-slate-800">AttendEase</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-slate-600 hover:text-slate-900 font-medium text-sm">Sign In</Link>
          <Link href="/sign-up" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          GPS-Verified Attendance
        </div>
        <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-6">
          Attendance Tracking<br />
          <span className="text-indigo-600">Built for Modern Teams</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          Let your employees check in with one tap. Verify location automatically. Get real-time reports. No hardware needed.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/sign-up" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            Start Free Trial
          </Link>
          <Link href="/sign-in" className="border border-slate-200 text-slate-700 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-slate-50 transition-colors">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: "📍", title: "GPS Geofencing", desc: "Set office locations with custom radius. Employees can only check in when physically present." },
          { icon: "📊", title: "Real-time Dashboard", desc: "See who's in, who's late, and who's absent — live. Export reports to CSV for payroll." },
          { icon: "🏢", title: "Multi-tenant SaaS", desc: "Each company gets their own isolated workspace. Manage multiple locations and teams." },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{f.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Simple Pricing</h2>
        <p className="text-center text-slate-500 mb-12">Start free, scale as you grow</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { plan: "Starter", price: "Free", features: ["Up to 10 employees", "1 location", "30-day history"], cta: "Get Started", highlighted: false },
            { plan: "Growth", price: "$29/mo", features: ["Up to 100 employees", "10 locations", "1-year history", "CSV exports"], cta: "Start Trial", highlighted: true },
            { plan: "Enterprise", price: "$99/mo", features: ["Unlimited employees", "Unlimited locations", "Full history", "Priority support"], cta: "Contact Us", highlighted: false },
          ].map((p) => (
            <div key={p.plan} className={`rounded-2xl p-8 border ${p.highlighted ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200" : "bg-white border-slate-100"}`}>
              <div className={`text-sm font-semibold mb-2 ${p.highlighted ? "text-indigo-200" : "text-indigo-600"}`}>{p.plan}</div>
              <div className={`text-3xl font-extrabold mb-6 ${p.highlighted ? "text-white" : "text-slate-900"}`}>{p.price}</div>
              <ul className="space-y-2 mb-8">
                {p.features.map((f) => (
                  <li key={f} className={`text-sm flex items-center gap-2 ${p.highlighted ? "text-indigo-100" : "text-slate-600"}`}>
                    <span className="text-emerald-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className={`block text-center py-2 rounded-xl font-semibold text-sm transition-colors ${p.highlighted ? "bg-white text-indigo-600 hover:bg-indigo-50" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-slate-400 text-sm">
        © 2026 AttendEase. Built for growing teams.
      </footer>
    </div>
  );
}
