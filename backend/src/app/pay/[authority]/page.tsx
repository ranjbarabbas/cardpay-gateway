"use client";

import { useEffect, useState, use, Suspense } from "react";
import { Copy, Check, Clock, AlertTriangle, ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";

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

  // Fetch status
  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/v1/payment/status/${authority}`);
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "خطا در دریافت اطلاعات پرداخت");
        return;
      }
      setDetails(data.data);
      setSecondsLeft(data.data.remainingSeconds);
    } catch {
      setError("خطا در برقراری ارتباط با درگاه پرداخت");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 3 seconds for status updates
    const interval = setInterval(fetchStatus, 3000);
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
      }, 4000);
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

  const formatCardNumber = (num: string) => {
    return num.replace(/(\d{4})/g, "$1 ").trim();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-sm">در حال دریافت اطلاعات درگاه پرداخت...</p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-red-200">خطا در بارگذاری تراکنش</h2>
          <p className="text-slate-400 text-sm">{error || "تراکنش مورد نظر یافت نشد یا معتبر نیست."}</p>
        </div>
      </div>
    );
  }

  // 1. Success State
  if (details.status === "PAID" || details.status === "MANUALLY_VERIFIED") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl shadow-emerald-500/10">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-emerald-400">پرداخت با موفقیت انجام شد</h1>
            <p className="text-slate-400 text-sm mt-1">تراکنش شما توسط سامانه بانکی تایید شد.</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-sm space-y-2 text-right">
            <div className="flex justify-between items-center text-slate-400">
              <span>شناسه پرداخت:</span>
              <span className="font-mono text-slate-200">{details.authority}</span>
            </div>
            {details.trackingCode && (
              <div className="flex justify-between items-center text-slate-400">
                <span>شماره پیگیری:</span>
                <span className="font-mono text-emerald-400 font-bold">{details.trackingCode}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-400">
              <span>مبلغ پرداختی:</span>
              <span className="font-bold text-slate-100">{details.payableAmountToman.toLocaleString()} تومان</span>
            </div>
          </div>

          <p className="text-xs text-slate-500">در حال انتقال به وب‌سایت مقصد...</p>
          <a
            href={details.callbackUrl}
            className="inline-flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition"
          >
            <span>بازگشت به سایت</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // 2. Expired State
  if (details.status === "EXPIRED" || secondsLeft <= 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-amber-300">مهلت پرداخت به پایان رسید</h1>
            <p className="text-slate-400 text-sm mt-2">
              زمان ۱۰ دقیقه‌ای این لینک پرداخت منقضی شده است. اگر وجهی کسر نشده، لطفاً مجدداً از سایت اقدام فرمایید.
            </p>
          </div>
          <a
            href={details.callbackUrl}
            className="inline-flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-3 rounded-xl transition"
          >
            <span>بازگشت به فروشگاه</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // 3. Active Pending Payment State
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full space-y-4">
        {/* Header / Security Badge */}
        <div className="flex items-center justify-between px-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>درگاه مستقیم کارت به کارت امن</span>
          </div>
          <div className="font-mono text-slate-500">{details.authority}</div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          {/* Countdown Timer */}
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className={`w-4 h-4 ${secondsLeft < 120 ? "text-red-400 animate-pulse" : "text-emerald-400"}`} />
              <span>زمان باقی‌مانده:</span>
            </div>
            <div className={`font-mono text-lg font-bold ${secondsLeft < 120 ? "text-red-400" : "text-emerald-400"}`}>
              {formatTime(secondsLeft)}
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-2 relative overflow-hidden">
            <span className="text-xs font-medium text-emerald-400/90">مبلغ دقیق جهت واریز</span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black tracking-tight text-white">
                {details.payableAmountToman.toLocaleString()}
              </span>
              <span className="text-sm text-emerald-400 font-semibold">تومان</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              معادل {details.payableAmountRial.toLocaleString()} ریال
            </div>

            <button
              onClick={() => copyToClipboard(details.payableAmountToman.toString(), "amount")}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-700/50 transition"
            >
              {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAmount ? "مبلغ کپی شد" : "کپی مبلغ عددی"}</span>
            </button>
          </div>

          {/* Important Warning Alert */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>توجه بسیار مهم:</strong> لطفاً <u>دقیقاً همین مبلغ</u> را انتقال دهید (به علت تخصیص خودکار کد شناسا، کوچک‌ترین تغییر در مبلغ مانع تایید اتوماتیک پرداخت شما می‌شود).
            </p>
          </div>

          {/* Destination Bank Card */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400">اطلاعات حساب مقصد:</span>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-200">{details.card.bankTitle}</span>
                <span className="text-xs text-slate-400">{details.card.ownerName}</span>
              </div>

              {/* 16-Digit Card Number */}
              <div className="space-y-1">
                <div className="text-xs text-slate-400">شماره کارت:</div>
                <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3">
                  <span className="font-mono text-lg font-bold tracking-wider text-emerald-400 dir-ltr select-all">
                    {formatCardNumber(details.card.cardNumber)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(details.card.cardNumber, "card")}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    title="کپی شماره کارت"
                  >
                    {copiedCard ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live waiting indicator */}
          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
            <span>سیستم به صورت خودکار در انتظار واریز بانکی شماست...</span>
          </div>
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
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CheckoutContent authority={resolvedParams.authority} />
    </Suspense>
  );
}
