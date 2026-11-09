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
  Phone,
  Send,
  Star,
  Users,
} from "lucide-react";
import { APP_NAME, APP_VERSION } from "@/lib/version";
import InteractivePaymentSimulator from "@/components/InteractivePaymentSimulator";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            <img src="/images/honarhub_logo.png" alt={APP_NAME} className="w-10 h-10 rounded-2xl shadow-lg shadow-emerald-500/10 object-cover" />
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight">{APP_NAME}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                v{APP_VERSION}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
            <a href="#plans" className="text-emerald-400 font-bold hover:text-white transition">پلن‌ها</a>
            <a href="#simulator" className="hover:text-white transition">نحوه کار سامانه</a>
            <a href="#faq" className="hover:text-white transition">پرسش‌های متداول</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/docs"
              className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-medium px-3 py-2 rounded-xl transition"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
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
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24 space-y-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
            درگاه هوشمند پرداخت
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
              کارت به کارت با تسویه بلادرنگ
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            زیرساخت فین‌تک برای پذیرندگان، استارتاپ‌ها و پلتفرم‌های هنری. واریز مستقیم وجه به حساب شخصی، تفکیک هوشمند مبالغ هم‌ارز با الگوریتم آفست پویا (+11 تومان) و رصد خودکار پیامک‌های بانکی با اپلیکیشن اختصاصی کاتلین.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-6 py-3.5 rounded-2xl transition shadow-xl shadow-emerald-600/25"
            >
              <span>ورود / ثبت‌نام به پنل کاربری</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </Link>

            <Link
              href="/docs"
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-bold px-6 py-3.5 rounded-2xl transition"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>مستندات و تست وب‌سرویس REST</span>
            </Link>

            <a
              href="/api/v1/download/apk"
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-3 rounded-2xl border border-slate-700/80 transition"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>دانلود اپلیکیشن اندروید (APK)</span>
            </a>
          </div>
        </div>

        {/* Section: Business Pricing Plans */}
        <section id="plans" className="space-y-8 pt-6 scroll-mt-28">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <Star className="w-3.5 h-3.5" />
              <span>تعرفه‌ها و پلن‌های تجاری سامانه</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">پلن متناسب با نیاز خود را انتخاب کنید</h2>
            <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
              شروع کاملاً رایگان با سقف ۵۰ تراکنش موفق ماهانه، پلن حرفه‌ای با ۵۰۰ تراکنش موفق ماهانه، یا پلن ویژه بدون هیچ محدودیتی
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            {/* Plan 1: Free Forever */}
            <div className="bg-[#0F172A]/90 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 md:p-8 flex flex-col justify-between transition shadow-xl relative overflow-hidden group">
              <div className="space-y-4">
                <div className="h-8 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    شروع سریع
                  </span>
                  <span className="text-xs font-mono text-slate-500">Free Tier</span>
                </div>

                <div className="h-10 flex items-center">
                  <h3 className="text-xl font-black text-white">پلن پایه (همیشه رایگان)</h3>
                </div>

                <div className="h-14 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">۰</span>
                  <span className="text-xs text-slate-400">تومان / همیشگی</span>
                </div>

                <div className="h-12 flex items-center">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    ایده‌آل برای فریلنسرها، استارتاپ‌ها، کانال‌های فروشگاهی و کاربران با تراکنش‌های روزمره.
                  </p>
                </div>

                <ul className="space-y-3 text-xs text-slate-300 pt-3 border-t border-slate-800 min-h-[210px] flex flex-col justify-between">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>۱ کارت بانکی فعال</strong> (واریز مستقیم و آنی)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>امکان اتصال ۱ دستگاه تلفن همراه به سامانه</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>سقف ۵۰ تراکنش موفق ماهانه</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>کلید اختصاصی وب‌سرویس REST</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
            <div className="bg-gradient-to-b from-[#132035] via-[#0F172A] to-[#0F172A] border-2 border-teal-500/50 hover:border-teal-400 rounded-3xl p-6 md:p-8 flex flex-col justify-between transition shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 text-[10px] font-black px-3.5 py-1 rounded-br-2xl shadow">
                محبوب‌ترین انتخاب
              </div>

              <div className="space-y-4">
                <div className="h-8 flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300 bg-teal-500/20 border border-teal-500/30 px-3 py-1 rounded-full">
                    کسب‌وکارهای فعال
                  </span>
                  <span className="text-xs font-mono text-slate-400">Pro Tier</span>
                </div>

                <div className="h-10 flex items-center">
                  <h3 className="text-xl font-black text-white">پلن حرفه‌ای</h3>
                </div>

                <div className="h-14 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-teal-300">۲۹۹,۰۰۰</span>
                  <span className="text-xs text-slate-400">تومان / ماهانه</span>
                </div>

                <div className="h-12 flex items-center">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    طراحی شده برای فروشگاه‌های در حال رشد، مارکت‌های آنلاین و مدیرانی که نیازمند چند کارت هستند.
                  </p>
                </div>

                <ul className="space-y-3 text-xs text-slate-200 pt-3 border-t border-slate-800 min-h-[210px] flex flex-col justify-between">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span><strong>تا ۵ کارت بانکی مجزا</strong> به صورت همزمان</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>امکان اتصال ۵ دستگاه تلفن همراه به سامانه</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span><strong>سقف ۵۰۰ تراکنش موفق ماهانه</strong> (تا ۵ کارت بانکی)</span>
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

              <div className="pt-6">
                <Link
                  href="/login"
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3.5 rounded-xl transition text-center text-xs shadow-lg shadow-teal-600/20 block"
                >
                  انتخاب پلن حرفه‌ای
                </Link>
              </div>
            </div>

            {/* Plan 3: Special Plan */}
            <div className="bg-gradient-to-b from-[#1a1c29] to-[#0F172A] border-2 border-amber-500/40 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="space-y-4">
                <div className="h-8 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full">
                    ظرفیت نامحدود
                  </span>
                  <span className="text-xs font-mono text-slate-400">VIP Special</span>
                </div>

                <div className="h-10 flex items-center">
                  <h3 className="text-xl font-black text-white">پلن ویژه (VIP)</h3>
                </div>

                <div className="h-14 flex items-center">
                  <span className="text-2xl font-black text-amber-300">بدون هیچ محدودیتی</span>
                </div>

                <div className="h-12 flex items-center">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ویژه پلتفرم‌های با ترافیک بالا، مارکت‌پلیس‌ها و مجموعه‌هایی که نیاز به اتصال نامحدود دارند.
                  </p>
                </div>

                <ul className="space-y-3 text-xs text-slate-200 pt-3 border-t border-slate-700/60 min-h-[210px] flex flex-col justify-between">
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
                    <span>پشتیبانی VIP فنی و راه‌اندازی اختصاصی</span>
                  </li>
                  <li className="flex items-center gap-2 text-amber-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>کارمزد تراکنش: ۰ درصد (کاملاً رایگان)</span>
                  </li>
                </ul>
              </div>

              {/* Lead Contact Form */}
              <div className="pt-6">
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    ثبت شماره تماس جهت مشاوره و فعال‌سازی پلن ویژه:
                  </span>

                  {leadSuccess ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs text-center leading-relaxed">
                      درخواست شما با موفقیت ثبت گردید. کارشناسان ما به زودی با شما تماس خواهند گرفت.
                    </div>
                  ) : (
                    <form onSubmit={handleLeadSubmit} className="space-y-2.5 text-xs">
                      {leadError && (
                        <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[11px]">
                          {leadError}
                        </div>
                      )}
                      <input
                        type="tel"
                        required
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        placeholder="شماره موبایل: 09123456789"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                        dir="ltr"
                      />
                      <input
                        type="text"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        placeholder="نام یا عنوان کسب‌وکار (اختیاری)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400 text-[11px]"
                      />
                      <button
                        type="submit"
                        disabled={leadLoading}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 rounded-xl transition shadow text-xs flex items-center justify-center gap-2"
                      >
                        {leadLoading ? "در حال ثبت درخواست..." : "درخواست تماس کارشناس ویژه"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Live Payment Simulator Widget */}
        <section id="simulator" className="scroll-mt-28">
          <InteractivePaymentSimulator />
        </section>

        {/* FAQ Section */}
        <section id="faq" className="space-y-6 pt-6 scroll-mt-28">
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
            <img src="/images/honarhub_logo.png" alt={APP_NAME} className="w-5 h-5 rounded-lg object-cover" />
            <span className="font-bold text-slate-300">{APP_NAME}</span>
            <span className="text-slate-600">•</span>
            <span>سامانه درگاه پرداخت کارت‌به‌کارت هوشمند و خودکار</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/portal" className="hover:text-emerald-400 transition">پرتال کاربری</Link>
            <Link href="/docs" className="hover:text-emerald-400 transition">داکیومنت API</Link>
            <Link href="/admin" className="hover:text-emerald-400 transition">ورود مدیران</Link>
            <a
              href="https://github.com/ranjbarabbas/cardpay-gateway"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition"
            >
              گیت‌هاب
            </a>
            <span className="text-emerald-400 font-mono font-bold">
              نسخه {APP_VERSION}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-600">
          توسعه‌یافته به صورت کاملاً مستقل و متن‌باز ❤️
        </div>
      </footer>
    </div>
  );
}
