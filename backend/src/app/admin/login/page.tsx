"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Lock, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export default function AdminLoginPage() {
  const router = useRouter();
  const [googleEmail, setGoogleEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSSO = async (emailToSubmit: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToSubmit }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "دسترسی مجاز نمی‌باشد.");
      }

      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Header */}
      <header className="p-6 max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/images/honarhub_pay_logo.png" alt="هنرهاب پی" className="h-8 w-auto object-contain" />
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full font-mono">
            v{APP_VERSION}
          </span>
        </Link>

        <Link href="/" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition">
          <span>صفحه اصلی</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white">ورود مدیران با Google SSO</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              دسترسی به پنل ادمین منحصراً برای ایمیل‌های ثبت‌شده در متغیر محیطی <code className="text-emerald-400 font-mono">ADMIN_EMAILS</code> فراهم است.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick SSO Button */}
          <div className="space-y-3">
            <button
              onClick={() => handleGoogleSSO(googleEmail || "admin@honarhub.ir")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl transition shadow-lg text-xs"
            >
              {/* Google SVG Logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? "در حال اعتبارسنجی..." : "ورود با حساب گوگل (Google SSO)"}</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <span className="bg-[#0F172A] px-3 text-[10px] text-slate-500 z-10">یا ورود با ایمیل مدیریت</span>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGoogleSSO(googleEmail);
              }}
              className="space-y-3"
            >
              <input
                type="email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="admin@honarhub.ir"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-xs font-mono focus:outline-none transition"
                dir="ltr"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl transition text-xs"
              >
                بررسی دسترسی ادمین
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-[11px] text-slate-600">
        سامانه درگاه پرداخت {APP_NAME} • کنترل دسترسی مدیریت
      </footer>
    </div>
  );
}
