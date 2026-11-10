"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { APP_NAME, APP_VERSION } from "@/lib/version";

declare global {
  interface Window {
    google?: any;
  }
}

type Mode = "LOGIN" | "RESET_REQUEST" | "RESET_VERIFY";

export default function AdminLoginPage() {
  const router = useRouter();

  // Mode: LOGIN | RESET_REQUEST | RESET_VERIFY
  const [mode, setMode] = useState<Mode>("LOGIN");

  // Form Fields
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status & Messages
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // OTP Countdown Timer (120s)
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startOtpTimer = () => {
    setTimerSeconds(120);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  // Check URL params for error and fetch current session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      if (urlError) {
        setError(decodeURIComponent(urlError));
      }
    }

    const checkSession = async () => {
      try {
        const res = await fetch("/api/v1/auth/admin");
        const data = await res.json();
        if (data.authenticated) {
          router.push("/admin");
          return;
        }
        if (data.googleClientId) {
          setGoogleClientId(data.googleClientId);
        }
      } catch {
        // Fallback
      }
    };
    checkSession();
  }, [router]);

  // Handle Login via Email & Password
  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: adminEmail.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.needsPasswordSetup) {
          setError(data.error);
          setMode("RESET_REQUEST");
          return;
        }
        throw new Error(data.error || "ورود ناموفق بود. دسترسی مدیریت تایید نشد.");
      }

      setSuccessMsg("ورود موفقیت‌آمیز بود. در حال انتقال به پنل...");
      setTimeout(() => router.push("/admin"), 600);
    } catch (err: any) {
      setError(err.message || "خطا در احراز هویت ادمین");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP for Password Reset
  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      setError("لطفاً آدرس ایمیل مدیریت را وارد فرمایید.");
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_otp",
          email: adminEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطا در ارسال کد تایید به ایمیل.");
      }

      setSuccessMsg(`کد تایید ۵ رقمی به آدرس ایمیل ${adminEmail} ارسال شد.`);
      setMode("RESET_VERIFY");
      startOtpTimer();
    } catch (err: any) {
      setError(err.message || "خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Set New Password
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 5) {
      setError("لطفاً کد تایید ۵ رقمی را کامل وارد فرمایید.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("کلمه عبور جدید باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          email: adminEmail.trim(),
          code: otpCode.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "کد تایید یا فرآیند تغییر رمز ناموفق بود.");
      }

      setSuccessMsg("کلمه عبور مدیریت با موفقیت ثبت شد و وارد پنل شدید.");
      setTimeout(() => router.push("/admin"), 800);
    } catch (err: any) {
      setError(err.message || "خطا در ثبت رمز عبور جدید");
    } finally {
      setLoading(false);
    }
  };

  // Google Identity Services (One Tap / GIS callback)
  const initGoogleGIS = () => {
    const cId = googleClientId || "488680062949-dp0todqjgl6a67ku94a2j9sbr7hee8du.apps.googleusercontent.com";
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: cId,
          callback: async (response: any) => {
            if (response?.credential) {
              setLoading(true);
              try {
                const res = await fetch("/api/v1/auth/admin", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ credential: response.credential }),
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                  throw new Error(data.error || "دسترسی مدیریت به این حساب گوگل داده نشده است.");
                }
                setSuccessMsg("ورود با حساب گوگل موفقیت‌آمیز بود. در حال انتقال...");
                setTimeout(() => router.push("/admin"), 500);
              } catch (err: any) {
                setError(err.message);
              } finally {
                setLoading(false);
              }
            }
          },
        });

        // Render official GIS button if container is present
        const container = document.getElementById("google-gis-container");
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: "filled_blue",
            size: "large",
            type: "standard",
            shape: "pill",
            text: "signin_with",
            locale: "fa",
            width: 360,
          });
        }
      } catch (e) {
        console.warn("[GIS_INIT_WARNING]", e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Google Identity Services Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleGIS}
      />

      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[30%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[130px]" />
      </div>

      {/* Header */}
      <header className="p-6 max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/images/honarhub_pay_logo.png" alt="هنرهاب پی" className="h-8 w-auto object-contain" />
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full font-mono">
            v{APP_VERSION}
          </span>
        </Link>

        <Link href="/" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition">
          <span>بازگشت به سایت</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white">ورود به پنل مدیریت</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              کنترل‌پنل مدیریت درگاه پرداخت و تسویه هوشمند {APP_NAME}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl text-xs leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-xs leading-relaxed flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: Standard Login (Google SSO or Admin Email + Password) */}
          {mode === "LOGIN" && (
            <div className="space-y-4">
              {/* 1. Google SSO Button & GIS */}
              <div className="space-y-2.5">
                <div id="google-gis-container" className="w-full flex justify-center empty:hidden" />
                <a
                  href="/api/v1/auth/google"
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl transition shadow-lg text-xs group"
                >
                  {/* Official Google Vector Logo */}
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
                  <span>ورود با حساب گوگل (Google SSO)</span>
                </a>
              </div>

              {/* Separator */}
              <div className="relative flex items-center justify-center my-4">
                <span className="bg-[#0F172A] px-3 text-[11px] text-slate-400 z-10">یا ورود با ایمیل مدیریت</span>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
              </div>

              {/* 2. Email & Password Form */}
              <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block text-xs">آدرس ایمیل ادمین:</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-xs font-mono focus:outline-none transition pr-10"
                      dir="ltr"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium block text-xs">رمز عبور:</label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccessMsg(null);
                        setMode("RESET_REQUEST");
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 transition"
                    >
                      تغییر یا تنظیم رمز با ایمیل؟
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-xs font-mono focus:outline-none transition pr-10 pl-10"
                      dir="ltr"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-500 hover:text-slate-300 absolute left-3.5 top-3.5 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !adminEmail || !password}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-black py-3.5 rounded-xl transition text-xs shadow-lg shadow-amber-500/20"
                >
                  {loading ? "در حال اعتبارسنجی..." : "ورود به کنترل‌پنل مدیریت"}
                </button>
              </form>
            </div>
          )}

          {/* MODE 2: Request Password Reset via Email OTP */}
          {mode === "RESET_REQUEST" && (
            <form onSubmit={handleSendResetOtp} className="space-y-4">
              <div className="text-center space-y-1 pb-1">
                <h2 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>تنظیم / تغییر کلمه عبور مدیر</span>
                </h2>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  کد تایید یکبار مصرف ۵ رقمی به آدرس ایمیل مدیریت ارسال خواهد شد.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block text-xs">آدرس ایمیل ادمین:</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-xs font-mono focus:outline-none transition pr-10"
                    dir="ltr"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !adminEmail}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl transition text-xs shadow-lg shadow-amber-500/20"
              >
                {loading ? "در حال ارسال کد تایید..." : "ارسال کد یکبار مصرف به ایمیل"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setMode("LOGIN");
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-white py-1 transition"
              >
                بازگشت به صفحه ورود
              </button>
            </form>
          )}

          {/* MODE 3: Verify OTP and Set New Password */}
          {mode === "RESET_VERIFY" && (
            <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
              <div className="text-center space-y-1 pb-1">
                <h2 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>تایید کد و تعیین کلمه عبور جدید</span>
                </h2>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  کد تایید ۵ رقمی ارسال‌شده به <span className="text-emerald-400 font-mono" dir="ltr">{adminEmail}</span> را وارد نمایید.
                </p>
              </div>

              {/* 5-Digit OTP Code */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block text-xs">کد تایید ۵ رقمی ایمیل:</label>
                <input
                  type="text"
                  maxLength={5}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="•••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-700 text-center text-lg font-mono tracking-widest focus:outline-none transition"
                  dir="ltr"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block text-xs">کلمه عبور جدید (حداقل ۶ کاراکتر):</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-xs font-mono focus:outline-none transition pr-10 pl-10"
                    dir="ltr"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-slate-500 hover:text-slate-300 absolute left-3.5 top-3.5 transition"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Timer & Resend */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>مدت زمان اعتبار کد:</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleSendResetOtp}
                    disabled={loading}
                    className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>ارسال مجدد کد تایید</span>
                  </button>
                ) : (
                  <span className="font-mono text-emerald-400 font-bold">{formatTimer(timerSeconds)}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 5 || newPassword.length < 6}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-black py-3.5 rounded-xl transition text-xs shadow-lg shadow-emerald-500/20"
              >
                {loading ? "در حال ثبت رمز جدید..." : "ثبت کلمه عبور و ورود به پنل"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setMode("LOGIN");
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-white py-1 transition"
              >
                انصراف و بازگشت به ورود
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-[11px] text-slate-600">
        سامانه درگاه پرداخت {APP_NAME} • کنترل پنل مدیریت یکپارچه
      </footer>
    </div>
  );
}
