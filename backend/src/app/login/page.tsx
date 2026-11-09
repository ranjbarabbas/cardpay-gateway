"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  CreditCard,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Sparkles,
  ArrowLeft,
  Key,
} from "lucide-react";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export default function LoginPage() {
  const router = useRouter();
  const [authInput, setAuthInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!authInput.trim()) {
      setError("لطفاً شماره موبایل یا ایمیل خود را وارد نمایید.");
      return;
    }

    setLoading(true);
    try {
      const isEmail = authInput.includes("@");
      const payload: any = {
        name: nameInput.trim() || undefined,
      };

      if (isEmail) {
        payload.email = authInput.trim();
      } else {
        payload.phone = authInput.trim();
      }

      const res = await fetch("/api/v1/auth/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطا در احراز هویت");
      }

      // Store in localStorage for client ease
      localStorage.setItem("honarhub_user", JSON.stringify(data.data));
      router.push("/portal");
    } catch (err: any) {
      setError(err.message || "خطای ناشناخته رخ داد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[30%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[130px]" />
      </div>

      {/* Header */}
      <header className="p-6 max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/images/honarhub_pay_logo.png" alt="هنرهاب پی" className="h-8 w-auto object-contain group-hover:scale-105 transition" />
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
            v{APP_VERSION}
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <span>بازگشت به صفحه اصلی</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Auth Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white">ورود و ثبت‌نام در {APP_NAME}</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              جهت دسترسی به پنل کاربری، ثبت کارت بانکی و دریافت کلید اختصاصی درگاه پرداخت
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium flex items-center justify-between">
                <span>شماره موبایل یا ایمیل:</span>
                <span className="text-[10px] text-emerald-400">پلن رایگان فعال</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={authInput}
                  onChange={(e) => setAuthInput(e.target.value)}
                  placeholder="09123456789 یا you@gmail.com"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-xs font-mono focus:outline-none transition"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">نام یا عنوان کاربر (اختیاری):</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="مثلاً: علیرضا محمدی"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-xs focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-600/20 text-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>در حال بررسی و ورود...</span>
              ) : (
                <>
                  <span>ورود به پنل کاربری</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Quick Perks of Free Tier */}
          <div className="border-t border-slate-800/80 pt-4 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>پلن پایه همیشه رایگان: ۱ کارت فعال + ۱ دستگاه متصل + کلید API</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>تسویه لحظه‌ای مستقیم به شماره شبا و حساب شخصی</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-[11px] text-slate-600">
        سامانه درگاه پرداخت {APP_NAME} • توسعه‌یافته به صورت کاملاً مستقل و متن‌باز ❤️
      </footer>
    </div>
  );
}
