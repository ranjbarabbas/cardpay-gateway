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
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-lg text-white tracking-tight">CardPay Gateway</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full mr-2">
                P2P Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              className="text-xs text-slate-300 hover:text-white font-medium px-3 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span>مستندات API</span>
            </Link>
            <Link
              href="/admin"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-600/20"
            >
              ورود به پنل مدیریت
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-1.5 rounded-full font-bold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>زیرساخت درگاه پرداخت مستقیم کارت‌به‌کارت برای استارتاپ‌ها و پذیرندگان آنلاین</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
          تسویه آنی و مستقیم بانکی
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
            بدون واسطه، کارمزد و اینماد
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-slate-400 text-sm md:text-base leading-relaxed">
          سامانه CardPay وجوه مشتریان را به صورت مستقیم به حساب‌های بانکی شما یا فروشندگان واریز کرده و با تطبیق هوشمند پیامک بانکی، پرداخت را در کسری از ثانیه تایید می‌کند.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/docs"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-6 py-3.5 rounded-2xl transition shadow-xl shadow-emerald-600/25"
          >
            <Terminal className="w-4 h-4" />
            <span>مستندات و تست وب‌سرویس REST</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-bold px-6 py-3.5 rounded-2xl transition"
          >
            <span>داشبورد مدیریت کارت‌ها</span>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-right">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">الگوریتم تفکیک هوشمند مبالغ</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              تراکنش‌های همزمان با مبالغ مشابه با افست یکتای ۱۱، ۱۲ و ۱۳ تومانی از یکدیگر متمایز شده و کد پیگیری یکتای شمسی PAY صادر می‌شود.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg">
            <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">امنیت دومرحله‌ای و ضد جعل پیامک</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              پیامک‌های دریافتی با سرشماره‌های تاییدشده اعتبارسنجی می‌شوند و هر سرخط ناشناس قبل از تایید در صف بررسی ادمین قرار می‌گیرد.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">اپلیکیشن اندروید با پوش‌نوتیفیکیشن</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              سرویس پایدار پس‌زمینه کاتلین با فیلتر هوشمند پیامک‌های بانکی و قابلیت دریافت اعلان‌های فوری از پنل مدیریت.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
