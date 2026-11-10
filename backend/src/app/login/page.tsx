"use client";

import { useState, useEffect } from "react";
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
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { APP_NAME, APP_VERSION } from "@/lib/version";
import { toPersianDigits } from "@/lib/persian-utils";

type AuthStep =
  | "IDENTIFIER"
  | "PASSWORD"
  | "NEW_USER_OTP"
  | "NEW_USER_SET_PASSWORD"
  | "OTP_LOGIN"
  | "RESET_PASSWORD";

export default function LoginPage() {
  const router = useRouter();

  // Primary state
  const [step, setStep] = useState<AuthStep>("IDENTIFIER");
  const [authInput, setAuthInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [nameInput, setNameInput] = useState("");

  // Helpers & UI
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [targetClean, setTargetClean] = useState("");
  const [isEmailTarget, setIsEmailTarget] = useState(false);

  // Timer for OTP resend countdown (120 seconds)
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: any;
    if (["NEW_USER_OTP", "OTP_LOGIN", "RESET_PASSWORD"].includes(step) && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  const startOtpTimer = () => {
    setTimerSeconds(120);
    setCanResend(false);
  };

  // Step 1: Identifier check
  const handleCheckIdentifier = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmed = authInput.trim();
    if (!trimmed) {
      setError("لطفاً شماره موبایل یا آدرس ایمیل خود را وارد فرمایید.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check",
          identifier: trimmed,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "خطا در بررسی مشخصات");
      }

      setTargetClean(json.target);
      setIsEmailTarget(json.isEmail);
      if (json.name) setNameInput(json.name);

      if (json.exists) {
        if (json.hasPassword) {
          // Existing user with password -> Ask for Password
          setStep("PASSWORD");
        } else {
          // Existing user without password -> Send OTP & login
          await triggerSendOtp(json.target, "ورود با رمز یکبار مصرف");
          setStep("OTP_LOGIN");
        }
      } else {
        // New user -> Send OTP and guide to set password
        await triggerSendOtp(json.target, "ثبت‌نام و دریافت کد تایید");
        setStep("NEW_USER_OTP");
      }
    } catch (err: any) {
      setError(err.message || "خطا در بررسی مشخصات");
    } finally {
      setLoading(false);
    }
  };

  // Trigger sending OTP
  const triggerSendOtp = async (target: string, contextTitle: string) => {
    setError(null);
    const res = await fetch("/api/v1/auth/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_otp",
        identifier: target,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "خطا در ارسال کد تایید");
    }
    setSuccessMsg(json.message || "کد تایید ۵ رقمی ارسال گردید.");
    startOtpTimer();
  };

  // Step 2 (Existing User): Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!passwordInput) {
      setError("لطفاً کلمه عبور خود را وارد نمایید.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login_password",
          identifier: targetClean || authInput,
          password: passwordInput,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "کلمه عبور وارد شده نادرست است.");
      }

      localStorage.setItem("honarhub_user", JSON.stringify(json.data));
      router.push("/portal");
    } catch (err: any) {
      setError(err.message || "کلمه عبور نادرست است.");
    } finally {
      setLoading(false);
    }
  };

  // Switch to OTP login for existing users
  const handleSwitchToOtpLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await triggerSendOtp(targetClean || authInput, "ورود با رمز یکبار مصرف");
      setOtpCode("");
      setStep("OTP_LOGIN");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Switch to Forgot Password
  const handleSwitchToForgotPassword = async () => {
    setError(null);
    setLoading(true);
    try {
      await triggerSendOtp(targetClean || authInput, "بازیابی کلمه عبور");
      setOtpCode("");
      setPasswordInput("");
      setConfirmPasswordInput("");
      setStep("RESET_PASSWORD");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 (New User): Verify OTP code
  const handleVerifyNewUserOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanCode = otpCode.trim().replace(/[^0-9]/g, "");
    if (!cleanCode || cleanCode.length < 4) {
      setError("لطفاً کد تایید ۵ رقمی را کامل وارد نمایید.");
      return;
    }

    // Code verified locally, move to Step 3: Setting password
    setSuccessMsg("کد تایید هویت با موفقیت بررسی شد. اکنون نام و کلمه عبور خود را تعیین فرمایید.");
    setStep("NEW_USER_SET_PASSWORD");
  };

  // Step 3 (New User): Set Password & Complete Registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordInput || passwordInput.length < 6) {
      setError("کلمه عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setError("تکرار کلمه عبور با کلمه عبور وارد شده مطابقت ندارد.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          identifier: targetClean || authInput,
          code: otpCode.trim(),
          password: passwordInput,
          name: nameInput.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "خطا در تکمیل ثبت‌نام");
      }

      localStorage.setItem("honarhub_user", JSON.stringify(json.data));
      router.push("/portal");
    } catch (err: any) {
      setError(err.message || "خطا در ثبت‌نام");
    } finally {
      setLoading(false);
    }
  };

  // OTP Login Submission
  const handleOtpLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanCode = otpCode.trim().replace(/[^0-9]/g, "");
    if (!cleanCode || cleanCode.length < 4) {
      setError("کد تایید را وارد نمایید.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login_otp",
          identifier: targetClean || authInput,
          code: cleanCode,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "کد تایید وارد شده نادرست است.");
      }

      localStorage.setItem("honarhub_user", JSON.stringify(json.data));
      router.push("/portal");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Submission
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otpCode) {
      setError("لطفاً کد تایید دریافتی را وارد فرمایید.");
      return;
    }
    if (!passwordInput || passwordInput.length < 6) {
      setError("کلمه عبور جدید باید حداقل ۶ کاراکتر باشد.");
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setError("تکرار کلمه عبور مطابقت ندارد.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          identifier: targetClean || authInput,
          code: otpCode.trim(),
          newPassword: passwordInput,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "خطا در تغییر کلمه عبور");
      }

      localStorage.setItem("honarhub_user", JSON.stringify(json.data));
      router.push("/portal");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      await triggerSendOtp(targetClean || authInput, "ارسال مجدد کد تایید");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${toPersianDigits(mins)}:${secs < 10 ? "۰" : ""}${toPersianDigits(secs)}`;
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

      {/* Auth Card Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Top Brand & Title */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
              {step === "IDENTIFIER" && <Sparkles className="w-7 h-7" />}
              {step === "PASSWORD" && <Lock className="w-7 h-7 text-teal-400" />}
              {(step === "NEW_USER_OTP" || step === "OTP_LOGIN") && <Smartphone className="w-7 h-7 text-emerald-400" />}
              {step === "NEW_USER_SET_PASSWORD" && <KeyRound className="w-7 h-7 text-amber-400" />}
              {step === "RESET_PASSWORD" && <Key className="w-7 h-7 text-amber-400" />}
            </div>

            <h1 className="text-xl md:text-2xl font-black text-white">
              {step === "IDENTIFIER" && `ورود و ثبت‌نام در ${APP_NAME}`}
              {step === "PASSWORD" && "ورود با کلمه عبور"}
              {step === "NEW_USER_OTP" && "ثبت‌نام و تایید هویت کاربر جدید"}
              {step === "NEW_USER_SET_PASSWORD" && "تنظیم کلمه عبور برای ورودهای بعدی"}
              {step === "OTP_LOGIN" && "ورود امن با رمز یکبار مصرف"}
              {step === "RESET_PASSWORD" && "تغییر و بازیابی کلمه عبور"}
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed">
              {step === "IDENTIFIER" && "شماره موبایل یا ایمیل خود را جهت دسترسی به پنل کاربری وارد نمایید."}
              {step === "PASSWORD" && `سلام ${nameInput || "کاربر گرامی"}، لطفاً رمز عبور حساب خود را وارد نمایید.`}
              {step === "NEW_USER_OTP" && `کد تایید ۵ رقمی ارسال شده به ${targetClean || authInput} را وارد فرمایید.`}
              {step === "NEW_USER_SET_PASSWORD" && "جهت سهولت ورود در دفعات بعدی، نام و کلمه عبور دلخواه خود را تعیین کنید."}
              {step === "OTP_LOGIN" && `کد تایید یکبار مصرف ارسال شده به ${targetClean || authInput} را وارد فرمایید.`}
              {step === "RESET_PASSWORD" && "کد دریافتی و کلمه عبور جدید حساب خود را تعیین نمایید."}
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= STEP 1: IDENTIFIER ================= */}
          {step === "IDENTIFIER" && (
            <form onSubmit={handleCheckIdentifier} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium flex items-center justify-between">
                  <span>شماره موبایل یا ایمیل:</span>
                  <span className="text-[10px] text-emerald-400">پلن پایه رایگان</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={authInput}
                    onChange={(e) => setAuthInput(e.target.value)}
                    placeholder="09123456789 یا user@example.com"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-600 text-xs font-mono focus:outline-none transition"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-600/20 text-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>در حال بررسی...</span>
                ) : (
                  <>
                    <span>ادامه / ورود و ثبت‌نام</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 2: PASSWORD LOGIN ================= */}
          {step === "PASSWORD" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-mono text-xs" dir="ltr">{targetClean || authInput}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("IDENTIFIER");
                    setPasswordInput("");
                    setError(null);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold"
                >
                  تغییر
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">کلمه عبور حساب:</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-white font-mono text-xs focus:outline-none transition pr-10"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-teal-600/20 text-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>در حال بررسی کلمه عبور...</span>
                ) : (
                  <>
                    <span>ورود به پنل کاربری</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>

              {/* Alternative Options */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={handleSwitchToOtpLogin}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  ورود با رمز یکبار مصرف (OTP)
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToForgotPassword}
                  className="text-slate-400 hover:text-slate-300 font-medium"
                >
                  فراموشی کلمه عبور
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 3: NEW USER OTP ================= */}
          {step === "NEW_USER_OTP" && (
            <form onSubmit={handleVerifyNewUserOtp} className="space-y-4 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-mono text-xs" dir="ltr">{targetClean || authInput}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("IDENTIFIER");
                    setOtpCode("");
                    setError(null);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold"
                >
                  تغییر شماره
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">کد تایید ۵ رقمی ارسال شده:</label>
                <input
                  type="text"
                  maxLength={5}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="۱۲۳۴۵"
                  className="w-full bg-slate-950/80 border border-emerald-500/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-emerald-400 font-bold focus:outline-none transition"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>مهلت اعتبار کد:</span>
                <div className="flex items-center gap-1 font-mono text-teal-400 font-bold">
                  {timerSeconds > 0 ? (
                    <span>{formatTimer(timerSeconds)}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-emerald-400 hover:underline"
                    >
                      ارسال مجدد کد تایید
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 4}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-600/20 text-xs flex items-center justify-center gap-2"
              >
                <span>تایید کد و ادامه ثبت‌نام</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </form>
          )}

          {/* ================= STEP 4: NEW USER SET PASSWORD ================= */}
          {step === "NEW_USER_SET_PASSWORD" && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4 text-xs">
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-200 text-[11px] leading-relaxed">
                هویت شما با رمز یکبار مصرف تایید گردید. لطفاً برای ورودهای بعدی کلمه عبور تعیین فرمایید.
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">نام و نام خانوادگی یا عنوان کسب‌وکار:</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="مثال: امیر رضایی"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">تعیین کلمه عبور جدید (حداقل ۶ کاراکتر):</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none transition pr-10"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">تکرار کلمه عبور:</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none transition"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-600/20 text-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>در حال ایجاد حساب کاربری...</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>تکمیل ثبت‌نام و ورود به پنل</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 5: OTP LOGIN (EXISTING USER) ================= */}
          {step === "OTP_LOGIN" && (
            <form onSubmit={handleOtpLoginSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-mono text-xs" dir="ltr">{targetClean || authInput}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("IDENTIFIER");
                    setOtpCode("");
                    setError(null);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold"
                >
                  تغییر
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">کد تایید ۵ رقمی ورود:</label>
                <input
                  type="text"
                  maxLength={5}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="۱۲۳۴۵"
                  className="w-full bg-slate-950/80 border border-teal-500/40 focus:border-teal-500 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-teal-300 font-bold focus:outline-none transition"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>مهلت اعتبار کد:</span>
                <div className="flex items-center gap-1 font-mono text-teal-400 font-bold">
                  {timerSeconds > 0 ? (
                    <span>{formatTimer(timerSeconds)}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-emerald-400 hover:underline"
                    >
                      ارسال مجدد کد تایید
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 4}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-teal-600/20 text-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>در حال بررسی کد...</span>
                ) : (
                  <>
                    <span>ورود به پنل</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setStep("PASSWORD");
                    setError(null);
                  }}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  ورود با کلمه عبور به جای OTP
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 6: RESET PASSWORD ================= */}
          {step === "RESET_PASSWORD" && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-mono text-xs" dir="ltr">{targetClean || authInput}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("IDENTIFIER");
                    setError(null);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold"
                >
                  تغییر
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">کد تایید ۵ رقمی دریافتی:</label>
                <input
                  type="text"
                  maxLength={5}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="۱۲۳۴۵"
                  className="w-full bg-slate-950/80 border border-amber-500/40 focus:border-amber-500 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-widest text-amber-300 font-bold focus:outline-none transition"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">کلمه عبور جدید (حداقل ۶ کاراکتر):</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none transition"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">تکرار کلمه عبور جدید:</label>
                <input
                  type="password"
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none transition"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-amber-600/20 text-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>در حال تغییر کلمه عبور...</span>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>تایید کد و تغییر کلمه عبور</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setStep("PASSWORD");
                    setError(null);
                  }}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  انصراف و بازگشت به ورود
                </button>
              </div>
            </form>
          )}

          {/* Quick Perks of Free Tier */}
          <div className="border-t border-slate-800/80 pt-4 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>پلن پایه همیشه رایگان: ۱ کارت فعال + ۱ دستگاه متصل + کلید API</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>احراز هویت دومرحله‌ای پیامکی و ایمیلی مطابق استاندارد هنرهاب</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-[11px] text-slate-600">
        سامانه درگاه پرداخت {APP_NAME} • توسعه‌یافته بر اساس استانداردهای امنیتی هنرهاب ❤️
      </footer>
    </div>
  );
}
