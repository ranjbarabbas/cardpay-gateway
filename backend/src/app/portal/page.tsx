"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Smartphone,
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Download,
  LogOut,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Send,
  Plus,
  HelpCircle,
  Clock,
  Layers,
} from "lucide-react";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export default function UserPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Card modal state
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardForm, setCardForm] = useState({
    ownerName: "",
    cardNumber: "",
    accountNumber: "",
    iban: "",
    bankTitle: "بانک قرض‌الحسنه مهر ایران",
  });
  const [cardLoading, setCardLoading] = useState(false);
  const [cardMsg, setCardMsg] = useState<string | null>(null);

  // Test payment state
  const [testAmount, setTestAmount] = useState("50000");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/v1/auth/user");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (json.success) {
        setUser(json.data);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = () => {
    document.cookie = "honarhub_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    localStorage.removeItem("honarhub_user");
    router.push("/login");
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardLoading(true);
    setCardMsg(null);
    try {
      const res = await fetch("/api/v1/user/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطا در ثبت کارت");
      }
      setShowCardModal(false);
      setCardForm({
        ownerName: "",
        cardNumber: "",
        accountNumber: "",
        iban: "",
        bankTitle: "بانک قرض‌الحسنه مهر ایران",
      });
      fetchUserData();
    } catch (err: any) {
      setCardMsg(err.message);
    } finally {
      setCardLoading(false);
    }
  };

  const handleCreateTestPayment = async () => {
    if (!user?.cards?.[0]) {
      alert("ابتدا یک کارت بانکی ثبت نمایید.");
      return;
    }
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/v1/payment/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": user.apiKey,
        },
        body: JSON.stringify({
          amount: parseInt(testAmount) || 50000,
          cartId: user.cards[0].id,
          callbackUrl: `${window.location.origin}/portal`,
          description: `تست پرداخت آزمایشی پرتال کاربری ${user.name || ""}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTestResult(json.data);
      } else {
        alert(json.error || "خطا در ایجاد پرداخت تستی");
      }
    } catch (e: any) {
      alert(e.message || "خطا در ارتباط با سرور");
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A0F] text-slate-200 flex items-center justify-center font-sans" dir="rtl">
        <div className="flex items-center gap-3 text-emerald-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>در حال بارگذاری پرتال کاربری...</span>
        </div>
      </div>
    );
  }

  const activeCard = user?.cards?.[0];
  const activeDevice = user?.devices?.[0];

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[20%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[130px]" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0B0F17]/80 backdrop-blur-md sticky top-0 z-40 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/images/honarhub_logo.png" alt="هنرهاب پی" className="w-9 h-9 rounded-xl shadow-lg shadow-emerald-500/10 object-cover" />
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white">{APP_NAME}</span>
                <span className="text-[10px] text-slate-400 font-medium">پرتال پذیرنده</span>
              </div>
            </Link>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                {user?.plan === "PREMIUM" ? "پلن پرمیوم (نامحدود)" : "پلن پایه (برای همیشه رایگان)"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/docs"
              className="hidden sm:flex items-center gap-1.5 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
            >
              <span>مستندات وب‌سرویس</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 transition font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome & Overview */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#111827] to-[#0F172A] border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black text-white">
                خوش‌آمدید، {user?.name || "پذیرنده گرامی"}
              </h1>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                {user?.phone || user?.email}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              این پرتال اختصاصی شما برای مدیریت کارت‌های بانکی، اپلیکیشن همگام‌ساز پیامک‌های واریزی و دریافت کلید امن وب‌سرویس درگاه جهت اتصال به وب‌سایت است.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-xs space-y-2 w-full md:w-auto min-w-[240px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>وضعیت حساب:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                فعال و متصل
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>سهمیه کارت و دستگاه:</span>
              <span className="text-slate-200 font-bold">
                {user?.cards?.length || 0} / ۱ مجاز (پلن رایگان)
              </span>
            </div>
          </div>
        </div>

        {/* 3-Step Visual Onboarding Guide */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>مراحل ساده راه‌اندازی و استفاده از سامانه</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className={`p-5 rounded-2xl border transition space-y-2.5 ${
              activeCard ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-100" : "bg-slate-900/60 border-slate-800 text-slate-300"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold bg-slate-800/80 px-2 py-0.5 rounded-md text-emerald-400">
                  گام ۱
                </span>
                {activeCard ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <h3 className="font-bold text-sm text-white">۱. ثبت کارت بانکی</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                شماره کارت و حساب بانکی شخصی خود را ثبت نمایید تا واریزی‌های خریداران مستقیم به این کارت هدایت شود.
              </p>
            </div>

            {/* Step 2 */}
            <div className={`p-5 rounded-2xl border transition space-y-2.5 ${
              activeDevice?.lastSeenAt ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-100" : "bg-slate-900/60 border-slate-800 text-slate-300"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold bg-slate-800/80 px-2 py-0.5 rounded-md text-teal-400">
                  گام ۲
                </span>
                {activeDevice?.lastSeenAt ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Smartphone className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <h3 className="font-bold text-sm text-white">۲. نصب اپلیکیشن همراه</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                اپلیکیشن اندروید CardPay Sync را دانلود کرده و کلید دستگاه را وارد کنید تا پیامک‌های واریزی در لحظه خوانده شوند.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl border bg-slate-900/60 border-slate-800 text-slate-300 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold bg-slate-800/80 px-2 py-0.5 rounded-md text-amber-400">
                  گام ۳
                </span>
                <Key className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="font-bold text-sm text-white">۳. دریافت کلید و تست درگاه</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                کلید وب‌سرویس (x-api-key) را در سایت یا ربات خود قرار داده یا یک فاکتور پرداخت آزمایشی ایجاد و تست کنید.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Active Bank Card & Action */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">کارت بانکی فعال پذیرنده</h2>
              </div>

              <button
                onClick={() => setShowCardModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-2 rounded-xl transition"
              >
                {activeCard ? "ویرایش و تغییر کارت" : "ثبت کارت جدید"}
              </button>
            </div>

            {activeCard ? (
              <div className="relative overflow-hidden bg-gradient-to-tr from-slate-900 via-[#132035] to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-emerald-400">{activeCard.bankTitle}</span>
                  <span className="font-mono text-[11px] bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                    ID: {activeCard.id.slice(0, 8)}...
                  </span>
                </div>

                <div className="pt-2 text-center" dir="ltr">
                  <span className="text-xl md:text-2xl font-mono font-bold tracking-widest text-white drop-shadow">
                    {activeCard.cardNumber.replace(/(\d{4})/g, "$1 ").trim()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block">صاحب کارت:</span>
                    <span className="font-bold">{activeCard.ownerName}</span>
                  </div>
                  {activeCard.accountNumber && (
                    <div className="text-left font-mono">
                      <span className="text-[10px] text-slate-400 block">شماره حساب:</span>
                      <span>{activeCard.accountNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">هنوز کارت بانکی برای این حساب کاربری ثبت نشده است.</p>
                <button
                  onClick={() => setShowCardModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-600/20"
                >
                  ثبت کارت بانکی پذیرنده
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Android Companion Device */}
          <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">اپلیکیشن اندروید</h2>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                این اپلیکیشن پیامک‌های واریز بانک مهر ایران یا سایر بانک‌ها را به صورت خودکار خوانده و سفارش را تسویه می‌کند.
              </p>

              <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>کلید اختصاصی دستگاه:</span>
                  <button
                    onClick={() => handleCopy(activeDevice?.apiKey || user?.apiKey, "device-key")}
                    className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    {copiedId === "device-key" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>کپی</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] text-emerald-300 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 overflow-x-auto text-left" dir="ltr">
                  {activeDevice?.apiKey || user?.apiKey}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="/api/v1/download/apk"
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-2.5 rounded-xl transition"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>دانلود مستقیم APK همگام‌ساز</span>
              </a>
            </div>
          </div>
        </div>

        {/* Section 3: API Key & Live Test Payment */}
        <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">کلید وب‌سرویس اختصاصی شما (x-api-key)</h2>
                <p className="text-xs text-slate-400">
                  این کلید را در هدر تمام درخواست‌های وب‌سایت هنری یا فروشگاه خود ارسال فرمایید.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleCopy(user.apiKey, "api-key")}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 px-4 py-2 rounded-xl transition font-medium"
            >
              {copiedId === "api-key" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>کپی کلید API</span>
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-emerald-300 text-left overflow-x-auto" dir="ltr">
            {user.apiKey}
          </div>

          {/* Test Payment Trigger */}
          <div className="border-t border-slate-800/80 pt-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span>ایجاد فاکتور آزمایشی و تست زنده صفحه پرداخت</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  placeholder="مبلغ به تومان"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
                <span className="absolute left-3 top-3 text-[10px] text-slate-500">تومان</span>
              </div>

              <button
                onClick={handleCreateTestPayment}
                disabled={testLoading}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {testLoading ? (
                  <span>در حال ایجاد پرداخت تستی...</span>
                ) : (
                  <>
                    <span>ایجاد لینک پرداخت تستی</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-5 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">لینک پرداخت اختصاصی تولید گردید:</span>
                  <span className="font-mono text-slate-400">شناسه: {testResult.authority}</span>
                </div>
                <div className="flex items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="font-mono text-xs text-emerald-300 truncate" dir="ltr">
                    {testResult.paymentUrl}
                  </span>
                  <a
                    href={testResult.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shrink-0"
                  >
                    <span>مشاهده صفحه پرداخت</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Recent Transactions */}
        <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>آخرین تراکنش‌های ثبت‌شده</span>
            </h2>
            <span className="text-xs text-slate-500">۱۰ تراکنش اخیر</span>
          </div>

          {user?.transactions?.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              هنوز تراکنشی برای حساب شما ثبت نشده است. با ساخت لینک تستی بالا می‌توانید اولین تراکنش را ایجاد نمایید.
            </div>
          ) : (
            <div className="border border-slate-800 rounded-2xl overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">کد رهگیری شمسی</th>
                    <th className="p-3.5">مبلغ واریزی</th>
                    <th className="p-3.5">وضعیت</th>
                    <th className="p-3.5">تاریخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {user?.transactions?.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-3.5 text-slate-300">{tx.internalTrackingCode || tx.authority}</td>
                      <td className="p-3.5 text-emerald-400 font-bold">
                        {tx.finalAmountToman.toLocaleString()} تومان
                      </td>
                      <td className="p-3.5 font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === "PAID"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}>
                          {tx.status === "PAID" ? "پرداخت موفق" : "در انتظار واریز"}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 font-sans">
                        {new Date(tx.createdAt).toLocaleDateString("fa-IR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Card Registration / Edit Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>ثبت یا جایگزینی کارت بانکی</span>
              </h3>
              <button
                onClick={() => setShowCardModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {cardMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs text-center">
                {cardMsg}
              </div>
            )}

            <form onSubmit={handleSaveCard} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">نام و نام‌خانوادگی صاحب حساب:</label>
                <input
                  type="text"
                  required
                  value={cardForm.ownerName}
                  onChange={(e) => setCardForm({ ...cardForm, ownerName: e.target.value })}
                  placeholder="مثال: عباس رنجبر"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">شماره ۱۶ رقمی کارت بانکی:</label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={cardForm.cardNumber}
                  onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value.replace(/[^0-9]/g, "") })}
                  placeholder="6037991987654321"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">شماره حساب واریزی (جهت تطبیق با پیامک):</label>
                <input
                  type="text"
                  value={cardForm.accountNumber}
                  onChange={(e) => setCardForm({ ...cardForm, accountNumber: e.target.value })}
                  placeholder="مثال: 987654321012345678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">عنوان نمایشی بانک:</label>
                <input
                  type="text"
                  value={cardForm.bankTitle}
                  onChange={(e) => setCardForm({ ...cardForm, bankTitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-xl text-[11px] leading-relaxed">
                در پلن رایگان، حداکثر ۱ کارت فعال مجاز است. در صورت ثبت کارت جدید، کارت قبلی شما به صورت خودکار بدون حذف سوابق تراکنش‌ها بایگانی می‌گردد.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCardModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={cardLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20"
                >
                  {cardLoading ? "در حال ثبت..." : "ذخیره و فعال‌سازی کارت"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
