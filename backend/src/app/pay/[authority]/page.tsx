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
} from "lucide-react";
import { toPersianDigits, formatPersianNumber } from "@/lib/persian-utils";

export const dynamic = "force-dynamic";

interface PaymentDetails {
  authority: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "MISMATCHED" | "MANUALLY_VERIFIED";
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
    bankTitle: string;
  };
}

function CheckoutContent({ authority }: { authority: string }) {
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  // Fetch status
  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/v1/payment/status/${authority}`);
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "تراکنش مورد نظر یافت نشد یا معتبر نیست.");
        return;
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

  // Auto redirect on success
  useEffect(() => {
    if (details?.status === "PAID" || details?.status === "MANUALLY_VERIFIED") {
      const timeout = setTimeout(() => {
        if (details.callbackUrl) {
          const url = new URL(details.callbackUrl);
          url.searchParams.set("authority", authority);
          url.searchParams.set("status", "success");
          url.searchParams.set("tracking_code", details.trackingCode || "");
          window.location.href = url.toString();
        }
      }, 3500);
      return () => clearTimeout(timeout);
    }
  }, [details, authority]);

  const copyToClipboard = (text: string, type: "card" | "amount") => {
    navigator.clipboard.writeText(text);
    if (type === "card") {
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2000);
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

  // Simulate deposit directly for testing
  const handleSimulatePayment = async () => {
    if (!details) return;
    setIsSimulating(true);
    setSimResult(null);

    try {
      const accountNum = details.card.accountNumber || "111122223333444455";
      const sampleText = `${accountNum}
${details.payableAmountRial.toLocaleString()}+
1405/8/16-15:46
مانده:2,500,000`;

      const res = await fetch("/api/v1/test/simulate-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": "super-secret-admin-key-change-me",
        },
        body: JSON.stringify({
          sender: "B.QMEHRIRAN",
          rawText: sampleText,
        }),
      });

      const data = await res.json();
      if (data.success && data.data.matched) {
        setSimResult("✅ پیامک شبیه‌سازی شد و تراکنش آنی تایید گردید!");
        fetchStatus();
      } else {
        setSimResult("پیامک ثبت شد ولی تطبیق نیافت: " + (data.data?.reason || data.error));
      }
    } catch (e: any) {
      setSimResult("خطا در ارسال پیامک شبیه‌ساز: " + e.message);
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
                <span>کد پیگیری بانکی:</span>
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
              <span>در حال انتقال خودکار به وب‌سایت مقصد...</span>
            </div>
            <a
              href={details.callbackUrl}
              className="inline-flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-3.5 rounded-2xl transition shadow-lg shadow-emerald-600/25"
            >
              <span>بازگشت فوری به فروشگاه</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. Expired State
  if (details.status === "EXPIRED" || secondsLeft <= 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-amber-300">مهلت {toPersianDigits(10)} دقیقه‌ای به پایان رسید</h1>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              جهت حفظ امنیت و تخصیص دقیق مبالغ، لینک‌های پرداخت {toPersianDigits(10)} دقیقه اعتبار دارند. در صورتی که وجهی واریز نکرده‌اید لطفاً مجدداً از سبد خرید اقدام فرمایید.
            </p>
          </div>
          <a
            href={details.callbackUrl}
            className="inline-flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium py-3 rounded-xl transition"
          >
            <span>بازگشت به سایت مبدا</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // 3. Active Checkout State
  const timerPercentage = Math.max(0, Math.min(100, (secondsLeft / 600) * 100));

  // Extract clean 4-digit groups of card number
  const cardChunks = details.card.cardNumber.replace(/[^0-9]/g, "").match(/.{1,4}/g) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      <div className="max-w-md w-full space-y-4 my-6">

        {/* Header Security Badge */}
        <div className="flex items-center justify-between px-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <Lock className="w-3.5 h-3.5" />
            <span>درگاه مستقیم و رمزنگاری‌شده کارت‌به‌کارت</span>
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

          {/* Realistic Persian Bank Debit Card */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400">کارت بانکی مقصد:</span>

            <div className="relative overflow-hidden bg-gradient-to-tr from-slate-950 via-slate-800 to-slate-900 border border-slate-700/90 rounded-3xl p-5 shadow-xl space-y-4 text-white">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>

              {/* Card Header */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  <span className="text-sm font-bold tracking-wide text-slate-100">{details.card.bankTitle}</span>
                </div>
                <Wifi className="w-5 h-5 text-slate-400 rotate-90" />
              </div>

              {/* EMV Chip */}
              <div className="w-11 h-8 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 rounded-md border border-amber-500/60 shadow-sm flex items-center justify-center">
                <div className="w-7 h-5 border border-amber-800/40 rounded-sm"></div>
              </div>

              {/* Card Number - Right Aligned with accurate Persian Digits and LTR block progression */}
              <div className="space-y-1 relative z-10">
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
        </div>

        {/* Sandbox & Interactive Simulator Drawer */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2 text-center">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <Play className="w-3.5 h-3.5" />
              لابراتوار تست و ارزیابی درگاه (Sandbox):
            </span>
            <button
              onClick={handleSimulatePayment}
              disabled={isSimulating}
              className="bg-emerald-600/90 hover:bg-emerald-600 disabled:opacity-50 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
            >
              {isSimulating ? <RotateCcw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              <span>شبیه‌سازی خودکار واریز این تراکنش</span>
            </button>
          </div>
          {simResult && (
            <p className="text-[11px] text-emerald-300 font-medium bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-2 mt-2">
              {simResult}
            </p>
          )}
        </div>

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
