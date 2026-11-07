import Link from "next/link";
import { Shield, CreditCard, Smartphone, ArrowRight, CheckCircle, Terminal } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-black text-lg text-white tracking-tight">CardPay Gateway</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-600/20"
            >
              ورود به پنل مدیریت درگاه
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3.5 py-1.5 rounded-full font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>سامانه خودکار واسط پرداخت کارت‌به‌کارت با تفکیک هوشمند مبالغ (+۵ تومان)</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
          درگاه اختصاصی پرداخت مستقیم کارت‌به‌کارت
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
            با تایید آنی از طریق پیامک بانکی
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-slate-400 text-base leading-relaxed">
          بدون نیاز به شرکت‌های واسط؛ مبالغ مشتریان به صورت مستقیم و آنی به حساب‌های معرفی‌شده ادمین یا هنرمندان واریز شده و توسط سرویس شنود پیامک اندروید در لحظه تایید می‌شود.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-3 rounded-2xl transition shadow-xl shadow-emerald-600/25"
          >
            <span>مدیریت کارت‌ها و تراکنش‌ها</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-right">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">تخصیص یکتای مبلغ (+۵ تومان)</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              تراکنش‌های همزمان با مبالغ مشابه با فاصله‌های ۵ تومانی از یکدیگر متمایز می‌شوند و تا ۲۰ دقیقه از تداخل مبالغ جلوگیری می‌شود.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">پل ارتباطی اندروید (SMS Bridge)</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              اپلیکیشن نیتیو کاتلین در پس‌زمینه پیامک‌های واریز بانک مهر ایران را رصد کرده و بدون فوت وقت به سرور ارسال می‌کند.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">استاندارد درگاه پرداخت</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              سازگار با استاندارد Rest API درگاه‌های پرداخت با متدهای Request، Verify و بازگشت خودکار به Callback URL فروشگاه.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
