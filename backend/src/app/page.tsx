"use client";

import { useState } from "react";
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
} from "lucide-react";

export default function Home() {
  const [simStep, setSimStep] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Interactive Live Simulation Handler
  const handleStartSim = () => {
    setIsSimulating(true);
    setSimStep(1);
    setTimeout(() => setSimStep(2), 1200);
    setTimeout(() => setSimStep(3), 2600);
    setTimeout(() => {
      setSimStep(4);
      setIsSimulating(false);
    }, 4200);
  };

  const faqs = [
    {
      q: "چرا مبالغ پرداخت با ۱۱، ۱۲ یا ۱۳ تومان اضافه ثبت می‌شوند؟",
      a: "این الگوریتم نوآورانه برای رفع ابهام بین فاکتورهای هم‌قیمت طراحی شده است. چنانچه چندین خریدار همزمان قصد پرداخت مبلغ ۱۰۰,۰۰۰ تومان را داشته باشند، سیستم مبالغ ۱۰۰,۰۱۱، ۱۰۰,۰۱۲ و ... را به آن‌ها تخصیص می‌دهد تا پس از واریز کارت‌به‌کارت و دریافت پیامک بانکی، تراکنش هر خریدار با دقت ۱۰۰٪ و بدون خطا شناسایی و تایید شود.",
    },
    {
      q: "اپلیکیشن اندروید چه نقشی در سامانه دارد و آیا نیاز به روت دارد؟",
      a: "اپلیکیشن نیتیو CardPay Sync بدون نیاز به روت روی گوشی همراه دریافت‌کننده واریزی‌ها (مثلاً گوشی پذیرنده یا هنرمند) نصب می‌شود. با استفاده از سرویس پیش‌زمینه پایدار (Foreground Service)، به محض واریز بانکی پیامک را پارس کرده و در کمتر از یک ثانیه به گیت‌وی ارسال می‌کند.",
    },
    {
      q: "سیستم ضد فریب پیامک (Anti-Fraud) چگونه کار می‌کند؟",
      a: "فقط پیامک‌هایی که از سرشماره‌های تاییدشده (Approved Trusted Senders مانند B.QMEHRIRAN) ارسال شده باشند تراکنش را خودکار تایید می‌کنند. چنانچه شخصی با سیم‌کارت معمولی متن جعلی مشابه پیامک بانک ارسال کند، سیستم آن را در صف بررسی دستی (Pending Senders) قرار داده و تا زمان تایید ادمین مانع تایید تراکنش می‌شود.",
    },
    {
      q: "چگونه این درگاه را به وب‌سایت یا اپلیکیشن خود متصل کنم؟",
      a: "با مراجعه به بخش مستندات تعاملی (/docs)، می‌توانید از طریق وب‌سرویس استاندارد REST در متد payment/request آدرس پرداخت دریافت کرده و پس از اتمام پرداخت، با متد payment/verify وضعیت را تایید و تسویه نمایید. همچنین وب‌هوک خودکار به آدرس بازگشت فروشگاه شما ارسال می‌شود.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[30%] right-[10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[130px]" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0B0F17]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight">CardPay Gateway</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                v1.0.0
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
            <a href="#features" className="hover:text-white transition">ویژگی‌ها</a>
            <a href="#simulator" className="hover:text-white transition">شبیه‌ساز پرداخت</a>
            <a href="#android" className="hover:text-white transition">دانلود اپلیکیشن اندروید</a>
            <a href="#faq" className="hover:text-white transition">پرسش‌های متداول</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              className="text-xs text-slate-300 hover:text-white font-medium px-3 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>مستندات GitBook</span>
            </Link>
            <a
              href="https://github.com/ranjbarabbas/cardpay-gateway/releases/download/v1.0.0/cardpay-sync.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>دانلود APK</span>
            </a>
            <Link
              href="/admin"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-600/20"
            >
              ورود به پنل مدیریت
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24 space-y-12">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-1.5 rounded-full font-bold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>انتشار رسمی نسخه ۱.۰.۰ • بدون واسطه و بدون کارمزد شاپرک</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
            درگاه هوشمند پرداخت
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
              کارت به کارت با تسویه بلادرنگ
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            زیرساخت فین‌تک برای پذیرندگان، استارتاپ‌ها و هنرمندان. واریز مستقیم وجه به حساب شخصی، تفکیک هوشمند مبالغ هم‌ارز با الگوریتم آفست پویا (+11 تومان) و همگام‌سازی بلادرنگ پیامک بانکی با اپلیکیشن اختصاصی کاتلین.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/docs"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-6 py-3.5 rounded-2xl transition shadow-xl shadow-emerald-600/25"
            >
              <Terminal className="w-4 h-4" />
              <span>مستندات و تست وب‌سرویس REST</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </Link>

            <a
              href="https://github.com/ranjbarabbas/cardpay-gateway/releases/download/v1.0.0/cardpay-sync.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-bold px-6 py-3.5 rounded-2xl transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>دانلود APK اپلیکیشن همراه (5.1MB)</span>
            </a>

            <a
              href="https://github.com/ranjbarabbas/cardpay-gateway"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>ریپازیتوری در گیت‌هاب</span>
            </a>
          </div>
        </div>

        {/* Interactive Live Payment Simulator Widget */}
        <section id="simulator" className="bg-[#0F172A]/70 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>شبیه‌ساز تعاملی چرخه واریز و تطبیق پیامک</span>
              </div>
              <h2 className="text-xl font-black text-white">نحوه پردازش و تایید خودکار سفارش در چند ثانیه</h2>
            </div>

            <button
              onClick={handleStartSim}
              disabled={isSimulating}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال شبیه‌سازی مراحل...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>اجرای شبیه‌سازی زنده پرداخت</span>
                </>
              )}
            </button>
          </div>

          {/* Steps Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
            {/* Step 1 */}
            <div className={`p-4 rounded-2xl border transition ${simStep >= 1 ? "bg-slate-900 border-emerald-500/40 text-white" : "bg-slate-950/40 border-slate-800/60 text-slate-500"}`}>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span>۱. ثبت سفارش</span>
                <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded">فروشگاه</span>
              </div>
              <p className="text-xs text-slate-400">
                مشتری فاکتور <span className="font-mono text-white">۱۰۰,۰۰۰</span> تومانی ثبت می‌کند.
              </p>
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-2xl border transition ${simStep >= 2 ? "bg-slate-900 border-emerald-500/40 text-white" : "bg-slate-950/40 border-slate-800/60 text-slate-500"}`}>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span>۲. الگوریتم آفست</span>
                <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">+11 تومان</span>
              </div>
              <p className="text-xs text-slate-400">
                مبلغ نهایی: <span className="font-mono font-bold text-emerald-400">۱۰۰,۰۱۱</span> تومان + شناسه PAY-14050817...
              </p>
            </div>

            {/* Step 3 */}
            <div className={`p-4 rounded-2xl border transition ${simStep >= 3 ? "bg-slate-900 border-emerald-500/40 text-white" : "bg-slate-950/40 border-slate-800/60 text-slate-500"}`}>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span>۳. همگام‌ساز اندروید</span>
                <span className="font-mono text-[10px] bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded">B.QMEHRIRAN</span>
              </div>
              <p className="text-xs text-slate-400">
                دریافت پیامک بانکی از سرشماره تاییدشده و ارسال به درگاه در ۰.۸ ثانیه.
              </p>
            </div>

            {/* Step 4 */}
            <div className={`p-4 rounded-2xl border transition ${simStep >= 4 ? "bg-emerald-950/30 border-emerald-500 text-white" : "bg-slate-950/40 border-slate-800/60 text-slate-500"}`}>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span>۴. تایید و تسویه</span>
                <CheckCircle2 className={`w-4 h-4 ${simStep >= 4 ? "text-emerald-400" : "text-slate-600"}`} />
              </div>
              <p className="text-xs text-slate-400">
                تطبیق بلادرنگ، ثبت وضعیت <span className="font-mono text-emerald-400 font-bold">SUCCESS</span> و هدایت خریدار.
              </p>
            </div>
          </div>
        </section>

        {/* Bento Box Feature Grid (6 Cards) */}
        <section id="features" className="space-y-8 pt-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-white">قابلیت‌های مهندسی‌شده سامانه CardPay</h2>
            <p className="text-xs md:text-sm text-slate-400">طراحی شده بر اساس استانداردهای مدرن فین‌تک و بالاترین سطح پایداری و امنیت</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1 */}
            <div className="bg-[#0F172A]/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition shadow-lg group">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-105 transition">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">الگوریتم آفست پویا (+11 تومان)</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                تراکنش‌های همزمان با مبالغ مشابه با افست یکتای ۱۱، ۱۲ و ۱۳ تومانی از یکدیگر متمایز شده و در بازه رزرو امن ۲۰ دقیقه‌ای قفل می‌شوند.
              </p>
            </div>

            {/* Bento Card 2 */}
            <div className="bg-[#0F172A]/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition shadow-lg group">
              <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center group-hover:scale-105 transition">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">اپلیکیشن اختصاصی همراه (CardPay Sync)</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                توسعه‌یافته با کاتلین نیتیو، دارای صفحه اختصاصی تنظیمات ⚙️، سرویس پیش‌زمینه پایدار (Foreground) و ارسال بلادرنگ پیامک واریز.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="bg-[#0F172A]/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition shadow-lg group">
              <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center group-hover:scale-105 transition">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">فایروال پیامک ضد فریب (Anti-Fraud)</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                تفکیک خودکار سرشماره‌های تاییدشده و قرنطینه پیامک‌های مشکوک در صف بررسی دستی ادمین، جهت جلوگیری از فریب سیستم با پیامک جعلی.
              </p>
            </div>

            {/* Bento Card 4 */}
            <div className="bg-[#0F172A]/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition shadow-lg group">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center group-hover:scale-105 transition">
                <Fingerprint className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">شناسه رهگیری استاندارد شمسی</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                تولید شناسه‌های یکتا با قالب <code className="text-emerald-300 font-mono">PAY-YYYYMMDDXXXXXXXX</code> جهت حسابرسی دقیق و تطبیق آسان مالیاتی.
              </p>
            </div>

            {/* Bento Card 5 */}
            <div className="bg-[#0F172A]/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition shadow-lg group">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center group-hover:scale-105 transition">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">پوش‌نوتیفیکیشن دوطرفه به دستگاه</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                امکان ارسال پیام‌های سیستمی و دستورات همگام‌سازی از پنل مدیریت مستقیماً به اعلان‌های گوشی همراه متصل به سیستم.
              </p>
            </div>

            {/* Bento Card 6 */}
            <div className="bg-[#0F172A]/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition shadow-lg group">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-105 transition">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">داکیومنت تعاملی به سبک GitBook</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                مستندات کامل REST با قابلیت اجرای زنده درخواست‌ها در کنسول Sandbox، پشتیبانی از cURL، Node.js، Python و PHP.
              </p>
            </div>
          </div>
        </section>

        {/* Android Release & APK Download Section */}
        <section id="android" className="bg-gradient-to-br from-slate-900/90 via-[#0F172A] to-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold">
                <Smartphone className="w-3.5 h-3.5" />
                <span>نسخه رسمی منتشر شده در گیت‌هاب</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white">
                اپلیکیشن همگام‌ساز پیامک CardPay Sync (v1.0.0)
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                این اپلیکیشن کاتلین اختصاصی روی گوشی متصل به حساب بانکی نصب شده و پیامک‌های واریزی را به صورت رمزنگاری‌شده و آنی به درگاه ارسال می‌کند. دارای بخش تنظیمات مستقل ⚙️ جهت تنظیم آدرس درگاه و کلید اختصاصی دستگاه.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="https://github.com/ranjbarabbas/cardpay-gateway/releases/download/v1.0.0/cardpay-sync.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-lg shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل APK از GitHub Releases (5.1MB)</span>
                </a>
                <Link
                  href="/api/v1/download/apk"
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-4 py-3 rounded-xl transition"
                >
                  <span>دانلود از سرور Gateway</span>
                </Link>
              </div>
            </div>

            {/* Spec Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 w-full lg:w-80 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>نسخه فایل:</span>
                <span className="text-white font-bold">v1.0.0</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>فرمت فایل:</span>
                <span className="text-emerald-400 font-bold">APK (Android 7.0+)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>حجم باینری:</span>
                <span className="text-white font-bold">5.1 Megabytes</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>الگوریتم رمز:</span>
                <span className="text-slate-300">SHA-256 Verified</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 block truncate" title="d89643c829a294a117ba2bcf2bcdaaff78c6f170da6adf1f32c95c9db4c2ca35">
                  SHA: d89643c829a294a117ba...
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="space-y-6 pt-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">پرسش‌های متداول</h2>
            <p className="text-xs text-slate-400">پاسخ به سوالات پرتکرار در خصوص عملکرد درگاه و امنیت پرداخت‌ها</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#0F172A]/80 border border-slate-800 rounded-2xl overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-right p-4 flex items-center justify-between text-xs md:text-sm font-bold text-white hover:text-emerald-400 transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
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
      <footer className="border-t border-slate-800/80 bg-[#0B0F17] py-10 text-center text-xs text-slate-500 space-y-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-300">CardPay Gateway</span>
            <span className="text-slate-600">•</span>
            <span>سامانه درگاه پرداخت کارت‌به‌کارت هوشمند و خودکار</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/docs" className="hover:text-emerald-400 transition">داکیومنت API</Link>
            <Link href="/admin" className="hover:text-emerald-400 transition">پنل مدیریت</Link>
            <a
              href="https://github.com/ranjbarabbas/cardpay-gateway"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition"
            >
              GitHub Repository
            </a>
            <a
              href="https://github.com/ranjbarabbas/cardpay-gateway/releases/tag/v1.0.0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              Release v1.0.0
            </a>
          </div>
        </div>

        <div className="text-[11px] text-slate-600">
          توسعه‌یافته به صورت کاملاً مستقل و متن‌باز • تمامی کامیت‌ها و اسناد به زبان انگلیسی نگهداری می‌شوند.
        </div>
      </footer>
    </div>
  );
}
