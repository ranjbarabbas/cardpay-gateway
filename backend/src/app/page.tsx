"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  CreditCard,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Zap,
  Lock,
  Code2,
  BookOpen,
  Check,
  Sparkles,
  ExternalLink,
  Download,
  Bell,
  RefreshCw,
  Cpu,
  ChevronDown,
  ChevronUp,
  Layers,
  Fingerprint,
  Phone,
  Send,
  Star,
  Users,
  Percent,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import { APP_NAME, APP_VERSION, WEB_APP_VERSION, ANDROID_APK_VERSION } from "@/lib/version";
import InteractivePaymentSimulator from "@/components/InteractivePaymentSimulator";
import MobileAutoScrollCarousel from "@/components/MobileAutoScrollCarousel";

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("honarhub_theme") as "dark" | "light" | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("honarhub_theme", next);
  };

  // Premium Lead Form state
  const [leadPhone, setLeadPhone] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadError(null);
    if (!leadPhone || leadPhone.trim().length < 10) {
      setLeadError("لطفاً شماره تماس معتبر (مثلاً ۰۹۱۲۳۴۵۶۷۸۹) وارد فرمایید.");
      return;
    }

    setLeadLoading(true);
    try {
      const res = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: leadPhone,
          name: leadName || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطا در ثبت درخواست تماس");
      }

      setLeadSuccess(true);
      setLeadPhone("");
      setLeadName("");
    } catch (err: any) {
      setLeadError(err.message);
    } finally {
      setLeadLoading(false);
    }
  };

  const faqs = [
    {
      q: "چرا مبالغ پرداخت با ۱۱، ۱۲ یا ۱۳ تومان اضافه ثبت می‌شوند؟",
      a: "این الگوریتم نوآورانه برای رفع ابهام بین فاکتورهای هم‌قیمت طراحی شده است. چنانچه چندین خریدار همزمان قصد پرداخت مبلغ ۱۰۰,۰۰۰ تومان را داشته باشند، سیستم مبالغ ۱۰۰,۰۱۱، ۱۰۰,۰۱۲ و ... را به آن‌ها تخصیص می‌دهد تا پس از واریز کارت‌به‌کارت و دریافت پیامک بانکی، تراکنش هر خریدار با دقت ۱۰۰٪ و بدون خطا شناسایی و تایید شود.",
    },
    {
      q: "اپلیکیشن اندروید چه نقشی در سامانه دارد و آیا نیاز به روت دارد؟",
      a: "اپلیکیشن نیتیو همگام‌ساز بدون نیاز به روت روی گوشی همراه دریافت‌کننده واریزی‌ها (مثلاً گوشی پذیرنده یا هنرمند) نصب می‌شود. با استفاده از سرویس پیش‌زمینه پایدار (Foreground Service)، به محض واریز بانکی پیامک را پارس کرده و در کمتر از یک ثانیه به گیت‌وی ارسال می‌کند.",
    },
    {
      q: "سیستم ضد فریب پیامک (Anti-Fraud) چگونه کار می‌کند؟",
      a: "فقط پیامک‌هایی که از سرشماره‌های تاییدشده (Approved Trusted Senders مانند B.QMEHRIRAN) ارسال شده باشند تراکنش را خودکار تایید می‌کنند. چنانچه شخصی با سیم‌کارت معمولی متن جعلی مشابه پیامک بانک ارسال کند، سیستم آن را در صف بررسی دستی قرار داده و تا زمان تایید ادمین مانع تایید تراکنش می‌شود.",
    },
    {
      q: "چگونه این درگاه را به وب‌سایت یا اپلیکیشن خود متصل کنم؟",
      a: "با ورود به پرتال یا مراجعه به بخش مستندات (/docs)، کلید اختصاصی x-api-key خود را دریافت می‌کنید. سپس در متد payment/request آدرس پرداخت دریافت کرده و پس از اتمام پرداخت، با متد payment/verify وضعیت را تایید و تسویه نمایید.",
    },
  ];

  return (
    <div
      className={`min-h-screen font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200 ${
        theme === "dark" ? "bg-[#070A0F] text-slate-100" : "bg-[#F8FAFC] text-slate-800"
      }`}
      dir="rtl"
    >
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className={`absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full blur-[140px] transition-opacity duration-300 ${
            theme === "dark" ? "bg-emerald-500/10" : "bg-emerald-500/5"
          }`}
        />
        <div
          className={`absolute top-[30%] right-[10%] w-[500px] h-[500px] rounded-full blur-[130px] transition-opacity duration-300 ${
            theme === "dark" ? "bg-teal-500/10" : "bg-teal-500/5"
          }`}
        />
      </div>

      {/* Top Navbar */}
      <header
        className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors duration-200 ${
          theme === "dark"
            ? "border-slate-800/80 bg-[#0B0F17]/80 text-slate-100"
            : "border-slate-200/90 bg-white/90 text-slate-800 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={theme === "dark" ? "/images/honarhub_pay_logo.png" : "/images/honarhub_pay_logo_light.png"}
              alt={APP_NAME}
              className="h-9 w-auto object-contain transition group-hover:opacity-95"
            />
          </Link>

          <nav className={`hidden md:flex items-center gap-6 text-xs font-medium ${
            theme === "dark" ? "text-slate-400" : "text-slate-600"
          }`}>
            <a href="#plans" className="text-emerald-500 font-bold hover:text-emerald-400 transition">پلن‌ها</a>
            <a href="#simulator" className={theme === "dark" ? "hover:text-white transition" : "hover:text-slate-900 transition"}>نحوه کار سامانه</a>
            <a href="#faq" className={theme === "dark" ? "hover:text-white transition" : "hover:text-slate-900 transition"}>پرسش‌های متداول</a>
          </nav>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button (Light / Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition border flex items-center justify-center ${
                theme === "dark"
                  ? "bg-slate-800/80 hover:bg-slate-700 text-amber-400 border-slate-700/80 hover:text-amber-300"
                  : "bg-slate-100 hover:bg-slate-200 text-amber-600 border-slate-300 hover:text-amber-700 shadow-sm"
              }`}
              title={theme === "dark" ? "تغییر به حالت روشن (Light Mode)" : "تغییر به حالت تیره (Dark Mode)"}
              aria-label="تغییر تم سایت"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
              )}
            </button>

            <Link
              href="/docs"
              className={`hidden lg:flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition ${
                theme === "dark"
                  ? "text-slate-300 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>مستندات API</span>
            </Link>

            <Link
              href="/login"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-600/20"
            >
              ورود / ثبت‌نام
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-12 md:pt-16 pb-24 space-y-16">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Subtle Top Feature Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold shadow-lg transition ${
              theme === "dark"
                ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 border-emerald-500/25 text-emerald-300 shadow-emerald-500/5"
                : "bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border-emerald-300/60 text-emerald-800 shadow-emerald-500/5"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>نسل نوین درگاه پرداخت P2P • تسویه مستقیم بانکی و بدون کارمزد شاپرکی</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-black leading-tight tracking-tight flex flex-col items-center gap-3">
            <span
              className={`whitespace-nowrap transition-colors duration-200 ${
                theme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              پول مستقیماً در حساب بانکی شما؛
            </span>
            <span className="inline-block py-1.5 leading-normal whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 drop-shadow-sm">
              بدون اینماد، بدون تاخیر و کاملاً آنی
            </span>
          </h1>

          {/* Clean Subtitle without Offset */}
          <p
            className={`text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-normal transition-colors ${
              theme === "dark" ? "text-slate-300" : "text-slate-600"
            }`}
          >
            <strong className={`font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{APP_NAME}</strong> پل ارتباطی مستقیم و هوشمند میان خریداران و کارت‌های بانکی شماست. با بهره‌گیری از الگوریتم‌های اختصاصی تطبیق بانکی و موتور هوش مصنوعی همگام‌ساز پیامک‌های واریز، هر کارت بانکی را به یک درگاه پرداخت تمام‌خودکار، امن و ۲۴ ساعته تبدیل کنید.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs md:text-sm font-bold px-6 py-3.5 rounded-2xl transition shadow-xl shadow-emerald-600/25 group"
            >
              <span>ورود / ثبت‌نام رایگان به پنل</span>
              <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/docs"
              className={`flex items-center gap-2 border text-xs md:text-sm font-bold px-5 py-3.5 rounded-2xl transition shadow ${
                theme === "dark"
                  ? "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              <Terminal className="w-4 h-4 text-emerald-500" />
              <span>مستندات و تست وب‌سرویس REST</span>
            </Link>

            <a
              href="/api/v1/download/apk"
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-3 rounded-2xl border transition ${
                theme === "dark"
                  ? "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/80"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              <Download className="w-4 h-4 text-teal-500" />
              <span>دانلود اپ اندروید (v{ANDROID_APK_VERSION})</span>
            </a>
          </div>

          {/* 4 Core Pillars Cards - Features Carousel on Mobile */}
          <MobileAutoScrollCarousel
            autoScrollInterval={3000}
            desktopGridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-4xl mx-auto pt-6 text-right"
            theme={theme}
          >
            <div
              className={`p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 h-full ${
                theme === "dark"
                  ? "bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-amber-500/30 text-slate-200"
                  : "bg-white hover:bg-amber-50/20 border-slate-200 hover:border-amber-300 text-slate-800 shadow-sm"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="font-black text-xs mb-1">تسویه بلادرنگ بانکی</div>
              <div className={`text-[11px] leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                انتقال مستقیم پول به کارت شما؛ بدون واسطه، بدون نگه‌داشت و بدون تاخیر شاپرک
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 h-full ${
                theme === "dark"
                  ? "bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-emerald-500/30 text-slate-200"
                  : "bg-white hover:bg-emerald-50/20 border-slate-200 hover:border-emerald-300 text-slate-800 shadow-sm"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="font-black text-xs mb-1">تایید ۱۰۰٪ خودکار با پیامک</div>
              <div className={`text-[11px] leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                پردازش هوشمند پیامک سرخط معتبر بانک و اعلام آنی موفقیت به سفارش مشتری
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 h-full ${
                theme === "dark"
                  ? "bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-teal-500/30 text-slate-200"
                  : "bg-white hover:bg-teal-50/20 border-slate-200 hover:border-teal-300 text-slate-800 shadow-sm"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-2.5">
                <Percent className="w-4 h-4" />
              </div>
              <div className="font-black text-xs mb-1">کارمزد ۰ درصد همیشگی</div>
              <div className={`text-[11px] leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                دریافت کل مبلغ فروش بدون کسر درصدهای سنگین واسطه‌ها یا کارمزد شاپرک
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 h-full ${
                theme === "dark"
                  ? "bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-sky-500/30 text-slate-200"
                  : "bg-white hover:bg-sky-50/20 border-slate-200 hover:border-sky-300 text-slate-800 shadow-sm"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-2.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="font-black text-xs mb-1">عدم انسداد یا بلوکه وجه</div>
              <div className={`text-[11px] leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                بدون ریسک مسدودسازی حساب و بدون نیاز به اخذ اینماد و تشریفات دست‌وپاگیر
              </div>
            </div>
          </MobileAutoScrollCarousel>
        </div>

        {/* Section: Business Pricing Plans */}
        <section id="plans" className="space-y-8 pt-6 scroll-mt-28">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <Star className="w-3.5 h-3.5" />
              <span>تعرفه‌ها و پلن‌های تجاری سامانه</span>
            </div>
            <h2 className={`text-2xl md:text-3xl font-black transition-colors ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              پلن متناسب با نیاز خود را انتخاب کنید
            </h2>
            <p className={`text-xs max-w-xl mx-auto leading-relaxed transition-colors ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
              شروع کاملاً رایگان با سقف ۵۰ تراکنش موفق ماهانه، پلن حرفه‌ای با ۵۰۰ تراکنش موفق ماهانه، یا پلن ویژه بدون هیچ محدودیتی
            </p>
          </div>

          <MobileAutoScrollCarousel
            autoScrollInterval={3000}
            desktopGridClassName="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch"
            theme={theme}
          >
            {/* Plan 1: Free Forever */}
            <div className={`border rounded-3xl p-6 md:p-8 flex flex-col justify-between transition shadow-xl relative overflow-hidden group ${
              theme === "dark"
                ? "bg-[#0F172A]/90 border-slate-800 hover:border-emerald-500/40 text-slate-100"
                : "bg-white border-slate-200 hover:border-emerald-500/50 text-slate-800 shadow-slate-200/50"
            }`}>
              <div className="space-y-4">
                <div className="h-8 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    شروع سریع
                  </span>
                  <span className={`text-xs font-mono ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Free Tier</span>
                </div>

                <div className="h-10 flex items-center">
                  <h3 className={`text-xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    پلن پایه (همیشه رایگان)
                  </h3>
                </div>

                <div className="h-14 flex items-baseline gap-1">
                  <span className={`text-3xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>۰</span>
                  <span className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>تومان / همیشگی</span>
                </div>

                <div className="h-12 flex items-center">
                  <p className={`text-xs leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                    ایده‌آل برای فریلنسرها، استارتاپ‌ها، کانال‌های فروشگاهی و کاربران با تراکنش‌های روزمره.
                  </p>
                </div>

                <ul className={`space-y-3 text-xs pt-3 border-t min-h-[210px] flex flex-col justify-between ${
                  theme === "dark" ? "text-slate-300 border-slate-800" : "text-slate-700 border-slate-100"
                }`}>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span><strong>۱ کارت بانکی فعال</strong> (واریز مستقیم و آنی)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>امکان اتصال ۱ دستگاه تلفن همراه به سامانه</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span><strong>سقف ۵۰ تراکنش موفق ماهانه</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>کلید اختصاصی وب‌سرویس REST</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-500 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>کارمزد تراکنش: ۰ درصد (کاملاً رایگان)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/login"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition text-center text-xs shadow-lg shadow-emerald-600/20 block"
                >
                  شروع رایگان و ورود به پنل
                </Link>
              </div>
            </div>

            {/* Plan 2: Pro Plan */}
            <div className={`border-2 rounded-3xl p-6 md:p-8 flex flex-col justify-between transition shadow-2xl relative overflow-hidden group ${
              theme === "dark"
                ? "bg-gradient-to-b from-[#132035] via-[#0F172A] to-[#0F172A] border-teal-500/50 hover:border-teal-400 text-slate-100"
                : "bg-gradient-to-b from-teal-50/50 via-white to-white border-teal-500/40 hover:border-teal-500 text-slate-800 shadow-teal-500/5"
            }`}>
              <div className="absolute top-0 left-0 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 text-[10px] font-black px-3.5 py-1 rounded-br-2xl shadow">
                محبوب‌ترین انتخاب
              </div>

              <div className="space-y-4">
                <div className="h-8 flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-500 bg-teal-500/15 border border-teal-500/30 px-3 py-1 rounded-full">
                    کسب‌وکارهای فعال
                  </span>
                  <span className={`text-xs font-mono ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Pro Tier</span>
                </div>

                <div className="h-10 flex items-center">
                  <h3 className={`text-xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    پلن حرفه‌ای
                  </h3>
                </div>

                <div className="h-14 flex flex-col justify-center">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-teal-500">۱۹۹,۰۰۰</span>
                    <span className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>تومان / ماهانه</span>
                  </div>
                  <span className={`text-[10px] ${theme === "dark" ? "text-teal-400/80" : "text-teal-600"}`}>
                    ۳ ماهه: ۴۹۹,۰۰۰ (۱۶٪ تخفیف) • ۶ ماهه: ۸۹۹,۰۰۰ (۲۵٪ تخفیف)
                  </span>
                </div>

                <div className="h-12 flex items-center">
                  <p className={`text-xs leading-relaxed ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                    طراحی شده برای فروشگاه‌های در حال رشد، مارکت‌های آنلاین و مدیرانی که نیازمند چند کارت هستند.
                  </p>
                </div>

                <ul className={`space-y-3 text-xs pt-3 border-t min-h-[210px] flex flex-col justify-between ${
                  theme === "dark" ? "text-slate-200 border-slate-800" : "text-slate-700 border-slate-100"
                }`}>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    <span><strong>تا ۵ کارت بانکی مجزا</strong> به صورت همزمان</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>امکان اتصال ۵ دستگاه تلفن همراه به سامانه</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    <span><strong>سقف ۵۰۰ تراکنش موفق ماهانه</strong> (تا ۵ کارت بانکی)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>وب‌هوک‌های تسویه آنی و وب‌سرویس بدون وقفه</span>
                  </li>
                  <li className="flex items-center gap-2 text-teal-500 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>کارمزد تراکنش: ۰ درصد (کاملاً رایگان)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/login"
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3.5 rounded-xl transition text-center text-xs shadow-lg shadow-teal-600/20 block"
                >
                  خرید و فعال‌سازی آنلاین پلن حرفه‌ای
                </Link>
              </div>
            </div>

            {/* Plan 3: Special Plan */}
            <div className={`border-2 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden ${
              theme === "dark"
                ? "bg-gradient-to-b from-[#1a1c29] to-[#0F172A] border-amber-500/40 text-slate-100"
                : "bg-gradient-to-b from-amber-50/50 via-white to-white border-amber-500/40 text-slate-800 shadow-amber-500/5"
            }`}>
              <div className="space-y-4">
                <div className="h-8 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
                    ظرفیت نامحدود
                  </span>
                  <span className={`text-xs font-mono ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>VIP Special</span>
                </div>

                <div className="h-10 flex items-center">
                  <h3 className={`text-xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    پلن ویژه (VIP)
                  </h3>
                </div>

                <div className="h-14 flex flex-col justify-center">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-amber-500">۳۹۹,۰۰۰</span>
                    <span className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>تومان / ماهانه</span>
                  </div>
                  <span className={`text-[10px] ${theme === "dark" ? "text-amber-400/80" : "text-amber-600"}`}>
                    ۳ ماهه: ۹۹۹,۰۰۰ (۱۷٪ تخفیف) • ۶ ماهه: ۱,۷۹۹,۰۰۰ (۲۵٪ تخفیف)
                  </span>
                </div>

                <div className="h-12 flex items-center">
                  <p className={`text-xs leading-relaxed ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                    ویژه پلتفرم‌های با ترافیک بالا، مارکت‌پلیس‌ها و مجموعه‌هایی که نیاز به اتصال نامحدود دارند.
                  </p>
                </div>

                <ul className={`space-y-3 text-xs pt-3 border-t min-h-[210px] flex flex-col justify-between ${
                  theme === "dark" ? "text-slate-200 border-slate-700/60" : "text-slate-700 border-slate-100"
                }`}>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span><strong>تعداد کارت‌های نامحدود</strong> (به ازای تمام کاربران)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>اتصال نامحدود دستگاه‌ها و تلفن‌های همراه به سامانه</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span><strong>تراکنش‌های موفق نامحدود</strong> (بدون سقف ماهانه)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>پشتیبانی VIP فنی و راه‌اندازی اختصاصی</span>
                  </li>
                  <li className="flex items-center gap-2 text-amber-500 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>کارمزد تراکنش: ۰ درصد (کاملاً رایگان)</span>
                  </li>
                </ul>
              </div>

              {/* Direct Purchase Button (Replaced Lead Phone Form) */}
              <div className="pt-6 space-y-2">
                <Link
                  href="/login"
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3.5 rounded-xl transition text-center text-xs shadow-lg shadow-amber-500/20 block"
                >
                  خرید و فعال‌سازی آنلاین پلن ویژه
                </Link>
                <span className={`text-[10px] block text-center ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                  پرداخت کارت‌به‌کارت آنی • ارتقای خودکار ۱۰ دقیقه‌ای
                </span>
              </div>
            </div>
          </MobileAutoScrollCarousel>
        </section>

        {/* Interactive Live Payment Simulator Widget */}
        <section id="simulator" className="scroll-mt-28">
          <InteractivePaymentSimulator />
        </section>

        {/* FAQ Section */}
        <section id="faq" className="space-y-6 pt-6 scroll-mt-28">
          <div className="text-center space-y-2">
            <h2 className={`text-2xl font-black transition-colors ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              پرسش‌های متداول
            </h2>
            <p className={`text-xs transition-colors ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
              پاسخ به سوالات پرتکرار در خصوص عملکرد درگاه و امنیت پرداخت‌ها
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`border rounded-2xl overflow-hidden transition ${
                    theme === "dark"
                      ? "bg-[#0F172A]/80 border-slate-800"
                      : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className={`w-full text-right p-4 flex items-center justify-between text-xs md:text-sm font-bold transition ${
                      theme === "dark"
                        ? "text-white hover:text-emerald-400"
                        : "text-slate-900 hover:text-emerald-600"
                    }`}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`} />
                    )}
                  </button>
                  {isOpen && (
                    <div className={`px-4 pb-4 text-xs leading-relaxed border-t pt-3 ${
                      theme === "dark"
                        ? "text-slate-300 border-slate-800/60"
                        : "text-slate-600 border-slate-100"
                    }`}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`border-t py-10 text-center text-xs space-y-4 transition-colors ${
        theme === "dark"
          ? "border-slate-800/80 bg-[#0B0F17] text-slate-500"
          : "border-slate-200 bg-white text-slate-600 shadow-inner"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src={theme === "dark" ? "/images/honarhub_pay_logo.png" : "/images/honarhub_pay_logo_light.png"}
              alt={APP_NAME}
              className="h-6 w-auto object-contain"
            />
            <span className={theme === "dark" ? "text-slate-600" : "text-slate-300"}>•</span>
            <span className={theme === "dark" ? "text-slate-400" : "text-slate-600"}>
              سامانه درگاه پرداخت کارت‌به‌کارت هوشمند و خودکار
            </span>
          </div>

          <div className={`flex flex-wrap items-center justify-center gap-4 text-xs ${
            theme === "dark" ? "text-slate-400" : "text-slate-600"
          }`}>
            <Link href="/portal" className="hover:text-emerald-500 transition">پرتال کاربری</Link>
            <Link href="/docs" className="hover:text-emerald-500 transition">داکیومنت API</Link>
            <Link href="/admin" className="hover:text-emerald-500 transition">ورود مدیران</Link>
            <a
              href="https://github.com/ranjbarabbas/cardpay-gateway"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-500 transition"
            >
              گیت‌هاب
            </a>
            
            <div className={`flex items-center gap-2 md:pr-3 md:border-r ${
              theme === "dark" ? "border-slate-800" : "border-slate-200"
            }`}>
              <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-lg text-[11px] ${
                theme === "dark"
                  ? "bg-slate-900/90 border-slate-800 text-slate-300"
                  : "bg-slate-100 border-slate-200 text-slate-700"
              }`}>
                <Globe className="w-3.5 h-3.5 text-teal-500" />
                <span>نسخه وب:</span>
                <span className="text-teal-500 font-mono font-bold" dir="ltr">v{WEB_APP_VERSION}</span>
              </span>
              <a
                href="/api/v1/download/apk"
                className={`inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-lg text-[11px] transition ${
                  theme === "dark"
                    ? "bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-emerald-300"
                    : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-emerald-600"
                }`}
                title="دانلود مستقیم اپلیکیشن همگام‌ساز پیامک اندروید"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                <span>نسخه اندروید:</span>
                <span className="text-emerald-500 font-mono font-bold" dir="ltr">v{ANDROID_APK_VERSION}</span>
              </a>
            </div>
          </div>
        </div>

        <div className={`text-[11px] ${theme === "dark" ? "text-slate-600" : "text-slate-400"}`}>
          توسعه‌یافته به صورت کاملاً مستقل و متن‌باز ❤️
        </div>
      </footer>
    </div>
  );
}
