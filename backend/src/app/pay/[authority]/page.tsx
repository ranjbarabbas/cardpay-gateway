"use client";

import { useEffect, useState, use, Suspense } from "react";
import {
  Copy,
  Check,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Wifi,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Lock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toPersianDigits, formatPersianNumber } from "@/lib/persian-utils";

export const dynamic = "force-dynamic";

interface PaymentDetails {
  authority: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "MISMATCHED" | "MANUALLY_VERIFIED" | "CANCELLED";
  transferType?: "CARD_TO_CARD" | "POL";
  remainingSeconds: number;
  originalAmountToman: number;
  offsetToman: number;
  payableAmountToman: number;
  payableAmountRial: number;
  expiresAt: string;
  callbackUrl: string;
  trackingCode?: string;
  card: {
    ownerName: string;
    cardNumber: string;
    accountNumber?: string;
    iban?: string;
    bankTitle: string;
    bankSlug?: string;
    bankLogo?: string;
    transferType?: "CARD_TO_CARD" | "POL";
  };
}

function CheckoutContent({ authority }: { authority: string }) {
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(10);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState(5);
  const [expiredCountdown, setExpiredCountdown] = useState(8);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [isSandbox, setIsSandbox] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      setIsLocalhost(
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.endsWith(".local") ||
        host.startsWith("192.168.") ||
        host.startsWith("10.") ||
        host === "[::1]"
      );

      const params = new URLSearchParams(window.location.search);
      if (
        params.get("sandbox") === "true" ||
        authority.startsWith("hp_sandbox_") ||
        authority.includes("sandbox")
      ) {
        setIsSandbox(true);
      }
    }
  }, [authority]);

  // Fetch status
  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/v1/payment/status/${authority}`);
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "تراکنش مورد نظر یافت نشد یا معتبر نیست.");
        return;
      }
      if (data.isSandbox || authority.startsWith("hp_sandbox_") || authority.includes("sandbox")) {
        setIsSandbox(true);
      }
      setDetails(data.data);
      setSecondsLeft(data.data.remainingSeconds);
    } catch {
      setError("خطا در برقراری ارتباط با سرور درگاه پرداخت");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, [authority]);

  // Local 1-second countdown ticker
  useEffect(() => {
    if (secondsLeft <= 0 || details?.status !== "PENDING") return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, details?.status]);

  // Auto redirect on success with 10-second countdown
  useEffect(() => {
    if (details?.status === "PAID" || details?.status === "MANUALLY_VERIFIED") {
      setRedirectCountdown(10);
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (details.callbackUrl) {
              try {
                const url = new URL(details.callbackUrl);
                url.searchParams.set("authority", authority);
                url.searchParams.set("status", "success");
                url.searchParams.set("Status", "OK");
                url.searchParams.set("tracking_code", details.trackingCode || "");
                window.location.href = url.toString();
              } catch {
                window.location.href = details.callbackUrl;
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [details?.status, details?.callbackUrl, authority]);

  // Auto redirect on user cancellation with 5-second countdown
  useEffect(() => {
    if (details?.status === "CANCELLED" && details.callbackUrl) {
      setCancelCountdown(5);
      const timer = setInterval(() => {
        setCancelCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            try {
              const url = new URL(details.callbackUrl);
              url.searchParams.set("authority", authority);
              url.searchParams.set("status", "cancelled");
              url.searchParams.set("Status", "NOK");
              url.searchParams.set("error", "user_cancelled");
              window.location.href = url.toString();
            } catch {
              window.location.href = details.callbackUrl;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [details?.status, details?.callbackUrl, authority]);

  // Auto redirect on expired with 8-second countdown
  useEffect(() => {
    const isExpired = details?.status === "EXPIRED" || (details && secondsLeft <= 0);
    if (isExpired && details?.callbackUrl) {
      setExpiredCountdown(8);
      const timer = setInterval(() => {
        setExpiredCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            try {
              const url = new URL(details.callbackUrl);
              url.searchParams.set("authority", authority);
              url.searchParams.set("status", "failed");
              url.searchParams.set("Status", "NOK");
              url.searchParams.set("error", "expired");
              url.searchParams.set("message", "payment_expired");
              if (details.trackingCode) {
                url.searchParams.set("tracking_code", details.trackingCode);
              }
              window.location.href = url.toString();
            } catch {
              window.location.href = details.callbackUrl;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [details?.status, details?.callbackUrl, authority, secondsLeft]);

  const handleCancelPayment = async () => {
    if (isCancelling || !details) return;
    const confirmCancel = window.confirm("آیا از انصراف و لغو پرداخت اطمینان دارید؟");
    if (!confirmCancel) return;

    setIsCancelling(true);
    try {
      await fetch(`/api/v1/payment/cancel/${authority}`, {
        method: "POST",
      });
    } catch {
      // Continue to local cancelled state
    }

    setDetails((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
  };

  const copyToClipboard = (text: string, type: "card" | "amount" | "iban") => {
    navigator.clipboard.writeText(text);
    if (type === "card") {
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2000);
    } else if (type === "iban") {
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const formatted = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return toPersianDigits(formatted);
  };

  // Simulate deposit directly for testing / sandbox / localhost
  const handleSimulatePayment = async () => {
    if (!details) return;
    setIsSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch("/api/v1/payment/simulate-sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authority, action: "PAID" }),
      });

      const data = await res.json();
      if (data.success) {
        setSimResult({
          type: "success",
          text: "✅ واریز با موفقیت شبیه‌سازی شد! وضعیت تراکنش به تاییدشده (PAID) تغییر یافت.",
        });
        fetchStatus();
      } else {
        setSimResult({
          type: "error",
          text: "خطا در شبیه‌سازی واریز: " + (data.error || data.message || "خطای نامشخص"),
        });
      }
    } catch (e: any) {
      setSimResult({
        type: "error",
        text: "خطا در برقراری ارتباط با شبیه‌ساز: " + e.message,
      });
    } finally {
      setIsSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping"></div>
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400 text-sm font-medium">در حال اتصال امن به شبکه پرداخت کارت‌به‌کارت...</p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-200">تراکنش نامعتبر است</h2>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">{error}</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium py-3 rounded-xl transition"
          >
            <span>بازگشت به صفحه اصلی</span>
          </a>
        </div>
      </div>
    );
  }

  // 1. Paid State
  if (details.status === "PAID" || details.status === "MANUALLY_VERIFIED") {
    const successCallbackUrl = (() => {
      try {
        const url = new URL(details.callbackUrl);
        url.searchParams.set("authority", authority);
        url.searchParams.set("status", "success");
        url.searchParams.set("Status", "OK");
        url.searchParams.set("tracking_code", details.trackingCode || "");
        return url.toString();
      } catch {
        return details.callbackUrl;
      }
    })();

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-emerald-500/40 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl shadow-emerald-500/10 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-600 to-teal-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 relative">
              <Check className="w-12 h-12 stroke-[3]" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black text-white">واریز شما با موفقیت تایید شد</h1>
            <p className="text-emerald-400 text-xs mt-1 font-medium">سیستم بانکی رسید واریز را دریافت و ثبت نمود.</p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2.5 text-right">
            <div className="flex justify-between items-center text-slate-400">
              <span>شناسه ارجاع پرداخت:</span>
              <span className="font-mono text-slate-200 font-bold">{details.authority}</span>
            </div>
            {details.trackingCode && (
              <div className="flex justify-between items-center text-slate-400">
                <span>کد پیگیری سامانه:</span>
                <span className="font-mono text-emerald-400 font-bold">{toPersianDigits(details.trackingCode)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-400 border-t border-slate-800/80 pt-2">
              <span>مبلغ تایید شده:</span>
              <span className="font-black text-white text-sm">{formatPersianNumber(details.payableAmountToman)} تومان</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>
                در حال انتقال خودکار به وب‌سایت مقصد تا{" "}
                <span className="font-mono font-bold text-emerald-400 px-1 text-sm">
                  {toPersianDigits(redirectCountdown)}
                </span>{" "}
                ثانیه دیگر...
              </span>
            </div>
            <a
              href={successCallbackUrl}
              className="inline-flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-3.5 rounded-2xl transition shadow-lg shadow-emerald-600/25"
            >
              <span>بازگشت فوری به وب‌سایت مقصد</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. Cancelled State
  if (details.status === "CANCELLED") {
    const cancelCallbackUrl = (() => {
      try {
        const url = new URL(details.callbackUrl);
        url.searchParams.set("authority", authority);
        url.searchParams.set("status", "cancelled");
        url.searchParams.set("Status", "NOK");
        url.searchParams.set("error", "user_cancelled");
        return url.toString();
      } catch {
        return details.callbackUrl;
      }
    })();

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
            <XCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-rose-400">پرداخت توسط شما لغو گردید</h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              عملیات پرداخت لغو شد و هیچ‌گونه وجهی از حساب شما کسر نگردید.
            </p>
          </div>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>خطا: انصراف و لغو پرداخت توسط کاربر</span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              <span>
                در حال انتقال خودکار به وب‌سایت مقصد تا{" "}
                <span className="font-mono font-bold text-rose-400 px-1 text-sm">
                  {toPersianDigits(cancelCountdown)}
                </span>{" "}
                ثانیه دیگر...
              </span>
            </div>

            <a
              href={cancelCallbackUrl}
              className="inline-flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold py-3.5 rounded-2xl transition border border-slate-700 shadow-md"
            >
              <span>بازگشت فوری به وب‌سایت مقصد</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Expired State
  if (details.status === "EXPIRED" || secondsLeft <= 0) {
    const expiredCallbackUrl = (() => {
      try {
        const url = new URL(details.callbackUrl);
        url.searchParams.set("authority", authority);
        url.searchParams.set("status", "failed");
        url.searchParams.set("Status", "NOK");
        url.searchParams.set("error", "expired");
        url.searchParams.set("message", "payment_expired");
        if (details.trackingCode) {
          url.searchParams.set("tracking_code", details.trackingCode);
        }
        return url.toString();
      } catch {
        return details.callbackUrl;
      }
    })();

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Clock className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-amber-300">مهلت {toPersianDigits(10)} دقیقه‌ای به پایان رسید</h1>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              جهت حفظ امنیت و تخصیص دقیق مبالغ، لینک‌های پرداخت {toPersianDigits(10)} دقیقه اعتبار دارند. در صورتی که وجهی واریز نکرده‌اید لطفاً مجدداً از وب‌سایت مبدا اقدام فرمایید.
            </p>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>وضعیت: فاکتور منقضی‌شده (عدم واریز در مهلت مقرر)</span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span>
                در حال انتقال خودکار به وب‌سایت مقصد تا{" "}
                <span className="font-mono font-bold text-amber-400 px-1 text-sm">
                  {toPersianDigits(expiredCountdown)}
                </span>{" "}
                ثانیه دیگر...
              </span>
            </div>

            <a
              href={expiredCallbackUrl}
              className="inline-flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium py-3.5 rounded-2xl transition border border-slate-700 shadow-md"
            >
              <span>بازگشت فوری به وب‌سایت مقصد</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Checkout State
  const timerPercentage = Math.max(0, Math.min(100, (secondsLeft / 600) * 100));
  const isPol =
    details.transferType === "POL" ||
    details.card.transferType === "POL";

  // Extract clean 4-digit groups of card number
  const cardChunks = details.card.cardNumber ? (details.card.cardNumber.replace(/[^0-9]/g, "").match(/.{1,4}/g) || []) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      <div className="max-w-md w-full space-y-4 my-6">

        {/* Sandbox Warning Banner */}
        {isSandbox && (
          <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-3xl p-4 text-center space-y-2 shadow-xl shadow-amber-500/10">
            <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>محیط تست و سندباکس درگاه پرداخت (Sandbox Test Mode)</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed font-normal">
              این صفحه به صورت آزمایشی ایجاد گردیده است. هیچ‌گونه تراکنش مالی واقعی انجام نمی‌شود و نیازی به واریز وجه واقعی نیست. برای ارزیابی فرآیند پرداخت و بازگشت به سایت شما، از پنل شبیه‌ساز پایین صفحه استفاده فرمایید.
            </p>
          </div>
        )}

        {/* Header Security Badge */}
        <div className="flex items-center justify-between px-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <Lock className="w-3.5 h-3.5" />
            <span>{isPol ? "درگاه انتقال لحظه‌ای سامانه پل (شبا)" : "درگاه مستقیم و رمزنگاری‌شده کارت‌به‌کارت"}</span>
          </div>
          <span className="font-mono text-slate-500 text-[11px]">{details.authority}</span>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 shadow-2xl shadow-black/60 space-y-6">

          {/* Countdown Timer Bar */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className={`w-3.5 h-3.5 ${secondsLeft < 120 ? "text-red-400 animate-spin" : "text-emerald-400"}`} />
                زمان باقی‌مانده جهت واریز:
              </span>
              <span className={`font-mono text-base font-black ${secondsLeft < 120 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
                {formatTime(secondsLeft)}
              </span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 rounded-full ${
                  secondsLeft < 120 ? "bg-red-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"
                }`}
                style={{ width: `${timerPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/50 via-slate-950 to-teal-950/40 border border-emerald-500/30 rounded-3xl p-5 text-center space-y-2.5 shadow-inner">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3" />
              <span>مبلغ دقیق پرداختی با شناسه یکتا</span>
              {details.offsetToman > 0 && (
                <span className="bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-mono text-[10px]">
                  +{toPersianDigits(details.offsetToman)} ت
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black text-white tracking-tight">
                {formatPersianNumber(details.payableAmountToman)}
              </span>
              <span className="text-sm font-bold text-emerald-400">تومان</span>

              {/* Copy Rial Amount Button directly beside the amount */}
              <button
                onClick={() => copyToClipboard(details.payableAmountRial.toString(), "amount")}
                className="p-1.5 bg-emerald-900/40 hover:bg-emerald-800/70 border border-emerald-700/50 text-emerald-300 hover:text-white rounded-xl transition duration-200 shadow-sm mr-1"
                title="کپی مبلغ دقیق به ریال"
              >
                {copiedAmount ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-xs text-slate-400">
              معادل <strong className="text-slate-200 font-bold">{formatPersianNumber(details.payableAmountRial)}</strong> ریال
            </div>

            {copiedAmount && (
              <p className="text-[11px] text-emerald-400 font-medium animate-in fade-in duration-150">
                مبلغ به ریال ({formatPersianNumber(details.payableAmountRial)} ریال) کپی گردید
              </p>
            )}
          </div>

          {/* Critical Warning Callout - RED Alert as requested */}
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 flex gap-3 text-xs text-rose-200/90 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>
              <strong>توجه بسیار مهم:</strong> لطفاً <u>دقیقاً مبلغ فوق</u> را واریز نمایید. هرگونه تغییر در مبلغ مانع از تایید اتوماتیک پرداخت توسط سامانه هوشمند پیامکی خواهد شد.
            </p>
          </div>

          {/* Destination: POL (Sheba) or Card-to-Card */}
          {isPol ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">انتقال پل به شماره شبا:</span>
                <span className="text-[11px] bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full font-medium">
                  سامانه پل (پرداخت لحظه‌ای)
                </span>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-tr from-slate-950 via-slate-900 to-sky-950/70 border border-sky-500/40 rounded-3xl p-5 shadow-xl space-y-4 text-white">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl"></div>

                {/* Header with Bank Logo and Title */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2.5">
                    {details.card.bankLogo && (
                      <img
                        src={details.card.bankLogo}
                        alt={details.card.bankTitle}
                        className="w-7 h-7 object-contain bg-white/10 rounded-full p-0.5"
                      />
                    )}
                    <span className="text-sm font-bold tracking-wide text-slate-100">
                      {details.card.bankTitle && !details.card.bankTitle.includes("عضو") && details.card.bankTitle !== "کارت عضو شبکه شتاب"
                        ? details.card.bankTitle
                        : "حساب بانکی (شبا)"}
                    </span>
                  </div>
                  <span className="text-[11px] text-sky-300 font-medium bg-sky-900/60 border border-sky-500/30 px-2.5 py-0.5 rounded-lg">
                    انتقال پل (شبا)
                  </span>
                </div>

                {/* Sheba (IBAN) Box */}
                <div className="space-y-1 relative z-10">
                  <div className="text-[11px] text-slate-400 font-medium">شماره شبا مقصد (IBAN):</div>
                  <div className="flex items-center justify-between bg-black/50 backdrop-blur-md border border-sky-500/30 rounded-2xl px-4 py-3">
                    <button
                      onClick={() => copyToClipboard(details.card.iban || "", "iban")}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition shrink-0"
                      title="کپی شماره شبا"
                    >
                      {copiedIban ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <div dir="ltr" className="text-base sm:text-lg font-mono font-bold tracking-wider text-sky-300 select-all">
                      {details.card.iban || "IR------------------------"}
                    </div>
                  </div>
                  {copiedIban && (
                    <p className="text-[11px] text-emerald-400 font-medium pt-1 text-center animate-in fade-in duration-150">
                      شماره شبا با موفقیت کپی گردید
                    </p>
                  )}
                </div>

                {/* Owner Name */}
                <div className="flex items-center justify-between text-xs text-slate-300 pt-1 relative z-10 border-t border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">صاحب حساب:</span>
                  <span className="font-semibold text-slate-100">{details.card.ownerName}</span>
                </div>

                {/* Instruction banner */}
                <div className="space-y-2">
                  <div className="p-3 bg-sky-950/60 border border-sky-500/30 rounded-2xl text-[11px] text-sky-200/90 leading-relaxed text-right">
                    💡 لطفاً با همراه بانک یا اینترنت بانک خود، <strong>انتقال پل</strong> را دقیقاً به مبلغ فوق به شماره شبا بالا انجام دهید.
                  </div>
                  <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-[11px] text-rose-300 font-bold leading-relaxed text-right flex items-center gap-1.5 shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>دقت نمایید پرداخت پایا یا ساتنا در سامانه بررسی نمی شود.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">کارت بانکی مقصد:</span>

              <div className="relative overflow-hidden bg-gradient-to-tr from-slate-950 via-slate-800 to-slate-900 border border-slate-700/90 rounded-3xl p-5 shadow-xl space-y-4 text-white">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>

                {/* Card Header */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2.5">
                    {details.card.bankLogo && (
                      <img
                        src={details.card.bankLogo}
                        alt={details.card.bankTitle}
                        className="w-7 h-7 object-contain bg-white/10 rounded-full p-0.5"
                      />
                    )}
                    <span className="text-sm font-bold tracking-wide text-slate-100">
                      {details.card.bankTitle && !details.card.bankTitle.includes("عضو") && details.card.bankTitle !== "کارت عضو شبکه شتاب"
                        ? details.card.bankTitle
                        : "کارت بانکی شتاب"}
                    </span>
                  </div>
                  <Wifi className="w-5 h-5 text-slate-400 rotate-90" />
                </div>

                {/* Card Number */}
                <div className="space-y-1 relative z-10">
                  <div className="text-[11px] text-slate-400 font-medium">شماره کارت مقصد:</div>
                  <div className="flex items-center justify-between bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3">
                    <button
                      onClick={() => copyToClipboard(details.card.cardNumber, "card")}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition shrink-0"
                      title="کپی شماره ۱۶ رقمی کارت"
                    >
                      {copiedCard ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>

                    {/* Render 4 groups from left-to-right in Persian digits with right alignment */}
                    <div dir="ltr" className="flex items-center gap-2 md:gap-3 text-base md:text-lg font-bold tracking-wider text-emerald-300 font-mono">
                      {cardChunks.map((chunk, idx) => (
                        <span key={idx} className="select-all">
                          {toPersianDigits(chunk)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Owner Name */}
                <div className="flex items-center justify-between text-xs text-slate-300 pt-1 relative z-10">
                  <span className="text-slate-400 text-[11px]">صاحب حساب:</span>
                  <span className="font-semibold text-slate-100">{details.card.ownerName}</span>
                </div>
              </div>
            </div>
          )}

          {/* Live Polling Status Indicator with confirmation note */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 text-xs text-slate-400 text-center">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
              <span>سیستم در انتظار دریافت تاییدیه واریز از بانک است...</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              بعد از پرداخت به صورت خودکار تراکنش تایید خواهد شد.
            </p>
          </div>

          {/* Cancel Payment Option */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleCancelPayment}
              disabled={isCancelling}
              className="w-full bg-slate-950/80 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 border border-slate-800 rounded-2xl py-3 text-xs font-semibold transition flex items-center justify-center gap-2 group"
            >
              <XCircle className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition" />
              <span>{isCancelling ? "در حال لغو پرداخت..." : "انصراف و لغو پرداخت"}</span>
            </button>
          </div>
        </div>

        {/* Sandbox & Interactive Simulator Drawer - Available in Sandbox or Localhost */}
        {(isLocalhost || isSandbox) && (
          <div className="bg-slate-900/90 border-2 border-emerald-500/30 rounded-3xl p-5 text-xs space-y-3 text-center shadow-xl shadow-emerald-500/5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>لابراتوار شبیه‌ساز تراکنش (Sandbox):</span>
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
                {isSandbox ? "سندباکس فعال" : "توسعه محلی"}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 text-right leading-relaxed">
              جهت ارزیابی رفتار وب‌سایت خود در زمان دریافت وضعیت‌های مختلف، یکی از گزینه‌های زیر را انتخاب نمایید:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                {isSimulating ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>شبیه‌سازی واریز موفق</span>
              </button>

              <button
                type="button"
                onClick={handleCancelPayment}
                disabled={isCancelling}
                className="bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/40 border border-slate-700 text-slate-300 font-semibold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>شبیه‌سازی انصراف</span>
              </button>
            </div>

            {simResult && (
              <div
                className={`text-xs font-medium rounded-xl p-3 text-right leading-relaxed animate-in fade-in flex items-center gap-2 ${
                  simResult.type === "success"
                    ? "text-emerald-300 bg-emerald-950/70 border border-emerald-500/40"
                    : "text-rose-300 bg-rose-950/70 border border-rose-500/40"
                }`}
              >
                {simResult.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{simResult.text}</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ authority: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <CheckoutContent authority={resolvedParams.authority} />
    </Suspense>
  );
}
