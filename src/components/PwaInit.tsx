"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "chrome" | "other";
type ModalStep = "intro" | "ios-steps" | "done";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Chrome/.test(ua) && !/Edg/.test(ua)) return "chrome";
  return "other";
}

function isAlreadyInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    !!(window.navigator as unknown as { standalone?: boolean }).standalone
  );
}

export default function PwaInit() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [step, setStep] = useState<ModalStep>("intro");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }

    // Don't show if already installed
    if (isAlreadyInstalled()) return;

    // Don't show if user permanently dismissed
    if (localStorage.getItem("pwa-never")) return;

    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);

    // Capture Chrome/Edge native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show modal after short delay — first visit only or after 24h snooze
    const snoozedUntil = localStorage.getItem("pwa-snooze");
    const shouldShow = !snoozedUntil || Date.now() > parseInt(snoozedUntil);

    if (shouldShow) {
      const timer = setTimeout(() => setShow(true), 2500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (installPrompt) {
      setInstalling(true);
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      setInstalling(false);
      if (outcome === "accepted") {
        setStep("done");
        setTimeout(() => setShow(false), 2000);
      }
    } else if (platform === "ios") {
      setStep("ios-steps");
    }
  }

  function snooze() {
    localStorage.setItem("pwa-snooze", String(Date.now() + 24 * 60 * 60 * 1000));
    setShow(false);
  }

  function neverShow() {
    localStorage.setItem("pwa-never", "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={snooze} />

      {/* Modal */}
      <div className="fixed inset-x-4 bottom-6 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-8 sm:w-[420px] z-50 animate-slide-up">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 pt-8 pb-10 text-white text-center relative">
            <button onClick={snooze} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white/80 hover:bg-white/30 transition-colors text-sm">✕</button>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black mx-auto mb-3 backdrop-blur-sm">A</div>
            <h2 className="text-xl font-bold">Install AttendEase</h2>
            <p className="text-indigo-100 text-sm mt-1">Works offline · Instant check-ins · No browser bar</p>
          </div>

          {/* Content */}
          <div className="px-6 py-6 -mt-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-5">

              {step === "intro" && (
                <div className="space-y-3">
                  {[
                    { icon: "⚡", title: "One-tap check-in", desc: "Open directly from your home screen" },
                    { icon: "📴", title: "Works offline", desc: "View your history without internet" },
                    { icon: "🔔", title: "Push notifications", desc: "Get checkout reminders" },
                  ].map((f) => (
                    <div key={f.title} className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{f.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{f.title}</p>
                        <p className="text-xs text-slate-400">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === "ios-steps" && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">How to install on iPhone / iPad</p>
                  {[
                    { n: 1, icon: "⬆️", text: "Tap the Share button in your browser toolbar" },
                    { n: 2, icon: "📋", text: 'Scroll down and tap "Add to Home Screen"' },
                    { n: 3, icon: "✅", text: 'Tap "Add" in the top-right corner' },
                  ].map((s) => (
                    <div key={s.n} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{s.n}</div>
                      <span className="text-lg">{s.icon}</span>
                      <p className="text-sm text-slate-700">{s.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {step === "done" && (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="font-semibold text-slate-800">App installed!</p>
                  <p className="text-sm text-slate-400 mt-1">Find AttendEase on your home screen</p>
                </div>
              )}
            </div>

            {step !== "done" && (
              <>
                {step === "intro" && platform === "ios" ? (
                  <button onClick={() => setStep("ios-steps")}
                    className="w-full bg-indigo-600 text-white rounded-2xl py-3.5 font-semibold text-sm hover:bg-indigo-700 transition-colors">
                    Show me how →
                  </button>
                ) : step === "ios-steps" ? (
                  <button onClick={snooze}
                    className="w-full bg-indigo-50 text-indigo-600 rounded-2xl py-3.5 font-semibold text-sm hover:bg-indigo-100 transition-colors">
                    Got it, I&apos;ll install it
                  </button>
                ) : (
                  <button onClick={handleInstall} disabled={installing}
                    className="w-full bg-indigo-600 text-white rounded-2xl py-3.5 font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                    {installing ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Installing…</>
                    ) : (
                      <>{platform === "ios" ? "📱 Install on iPhone" : "⬇️ Install App"}</>
                    )}
                  </button>
                )}

                <div className="flex items-center justify-between mt-3">
                  <button onClick={snooze} className="text-xs text-slate-400 hover:text-slate-600 transition-colors py-1">Remind me later</button>
                  <button onClick={neverShow} className="text-xs text-slate-300 hover:text-slate-500 transition-colors py-1">Don&apos;t show again</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.35s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>
    </>
  );
}
