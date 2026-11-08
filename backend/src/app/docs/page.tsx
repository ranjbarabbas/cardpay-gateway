"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Code2,
  Terminal,
  Shield,
  Send,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Lock,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function DocsPage() {
  const [activeEndpoint, setActiveEndpoint] = useState<"request" | "verify">("request");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Playground state
  const [requestAmount, setRequestAmount] = useState(150000);
  const [requestDesc, setRequestDesc] = useState("خرید سفارش شماره ۱۰۴۲");
  const [requestCallback, setRequestCallback] = useState("https://mystore.ir/checkout/callback");
  const [liveResponse, setLiveResponse] = useState<any>(null);
  const [liveLoading, setLiveLoading] = useState(false);

  // Verify Playground state
  const [verifyAuthority, setVerifyAuthority] = useState("");
  const [verifyAmount, setVerifyAmount] = useState(150000);
  const [verifyResponse, setVerifyResponse] = useState<any>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTestRequest = async () => {
    setLiveLoading(true);
    setLiveResponse(null);
    try {
      const res = await fetch("/api/v1/payment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: requestAmount,
          callbackUrl: requestCallback,
          description: requestDesc,
        }),
      });
      const data = await res.json();
      setLiveResponse(data);
      if (data.success) {
        setVerifyAuthority(data.data.authority);
        setVerifyAmount(data.data.payableAmountToman);
      }
    } catch (e: any) {
      setLiveResponse({ success: false, error: e.message });
    } finally {
      setLiveLoading(false);
    }
  };

  const handleTestVerify = async () => {
    setVerifyLoading(true);
    setVerifyResponse(null);
    try {
      const res = await fetch("/api/v1/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authority: verifyAuthority,
          amount: verifyAmount,
        }),
      });
      const data = await res.json();
      setVerifyResponse(data);
    } catch (e: any) {
      setVerifyResponse({ success: false, error: e.message });
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-black text-lg text-white">CardPay Docs</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-slate-400 font-medium">مستندات توسعه‌دهندگان و وب‌سرویس REST</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition"
            >
              پنل مدیریت
            </Link>
            <Link
              href="/"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-600/20"
            >
              صفحه اصلی
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">فهرست وب‌سرویس‌ها</span>
            <nav className="space-y-1 text-xs">
              <button
                onClick={() => setActiveEndpoint("request")}
                className={`w-full text-right px-3.5 py-2.5 rounded-xl font-medium transition flex items-center justify-between ${
                  activeEndpoint === "request"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <span>۱. ایجاد تراکنش پرداخت</span>
                <span className="font-mono text-[10px] opacity-80">POST</span>
              </button>
              <button
                onClick={() => setActiveEndpoint("verify")}
                className={`w-full text-right px-3.5 py-2.5 rounded-xl font-medium transition flex items-center justify-between ${
                  activeEndpoint === "verify"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <span>۲. تایید و استعلام واریز</span>
                <span className="font-mono text-[10px] opacity-80">POST</span>
              </button>
            </nav>

            <div className="pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
              <span className="text-[11px] font-bold text-slate-300 block">امنیت و محدودیت‌ها:</span>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Rate Limiting: ۶۰ درخواست در دقیقه</span>
              </div>
              <div className="flex items-center gap-1.5 text-teal-400">
                <Shield className="w-3.5 h-3.5" />
                <span>احراز هویت سرخط با الگوریتم ضد جعل</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Documentation & Interactive Console */}
        <main className="lg:col-span-9 space-y-8">

          {/* Section: Request Payment */}
          {activeEndpoint === "request" && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold">
                  <span>POST</span>
                  <span className="font-mono dir-ltr">/api/v1/payment/request</span>
                </div>
                <h1 className="text-2xl font-black text-white mt-3">درخواست ایجاد تراکنش و دریافت لینک پرداخت</h1>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  با فراخوانی این متد، سیستم کارت بانکی فعال را انتخاب کرده، افست یکتا (+۱۱، +۱۲، +۱۳ تومان) را محاسبه نموده و توکن یکتای Authority به همراه لینک صفحه پرداخت هاست‌شده را برمی‌گرداند.
                </p>
              </div>

              {/* Code Snippets & Live Console in Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left: Interactive API Console */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span>کنسول تست زنده (Try It Out)</span>
                    </h2>
                    <span className="text-[10px] text-slate-500 font-mono">Live Playground</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">مبلغ درخواستی (تومان):</label>
                      <input
                        type="number"
                        value={requestAmount}
                        onChange={(e) => setRequestAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">توضیحات تراکنش (اختیاری):</label>
                      <input
                        type="text"
                        value={requestDesc}
                        onChange={(e) => setRequestDesc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">آدرس بازگشت (Callback URL):</label>
                      <input
                        type="text"
                        value={requestCallback}
                        onChange={(e) => setRequestCallback(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono dir-ltr text-left focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleTestRequest}
                      disabled={liveLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{liveLoading ? "در حال ارسال..." : "ارسال درخواست آزمایشی"}</span>
                    </button>
                  </div>

                  {liveResponse && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-slate-400">پاسخ دریافتی (JSON Response):</span>
                      <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-3 font-mono text-[11px] text-emerald-300 dir-ltr text-left overflow-x-auto max-h-60">
                        {JSON.stringify(liveResponse, null, 2)}
                      </pre>
                      {liveResponse.success && (
                        <a
                          href={liveResponse.data.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-teal-300 hover:underline pt-1"
                        >
                          <span>باز کردن لینک پرداخت در تب جدید</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Code Examples */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      <span>نمونه کد فراخوانی (cURL &amp; JS)</span>
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `curl -X POST https://your-gateway.com/api/v1/payment/request \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 100000, "callbackUrl": "https://store.ir/verify"}'`,
                          "curl"
                        )
                      }
                      className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
                    >
                      {copiedCode === "curl" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>کپی</span>
                    </button>
                  </div>

                  <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-300 dir-ltr text-left overflow-x-auto leading-relaxed">
{`// JavaScript / Node.js
const res = await fetch("https://gateway.com/api/v1/payment/request", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount: 100000, // تومان
    callbackUrl: "https://mysite.ir/checkout/callback",
    description: "Order #5821"
  })
});
const { data } = await res.json();
console.log(data.paymentUrl); // هدایت کاربر به این آدرس`}
                  </pre>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-1 text-slate-400">
                    <strong className="text-white block">نکات کلیدی:</strong>
                    <p>• سیستم به صورت خودکار افست را از ۱۱ تومان شروع و در صورت تداخل ۱ تومان اضافه می‌کند.</p>
                    <p>• کد رهگیری داخلی با پیشوند <code className="text-emerald-400">PAY-1405...</code> صادر می‌شود.</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Section: Verify Payment */}
          {activeEndpoint === "verify" && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs px-3 py-1 rounded-full font-bold">
                  <span>POST</span>
                  <span className="font-mono dir-ltr">/api/v1/payment/verify</span>
                </div>
                <h1 className="text-2xl font-black text-white mt-3">اعتبارسنجی نهایی پرداخت (Verify)</h1>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  پس از واریز کاربر و بازگشت به Callback URL فروشگاه شما، با فراخوانی این متد وضعیت تراکنش را استعلام کرده و در صورت تایید، کد پیگیری و جزئیات تسویه را دریافت نمایید.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left: Console */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-teal-400" />
                    <span>تست استعلام تراکنش</span>
                  </h2>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">شناسه پرداخت (Authority):</label>
                      <input
                        type="text"
                        placeholder="CPAY_..."
                        value={verifyAuthority}
                        onChange={(e) => setVerifyAuthority(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono dir-ltr text-left focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">مبلغ پرداختی جهت راستی‌آزمایی (تومان):</label>
                      <input
                        type="number"
                        value={verifyAmount}
                        onChange={(e) => setVerifyAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleTestVerify}
                      disabled={verifyLoading}
                      className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{verifyLoading ? "در حال استعلام..." : "استعلام وضعیت پرداخت"}</span>
                    </button>
                  </div>

                  {verifyResponse && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-slate-400">نتیجه تایید:</span>
                      <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-3 font-mono text-[11px] text-teal-300 dir-ltr text-left overflow-x-auto max-h-60">
                        {JSON.stringify(verifyResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Right: Code */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-teal-400" />
                    <span>نمونه کد اعتبارسنجی سرور به سرور</span>
                  </h2>

                  <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-300 dir-ltr text-left overflow-x-auto leading-relaxed">
{`// در کنترلر Callback سایت شما:
const verifyRes = await fetch("https://gateway.com/api/v1/payment/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    authority: req.query.authority,
    amount: orderAmount
  })
});

const result = await verifyRes.json();
if (result.success && result.status === "PAID") {
  // سفارش تایید شد
  const refCode = result.data.trackingCode;
  await markOrderAsPaid(refCode);
}`}
                  </pre>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
