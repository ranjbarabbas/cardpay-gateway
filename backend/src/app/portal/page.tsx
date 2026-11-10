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
  Star,
  Zap,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { APP_NAME, WEB_APP_VERSION, ANDROID_APK_VERSION } from "@/lib/version";
import { toPersianDigits, formatPersianNumber } from "@/lib/persian-utils";

export default function UserPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const TX_PER_PAGE = 10;

  // Card modal state
  const [showCardModal, setShowCardModal] = useState(false);
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const [showCardNoticeModal, setShowCardNoticeModal] = useState(false);
  const [cardForm, setCardForm] = useState({
    ownerName: "",
    cardNumber: "",
    accountNumber: "",
    iban: "",
    bankTitle: "",
  });
  const [cardLoading, setCardLoading] = useState(false);
  const [cardMsg, setCardMsg] = useState<string | null>(null);

  // Plan Upgrade state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

  // Test payment state
  const [testAmount, setTestAmount] = useState("50,000");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [serverUrl, setServerUrl] = useState("http://localhost:3050");

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
    if (typeof window !== "undefined") {
      setServerUrl(window.location.origin);
    }
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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (!raw) {
      setTestAmount("");
      return;
    }
    const formatted = Number(raw).toLocaleString("en-US");
    setTestAmount(formatted);
  };

  const handleOpenAddCard = () => {
    const activeCardsCount = user?.cards?.length || 0;
    const plan = user?.plan || "FREE";

    if (plan === "FREE" && activeCardsCount >= 1) {
      setShowCardNoticeModal(true);
    } else if (plan === "PRO" && activeCardsCount >= 5) {
      setShowCardNoticeModal(true);
    } else {
      setIsReplaceMode(false);
      setShowCardModal(true);
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardLoading(true);
    setCardMsg(null);
    try {
      const res = await fetch("/api/v1/user/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cardForm, replace: isReplaceMode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "خطا در ثبت کارت");
      }
      setShowCardModal(false);
      setIsReplaceMode(false);
      setCardForm({
        ownerName: "",
        cardNumber: "",
        accountNumber: "",
        iban: "",
        bankTitle: "",
      });
      fetchUserData();
    } catch (err: any) {
      setCardMsg(err.message);
    } finally {
      setCardLoading(false);
    }
  };

  const handleUpgradePlan = async (targetPlan: "PRO" | "SPECIAL") => {
    setUpgradeLoading(true);
    setUpgradeMsg(null);
    try {
      const res = await fetch("/api/v1/user/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlan }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "خطا در ثبت درخواست ارتقا");
      }
      setUpgradeMsg(data.message);
      fetchUserData();
      setTimeout(() => {
        setShowUpgradeModal(false);
        setShowCardNoticeModal(false);
        setUpgradeMsg(null);
      }, 2500);
    } catch (err: any) {
      setUpgradeMsg(err.message);
    } finally {
      setUpgradeLoading(false);
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
      const cleanNumeric = parseInt(testAmount.replace(/,/g, "")) || 50000;
      const targetCard = selectedCardId ? user.cards.find((c: any) => c.id === selectedCardId) : user.cards[0];
      const res = await fetch("/api/v1/payment/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": user.apiKey,
        },
        body: JSON.stringify({
          amount: cleanNumeric,
          cardId: targetCard?.id || user.cards[0].id,
          callbackUrl: `${window.location.origin}/portal`,
          description: `پرداخت فاکتور ${user.name || ""}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTestResult(json.data);
        await fetchUserData(); // Auto refresh transactions and counter immediately!
      } else {
        alert(json.message || json.error || "خطا در ایجاد لینک پرداخت");
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
          <span>در حال بارگذاری پنل کاربری...</span>
        </div>
      </div>
    );
  }

  const activeCard = user?.cards?.[0];
  const activeDevice = user?.devices?.[0];
  const userPlan = user?.plan || "FREE";

  const getPlanName = () => {
    if (userPlan === "PRO") return "پلن حرفه‌ای (۵ کارت • ۵۰۰ تراکنش موفق ماهانه)";
    if (userPlan === "SPECIAL") return "پلن ویژه (نامحدود)";
    return "پلن پایه (همیشه رایگان • ۵۰ تراکنش موفق ماهانه)";
  };

  const getMaxCards = () => {
    if (userPlan === "PRO") return 5;
    if (userPlan === "SPECIAL") return "نامحدود";
    return 1;
  };

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
              <img src="/images/honarhub_pay_logo.png" alt="هنرهاب پی" className="h-8 w-auto object-contain transition group-hover:opacity-95" />
              <span className="text-[10px] text-slate-400 font-medium">پنل کاربری</span>
            </Link>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                userPlan === "SPECIAL"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : userPlan === "PRO"
                  ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>
                {getPlanName()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-3 py-1.5 rounded-lg transition shadow-md shadow-amber-500/20"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>ارتقای پلن</span>
            </button>

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
                خوش‌آمدید، {user?.name || "کاربر گرامی"}
              </h1>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                {user?.phone || user?.email}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              این پنل کاربری برای مدیریت کارت‌های بانکی، نظارت بر پیامک‌های واریزی اپلیکیشن همراه و دسترسی به کلید امن وب‌سرویس درگاه طراحی شده است.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-xs space-y-2.5 w-full md:w-auto min-w-[260px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>وضعیت حساب:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                فعال و متصل
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>سهمیه کارت‌ها:</span>
              <span className="text-slate-200 font-bold">
                {toPersianDigits(user?.cards?.length || 0)} از {typeof getMaxCards() === "number" ? toPersianDigits(getMaxCards()) : getMaxCards()} مجاز
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
              <span>تراکنش‌های موفق:</span>
              <span className="text-emerald-300 font-bold">
                {userPlan === "FREE" && `${toPersianDigits(user?.monthlyTxCount || 0)} / ${toPersianDigits(50)} ماهانه`}
                {userPlan === "PRO" && `${toPersianDigits(user?.monthlyTxCount || 0)} / ${toPersianDigits(500)} ماهانه`}
                {userPlan === "SPECIAL" && `نامحدود`}
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
                اپلیکیشن اندروید هنرهاب پی را دانلود کرده و کلید دستگاه را وارد کنید تا پیامک‌های واریزی در لحظه خوانده شوند.
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

        {/* Section 1: Bank Cards & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">کارت‌های بانکی متصل</h2>
                  <span className="text-[11px] text-slate-400">
                    {toPersianDigits(user?.cards?.length || 0)} از {typeof getMaxCards() === "number" ? toPersianDigits(getMaxCards()) : getMaxCards()} کارت فعال
                  </span>
                </div>
              </div>

              <button
                onClick={handleOpenAddCard}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-2 rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن کارت بانکی</span>
              </button>
            </div>

            {user?.cards && user.cards.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {user.cards.map((card: any) => (
                  <div
                    key={card.id}
                    className="relative overflow-hidden bg-gradient-to-tr from-slate-900 via-[#132035] to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-emerald-400">{card.bankTitle}</span>
                      <span className="font-mono text-[11px] bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                        ID: {card.id.slice(0, 8)}...
                      </span>
                    </div>

                    <div className="pt-2 text-center" dir="ltr">
                      <span className="text-xl md:text-2xl font-mono font-bold tracking-widest text-white drop-shadow">
                        {toPersianDigits(card.cardNumber.replace(/(\d{4})/g, "$1 ").trim())}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-400 block">صاحب کارت:</span>
                        <span className="font-bold">{card.ownerName}</span>
                      </div>
                      {card.accountNumber && (
                        <div className="text-left font-mono">
                          <span className="text-[10px] text-slate-400 block">شماره حساب:</span>
                          <span>{toPersianDigits(card.accountNumber)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-300">هنوز کارتی ثبت نکرده‌اید</p>
                  <p className="text-xs text-slate-500">
                    برای شروع دریافت واریزی‌ها ابتدا کارت بانکی شخصی خود را ثبت نمایید.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddCard}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                >
                  ثبت اولین کارت بانکی
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Companion Android App & Device Key */}
          <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">اپلیکیشن همگام‌ساز پیامک</h2>
                  <span className="text-[10px] text-slate-400">اتصال گوشی اندروید جهت خواندن واریزی‌ها</span>
                </div>
              </div>

              {activeDevice ? (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">وضعیت اتصال اپلیکیشن:</span>
                    <span className={`font-bold flex items-center gap-1.5 ${
                      activeDevice.lastSeenAt ? "text-emerald-400" : "text-amber-400"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        activeDevice.lastSeenAt ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                      }`} />
                      {activeDevice.lastSeenAt ? "متصل و فعال" : "در انتظار اتصال اولیه"}
                    </span>
                  </div>

                  {/* Server URL field for Android app */}
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">۱. آدرس سرور درگاه (Server URL):</span>
                    <div className="flex items-center justify-between gap-2 bg-slate-900 p-2 rounded-xl font-mono text-[11px] text-emerald-300 border border-slate-800">
                      <span className="truncate" dir="ltr">{serverUrl}</span>
                      <button
                        onClick={() => handleCopy(serverUrl, "srv-url")}
                        className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
                        title="کپی آدرس سرور"
                      >
                        {copiedId === "srv-url" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Device Token field for Android app */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">۲. کلید اختصاصی دستگاه (Device Token):</span>
                    <div className="flex items-center justify-between gap-2 bg-slate-900 p-2 rounded-xl font-mono text-[11px] text-teal-300 border border-slate-800">
                      <span className="truncate" dir="ltr">{activeDevice.apiKey}</span>
                      <button
                        onClick={() => handleCopy(activeDevice.apiKey, "dev-key")}
                        className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
                        title="کپی کلید دستگاه"
                      >
                        {copiedId === "dev-key" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Instructions badge */}
                  <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-[11px] text-teal-200/90 leading-relaxed space-y-1">
                    <p className="font-bold text-teal-300">راهنمای اتصال گوشی به حساب:</p>
                    <p>۱. اپلیکیشن را دانلود و روی گوشی خود نصب کنید.</p>
                    <p>۲. وارد بخش تنظیمات برنامه شده و دو فیلد «آدرس سرور» و «کلید دستگاه» بالا را وارد نمایید تا همگام‌سازی پیامک‌ها فعال شود.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
                  <span className="text-xs text-slate-400 block">در حال ایجاد خودکار دستگاه و کلید اتصال...</span>
                </div>
              )}
            </div>

            <a
              href="/api/v1/download/apk"
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold py-3 rounded-2xl transition shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>دانلود فایل APK نسخه {ANDROID_APK_VERSION}</span>
            </a>
          </div>
        </div>

        {/* Section 3: REST API Key & Interactive Test Sandbox */}
        <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>کلید احراز هویت وب‌سرویس اختصاصی (x-api-key)</span>
              </h2>
              <p className="text-xs text-slate-400">
                این کلید را در هدر درخواست‌های ارسالی از وب‌سایت یا فروشگاه خود به درگاه قرار دهید.
              </p>
            </div>

            <button
              onClick={() => handleCopy(user.apiKey, "api-key")}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition shrink-0"
            >
              {copiedId === "api-key" ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">کپی گردید</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>کپی کلید API</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl font-mono text-xs text-amber-300 border border-slate-800/80 truncate" dir="ltr">
            {user.apiKey}
          </div>

          {/* Payment Link Trigger */}
          <div className="border-t border-slate-800/80 pt-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span>ایجاد درگاه پرداخت و صدور فاکتور اختصاصی</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  inputMode="numeric"
                  value={testAmount}
                  onChange={handleAmountChange}
                  placeholder="۵۰,۰۰۰"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm text-white font-mono font-bold tracking-wider focus:outline-none focus:border-emerald-500 shadow-inner"
                  dir="ltr"
                />
                <span className="absolute left-3 top-3 text-[10px] text-slate-500 font-sans">تومان</span>
              </div>

              {/* Multi-Card Dropdown Selector */}
              {user?.cards && user.cards.length > 1 && (
                <div className="relative w-full sm:w-64">
                  <select
                    value={selectedCardId || user.cards[0]?.id}
                    onChange={(e) => setSelectedCardId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none pr-8 pl-3"
                  >
                    {user.cards.map((c: any) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.bankTitle || "کارت بانکی"} • {c.ownerName} (...{c.cardNumber.slice(-4)})
                      </option>
                    ))}
                  </select>
                  <CreditCard className="w-4 h-4 text-emerald-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              )}

              <button
                onClick={handleCreateTestPayment}
                disabled={testLoading}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 shrink-0"
              >
                {testLoading ? (
                  <span>در حال ایجاد لینک پرداخت...</span>
                ) : (
                  <>
                    <span>ایجاد لینک پرداخت</span>
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
        {(() => {
          const allTx = (user?.transactions || []).slice().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const totalTxPages = Math.max(1, Math.ceil(allTx.length / TX_PER_PAGE));
          const safeTxPage = Math.min(txPage, totalTxPages);
          const paginatedTx = allTx.slice((safeTxPage - 1) * TX_PER_PAGE, safeTxPage * TX_PER_PAGE);

          return (
            <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>تراکنش‌های ثبت‌شده</span>
                  {allTx.length > 0 && (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                      {toPersianDigits(allTx.length)} تراکنش
                    </span>
                  )}
                </h2>
                <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                  نمایش ۱۰ تراکنش در هر صفحه • صفحه {toPersianDigits(safeTxPage)} از {toPersianDigits(totalTxPages)}
                </span>
              </div>

              {allTx.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  هنوز تراکنشی برای حساب شما ثبت نشده است. با ساخت لینک پرداخت بالا می‌توانید اولین تراکنش را ایجاد نمایید.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-slate-800 rounded-2xl overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">شناسه پیگیری (لینک پرداخت)</th>
                          <th className="p-3">مبلغ پایه</th>
                          <th className="p-3">آفست</th>
                          <th className="p-3">مبلغ نهایی پرداختی</th>
                          <th className="p-3">وضعیت</th>
                          <th className="p-3">کارت مقصد</th>
                          <th className="p-3">تاریخ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {paginatedTx.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3">
                              <Link
                                href={`/pay/${tx.authority}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="کلیک کنید تا صفحه پرداخت این تراکنش باز شود"
                                className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition-colors group"
                              >
                                <span className="font-mono text-xs">
                                  {toPersianDigits(tx.internalTrackingCode || tx.authority.slice(0, 14))}
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-300 transition-colors shrink-0" />
                              </Link>
                            </td>
                            <td className="p-3 text-slate-300">{formatPersianNumber(tx.originalAmountToman)} ت</td>
                            <td className="p-3 text-teal-400 font-bold">+{toPersianDigits(tx.offsetToman)} ت</td>
                            <td className="p-3 text-emerald-400 font-bold">{formatPersianNumber(tx.finalAmountToman)} ت</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-sans font-bold ${
                                  tx.status === "PAID"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                    : tx.status === "PENDING"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                    : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                {tx.status === "PAID" ? "پرداخت شده" : tx.status === "PENDING" ? "در انتظار پرداخت" : tx.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 font-sans">{tx.card?.ownerName || "—"}</td>
                            <td className="p-3 text-slate-500 font-sans text-[11px]">
                              {toPersianDigits(new Date(tx.createdAt).toLocaleDateString("fa-IR"))}{" "}
                              {toPersianDigits(new Date(tx.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalTxPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-1 text-xs">
                      <span className="text-slate-400">
                        نمایش ردیف {toPersianDigits((safeTxPage - 1) * TX_PER_PAGE + 1)} تا{" "}
                        {toPersianDigits(Math.min(safeTxPage * TX_PER_PAGE, allTx.length))} از مجموع{" "}
                        <strong className="text-white">{toPersianDigits(allTx.length)}</strong> تراکنش
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                          disabled={safeTxPage === 1}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                          <span>قبلی</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalTxPages }, (_, i) => i + 1).map((p) => (
                            <button
                              key={p}
                              onClick={() => setTxPage(p)}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                                safeTxPage === p
                                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                              }`}
                            >
                              {toPersianDigits(p)}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setTxPage((p) => Math.min(totalTxPages, p + 1))}
                          disabled={safeTxPage === totalTxPages}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition"
                        >
                          <span>بعدی</span>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </main>

      {/* Card Registration / Edit Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>{isReplaceMode ? "جایگزینی کارت بانکی (آرشیو کارت قبل)" : "ثبت کارت بانکی جدید"}</span>
              </h3>
              <button
                onClick={() => {
                  setShowCardModal(false);
                  setIsReplaceMode(false);
                }}
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
                <label className="text-slate-300 font-medium">
                  نام و نام‌خانوادگی صاحب حساب <span className="text-rose-400 font-bold">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={cardForm.ownerName}
                  onChange={(e) => setCardForm({ ...cardForm, ownerName: e.target.value })}
                  placeholder="مثال: امیر رضایی"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">
                  شماره ۱۶ رقمی کارت بانکی <span className="text-rose-400 font-bold">*</span>:
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={cardForm.cardNumber}
                  onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value.replace(/[^0-9]/g, "") })}
                  placeholder="6037991987654321"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">شماره شبا (اختیاری):</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    maxLength={24}
                    value={cardForm.iban}
                    onChange={(e) => setCardForm({ ...cardForm, iban: e.target.value.replace(/[^0-9]/g, "") })}
                    placeholder="120540102780001234567890"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500 tracking-wider text-xs placeholder:text-slate-600"
                    dir="ltr"
                  />
                  <span className="absolute left-3 font-mono font-black text-emerald-400 text-xs select-none pointer-events-none bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                    IR
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">۲۴ رقم عددی بدون پیشوند IR</span>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">عنوان نمایشی بانک (اختیاری):</label>
                <input
                  type="text"
                  value={cardForm.bankTitle}
                  onChange={(e) => setCardForm({ ...cardForm, bankTitle: e.target.value })}
                  placeholder="مثال: بانک قرض‌الحسنه مهر ایران یا بانک سامان"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                />
              </div>

              {isReplaceMode ? (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-xl text-[11px] leading-relaxed">
                  ⚠️ کارت قبلی شما به صورت امن بایگانی خواهد شد و سوابق تراکنش‌های آن دست‌نخورده باقی می‌ماند.
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 text-slate-400 p-3 rounded-xl text-[11px] leading-relaxed">
                  کارت ثبت‌شده به عنوان حساب مقصد واریز در درگاه پرداخت هوشمند شما فعال خواهد شد.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCardModal(false);
                    setIsReplaceMode(false);
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={cardLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20"
                >
                  {cardLoading ? "در حال ثبت..." : isReplaceMode ? "جایگزینی کارت" : "ذخیره و فعال‌سازی کارت"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quota Exceeded & Card Upgrade Notice Modal */}
      {showCardNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-amber-500/40 rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">نیاز به ارتقای پلن برای ثبت کارت بیشتر</h3>
              </div>
              <button
                onClick={() => setShowCardNoticeModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                در <strong className="text-emerald-400">پلن پایه (رایگان)</strong> شما مجاز به تعریف <strong>۱ کارت بانکی فعال</strong> هستید.
              </p>
              <p className="text-slate-400">
                برای فعال‌سازی همزمان تا ۵ کارت بانکی می‌توانید به <strong className="text-teal-400">«پلن حرفه‌ای»</strong> (۲۹۹ هزار تومان ماهانه) و برای تعداد نامحدود کارت به <strong className="text-amber-400">«پلن ویژه»</strong> ارتقا دهید.
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowCardNoticeModal(false);
                  setShowUpgradeModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold py-3 rounded-xl transition text-xs shadow-lg shadow-teal-500/20"
              >
                <Zap className="w-4 h-4" />
                <span>مشاهده پلن‌ها و ارتقای حساب کاربری</span>
              </button>

              <button
                onClick={() => {
                  setShowCardNoticeModal(false);
                  setIsReplaceMode(true);
                  setShowCardModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl transition text-xs font-medium"
              >
                <span>فقط جایگزینی کارت قبلی با شماره جدید (رایگان)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-base font-bold text-white">ارتقای پلن حساب کاربری هنرهاب پی</h3>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {upgradeMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs text-center font-bold">
                {upgradeMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Plan 1: Middle Plan (Pro) */}
              <div className="bg-gradient-to-b from-slate-900 via-[#132035] to-slate-900 border-2 border-teal-500/50 rounded-2xl p-6 space-y-5 flex flex-col justify-between shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-300 bg-teal-500/20 border border-teal-500/30 px-3 py-1 rounded-full">
                      پلن پیشنهادی
                    </span>
                    <span className="text-xs font-mono text-slate-400">Pro Tier</span>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-white">پلن حرفه‌ای</h4>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-teal-300">۲۹۹,۰۰۰</span>
                      <span className="text-xs text-slate-400">تومان / ماهانه</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span><strong>تا ۵ کارت بانکی مجزا</strong> به صورت همزمان</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span><strong>سقف ۵۰۰ تراکنش موفق ماهانه</strong> (تا ۵ کارت بانکی)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>امکان اتصال ۵ دستگاه تلفن همراه به سامانه</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>وب‌هوک‌های تسویه آنی و وب‌سرویس بدون وقفه</span>
                    </li>
                    <li className="flex items-center gap-2 text-teal-300 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>کارمزد تراکنش: ۰ درصد (کاملاً رایگان)</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgradePlan("PRO")}
                  disabled={upgradeLoading || userPlan === "PRO"}
                  className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-xs shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>{userPlan === "PRO" ? "پلن فعال فعلی شما" : "ارتقا به پلن حرفه‌ای (۲۹۹ هزار تومان)"}</span>
                </button>
              </div>

              {/* Plan 2: Special VIP Plan */}
              <div className="bg-gradient-to-b from-slate-900 via-[#1e1e2d] to-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 space-y-5 flex flex-col justify-between shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full">
                      ظرفیت نامحدود
                    </span>
                    <span className="text-xs font-mono text-slate-400">VIP Special</span>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-white">پلن ویژه (VIP)</h4>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-bold text-amber-300">بدون هیچ محدودیتی</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span><strong>تعداد کارت‌های نامحدود</strong> (به ازای تمام کاربران)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>اتصال نامحدود دستگاه‌ها و تلفن‌های همراه به سامانه</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span><strong>تراکنش‌های موفق نامحدود</strong> (بدون سقف ماهانه)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>پشتیبانی VIP فنی و راه‌اندازی اختصاصی روی سرور شما</span>
                    </li>
                    <li className="flex items-center gap-2 text-amber-300 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>کارمزد تراکنش: ۰ درصد (کاملاً رایگان)</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgradePlan("SPECIAL")}
                  disabled={upgradeLoading || userPlan === "SPECIAL"}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl transition text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4 fill-current" />
                  <span>{userPlan === "SPECIAL" ? "پلن فعال فعلی شما" : "درخواست ارتقا به پلن ویژه"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
