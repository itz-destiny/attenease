"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", orgName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch = form.confirmPassword === "" || form.password === form.confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password, orgName: form.orgName }),
    });
    const data = await res.json();

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(data.error || "Registration failed.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-bold text-xl text-slate-800">AttendEase</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Start tracking attendance for free</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Company / Organization Name</label>
              <input
                required
                value={form.orgName}
                onChange={(e) => setForm((f) => ({ ...f, orgName: e.target.value }))}
                placeholder="Acme Corp"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Your Full Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="John Doe"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Work Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="john@acmecorp.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Repeat your password"
                  className={`w-full border rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                    !passwordsMatch
                      ? "border-red-300 focus:ring-red-400"
                      : form.confirmPassword && passwordsMatch
                      ? "border-emerald-300 focus:ring-emerald-400"
                      : "border-slate-200 focus:ring-indigo-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {!passwordsMatch && (
                <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
              )}
              {form.confirmPassword && passwordsMatch && (
                <p className="text-xs text-emerald-600 mt-1.5">✓ Passwords match</p>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passwordsMatch || !form.confirmPassword}
              className="w-full bg-indigo-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-4">
            You will be registered as the <strong>Owner</strong> of the organization.
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-indigo-600 font-medium hover:text-indigo-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
