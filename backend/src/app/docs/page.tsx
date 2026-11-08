"use client";

import { useState, useEffect } from "react";
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
  Search,
  Command,
  Download,
  AlertTriangle,
  Smartphone,
  Bell,
  RefreshCw,
  Cpu,
  FileCode,
  Sparkles,
} from "lucide-react";

interface EndpointDoc {
  id: string;
  category: string;
  method: "POST" | "GET";
  path: string;
  title: string;
  badge?: string;
  description: string;
  auth: string;
  headers: { key: string; value: string; desc: string }[];
  params: { name: string; type: string; required: boolean; desc: string; example: string }[];
  requestSample: string;
  responseSample: string;
  statusCode: number;
}

const ENDPOINTS: EndpointDoc[] = [
  {
    id: "payment-request",
    category: "REST API Reference",
    method: "POST",
    path: "/api/v1/payment/request",
    title: "Request Payment Authority",
    badge: "Core Gateway",
    description:
      "ایجاد درخواست پرداخت جدید. این متد شناسه یکتای authority، شناسه پیگیری داخلی شمسی (PAY-YYYYMMDDXXXXXXXX) و مبلغ نهایی تفکیک‌شده با الگوریتم افست پویا (+11 تومان به بالا) را تولید کرده و لینک صفحه پرداخت را بازمی‌گرداند.",
    auth: "None (Public for checkout initiation)",
    headers: [
      { key: "Content-Type", value: "application/json", desc: "فرمت بدنه درخواست" },
      { key: "Accept", value: "application/json", desc: "فرمت پاسخ دریافتی" },
    ],
    params: [
      {
        name: "amount",
        type: "integer",
        required: true,
        desc: "مبلغ پایه فاکتور به تومان (حداقل ۱,۰۰۰ تومان)",
        example: "150000",
      },
      {
        name: "callbackUrl",
        type: "string (url)",
        required: true,
        desc: "آدرس بازگشت خریدار پس از اتمام یا لغو پرداخت در فروشگاه شما",
        example: "https://yourstore.ir/checkout/callback",
      },
      {
        name: "description",
        type: "string",
        required: false,
        desc: "توضیحات سفارش یا نام مشتری جهت نمایش در رسید پرداخت",
        example: "خرید صنایع دستی کد ۴۸۹۲",
      },
      {
        name: "cardId",
        type: "string (uuid)",
        required: false,
        desc: "شناسه کارت مشخص (در صورت عدم ارسال، کارت فعال به صورت هوشمند انتخاب می‌شود)",
        example: "optional",
      },
    ],
    requestSample: JSON.stringify(
      {
        amount: 150000,
        callbackUrl: "https://yourstore.ir/checkout/callback",
        description: "سفارش شماره ۱۰۸۴ - فروشگاه هنر هاب",
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        success: true,
        data: {
          authority: "CP-685b8fae92cf4a66a1a8ecb8",
          internalTrackingCode: "PAY-1405081748291045",
          payableAmountToman: 150011,
          originalAmountToman: 150000,
          offsetAmountToman: 11,
          reservationWindowMinutes: 20,
          expiresAt: "2026-11-08T12:27:00.000Z",
          paymentUrl: "http://localhost:3050/pay/CP-685b8fae92cf4a66a1a8ecb8",
          assignedCard: {
            bankName: "بانک قرض الحسنه مهر ایران",
            cardNumber: "6037991823456789",
            accountNumber: "662179818703777001",
            holderName: "عباس رنجبر",
          },
        },
      },
      null,
      2
    ),
    statusCode: 201,
  },
  {
    id: "payment-status",
    category: "REST API Reference",
    method: "GET",
    path: "/api/v1/payment/status/{authority}",
    title: "Check Real-Time Payment Status",
    badge: "Polling / Realtime",
    description:
      "استعلام لحظه‌ای وضعیت یک تراکنش با استفاده از شناسه authority. این متد توسط صفحه پرداخت خریدار جهت بررسی تطبیق خودکار پیامک بانکی به صورت دوره‌ای صدا زده می‌شود.",
    auth: "None (Public)",
    headers: [
      { key: "Accept", value: "application/json", desc: "فرمت پاسخ دریافتی" },
    ],
    params: [
      {
        name: "authority",
        type: "string (path)",
        required: true,
        desc: "شناسه یکتای پرداخت دریافت شده از متد request",
        example: "CP-685b8fae92cf4a66a1a8ecb8",
      },
    ],
    requestSample: "// متد GET - نیازی به بدنه ندارد\ncurl -X GET http://localhost:3050/api/v1/payment/status/CP-685b8fae92cf4a66a1a8ecb8",
    responseSample: JSON.stringify(
      {
        success: true,
        data: {
          authority: "CP-685b8fae92cf4a66a1a8ecb8",
          internalTrackingCode: "PAY-1405081748291045",
          status: "SUCCESS",
          isPaid: true,
          amountToman: 150011,
          bankTrackingCode: "TRK-9823145",
          paidAt: "2026-11-08T12:15:32.000Z",
          callbackUrl: "https://yourstore.ir/checkout/callback?authority=CP-685b8fae92cf4a66a1a8ecb8&status=OK",
        },
      },
      null,
      2
    ),
    statusCode: 200,
  },
  {
    id: "payment-verify",
    category: "REST API Reference",
    method: "POST",
    path: "/api/v1/payment/verify",
    title: "Verify & Settle Transaction",
    badge: "Merchant Settlement",
    description:
      "تایید نهایی و بررسی وریفای تراکنش در سمت بک‌اند فروشگاه پذیرنده. این متد تضمین می‌کند که تراکنش فقط یک‌بار مصرف شده و وضعیت به SETTLED تغییر می‌کند.",
    auth: "Optional Merchant Signature / Callback",
    headers: [
      { key: "Content-Type", value: "application/json", desc: "فرمت بدنه درخواست" },
    ],
    params: [
      {
        name: "authority",
        type: "string",
        required: true,
        desc: "شناسه پرداخت بازگشتی از درگاه",
        example: "CP-685b8fae92cf4a66a1a8ecb8",
      },
      {
        name: "amount",
        type: "integer",
        required: true,
        desc: "مبلغ نهایی پرداخت‌شده (تومان)",
        example: "150011",
      },
    ],
    requestSample: JSON.stringify(
      {
        authority: "CP-685b8fae92cf4a66a1a8ecb8",
        amount: 150011,
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        success: true,
        message: "تراکنش با موفقیت وریفای و تسویه شد.",
        data: {
          authority: "CP-685b8fae92cf4a66a1a8ecb8",
          internalTrackingCode: "PAY-1405081748291045",
          bankTrackingCode: "TRK-9823145",
          status: "SETTLED",
          paidAmountToman: 150011,
          verifiedAt: "2026-11-08T12:16:10.000Z",
        },
      },
      null,
      2
    ),
    statusCode: 200,
  },
  {
    id: "sms-receive",
    category: "REST API Reference",
    method: "POST",
    path: "/api/v1/sms/receive",
    title: "Ingest Bank SMS (Android Sync)",
    badge: "Internal / Android App",
    description:
      "اندپوینت دریافت مستقیم پیامک بانکی از اپلیکیشن همراه اندروید (CardPay Sync). این اندپوینت متن پیامک را توسط پارسر هوشمند تجزیه کرده و در صورت وجود سرشماره تاییدشده، تراکنش متناظر را خودکار تسویه می‌کند.",
    auth: "Device API Key (Header: x-device-key)",
    headers: [
      { key: "x-device-key", value: "dev_sec_99182345", desc: "کلید اختصاصی دستگاه ثبت‌شده" },
      { key: "Content-Type", value: "application/json", desc: "فرمت بدنه درخواست" },
    ],
    params: [
      {
        name: "sender",
        type: "string",
        required: true,
        desc: "سرشماره فرستنده پیامک (مثلاً B.QMEHRIRAN)",
        example: "B.QMEHRIRAN",
      },
      {
        name: "body",
        type: "string",
        required: true,
        desc: "متن کامل پیامک دریافت شده توسط اندروید",
        example: "662179818703777001\n1,500,110+\n1405/8/17-15:45\nمانده:1,920,000",
      },
      {
        name: "receivedAt",
        type: "string (ISO)",
        required: false,
        desc: "زمان دریافت پیامک روی دستگاه خریدار",
        example: "2026-11-08T12:15:30.000Z",
      },
    ],
    requestSample: JSON.stringify(
      {
        sender: "B.QMEHRIRAN",
        body: "662179818703777001\n1,500,110+\n1405/8/17-15:45\nمانده:1,920,000",
        receivedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        success: true,
        message: "SMS matched active transaction and verified successfully",
        data: {
          matched: true,
          authority: "CP-685b8fae92cf4a66a1a8ecb8",
          internalTrackingCode: "PAY-1405081748291045",
          amountToman: 150011,
          accountNumber: "662179818703777001",
        },
      },
      null,
      2
    ),
    statusCode: 200,
  },
];

export default function DocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDoc>(ENDPOINTS[0]);
  const [activeCodeLang, setActiveCodeLang] = useState<"curl" | "node" | "python" | "php">("curl");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Playground state for selected endpoint
  const [testPayload, setTestPayload] = useState<string>(ENDPOINTS[0].requestSample);
  const [liveResponse, setLiveResponse] = useState<any>(null);
  const [liveStatusCode, setLiveStatusCode] = useState<number | null>(null);
  const [liveLatency, setLiveLatency] = useState<number | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);

  // Sync test payload when endpoint changes
  useEffect(() => {
    setTestPayload(selectedEndpoint.requestSample);
    setLiveResponse(null);
    setLiveStatusCode(null);
    setLiveLatency(null);
  }, [selectedEndpoint]);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunPlayground = async () => {
    setLiveLoading(true);
    setLiveResponse(null);
    setLiveStatusCode(null);
    const start = performance.now();
    try {
      let url = selectedEndpoint.path;
      let options: RequestInit = {
        method: selectedEndpoint.method,
        headers: { "Content-Type": "application/json" },
      };

      if (selectedEndpoint.method === "POST") {
        options.body = testPayload;
      } else if (selectedEndpoint.id === "payment-status") {
        // Substitute path param
        url = "/api/v1/payment/status/test";
      }

      const res = await fetch(url, options);
      const latency = Math.round(performance.now() - start);
      setLiveLatency(latency);
      setLiveStatusCode(res.status);
      const json = await res.json().catch(() => ({ status: res.status, text: res.statusText }));
      setLiveResponse(json);
    } catch (e: any) {
      setLiveLatency(Math.round(performance.now() - start));
      setLiveStatusCode(500);
      setLiveResponse({ error: e.message || "Network error" });
    } finally {
      setLiveLoading(false);
    }
  };

  // Generate code snippet by language
  const getCodeSnippet = (endpoint: EndpointDoc, lang: "curl" | "node" | "python" | "php") => {
    const url = `http://localhost:3050${endpoint.path}`;
    if (lang === "curl") {
      if (endpoint.method === "GET") {
        return `curl -X GET "${url.replace("{authority}", "CP-sample-authority")}" \\\n  -H "Accept: application/json"`;
      }
      return `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '${endpoint.requestSample.replace(/\n/g, "")}'`;
    }
    if (lang === "node") {
      if (endpoint.method === "GET") {
        return `const res = await fetch("${url.replace("{authority}", "CP-sample-authority")}", {\n  headers: { "Accept": "application/json" }\n});\nconst data = await res.json();\nconsole.log(data);`;
      }
      return `const res = await fetch("${url}", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(${endpoint.requestSample})\n});\nconst data = await res.json();\nconsole.log(data);`;
    }
    if (lang === "python") {
      if (endpoint.method === "GET") {
        return `import requests\n\nurl = "${url.replace("{authority}", "CP-sample-authority")}"\nres = requests.get(url)\nprint(res.json())`;
      }
      return `import requests\n\npayload = ${endpoint.requestSample}\nres = requests.post("${url}", json=payload)\nprint(res.json())`;
    }
    if (lang === "php") {
      return `<?php\n$ch = curl_init("${url}");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${endpoint.requestSample}));\n$response = curl_exec($ch);\ncurl_close($ch);\n$data = json_decode($response, true);\nprint_r($data);`;
    }
    return "";
  };

  const filteredEndpoints = ENDPOINTS.filter(
    (ep) =>
      ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-200 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-emerald-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در متدها، پارامترها و مستندات API..."
                className="w-full bg-transparent border-0 text-white placeholder-slate-500 focus:outline-none text-sm"
              />
              <kbd className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
                ESC
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/40">
              {filteredEndpoints.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">موردی یافت نشد.</div>
              ) : (
                filteredEndpoints.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setSelectedEndpoint(ep);
                      setIsSearchOpen(false);
                    }}
                    className="w-full text-right p-3 hover:bg-slate-800/60 rounded-xl transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black font-mono px-2 py-0.5 rounded ${
                            ep.method === "POST"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="font-bold text-sm text-white group-hover:text-emerald-400 transition">
                          {ep.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-1" dir="ltr">
                        {ep.path}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition rotate-180" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top GitBook Nav Header */}
      <header className="border-b border-slate-800/80 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-40 h-16">
        <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white tracking-tight">CardPay</span>
                <span className="text-xs text-slate-400 font-medium">Docs</span>
              </div>
            </Link>

            <span className="text-slate-700">|</span>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                v1.0.0
              </span>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                GitBook Style Developer Reference
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs px-3.5 py-2 rounded-xl transition shadow-inner"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">جستجوی مستندات...</span>
              <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </button>

            <a
              href="https://github.com/ranjbarabbas/cardpay-gateway/releases/download/v1.0.0/cardpay-sync.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">دانلود APK</span>
            </a>

            <Link
              href="/admin"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md shadow-emerald-600/20"
            >
              پنل مدیریت
            </Link>
          </div>
        </div>
      </header>

      {/* Main GitBook Layout */}
      <div className="max-w-[1600px] mx-auto flex min-h-[calc(100vh-64px)]">
        {/* Left Sticky Sidebar (Navigation) */}
        <aside className="w-72 border-l border-slate-800/80 bg-[#0B0F17]/95 p-6 flex flex-col gap-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto hidden lg:flex">
          {/* Section: Overview */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              شروع کار و راهنما
            </span>
            <div className="space-y-1">
              <a
                href="#architecture"
                className="block text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition font-medium"
              >
                معماری و چرخه پرداخت
              </a>
              <a
                href="#offset-logic"
                className="block text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition font-medium"
              >
                الگوریتم آفست پویا (+11 تومان)
              </a>
              <a
                href="#android-sync"
                className="block text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition font-medium"
              >
                همگام‌ساز پیامک اندروید
              </a>
              <a
                href="#anti-fraud"
                className="block text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition font-medium"
              >
                سیستم ضد تقلب و سرشماره‌ها
              </a>
            </div>
          </div>

          {/* Section: REST Endpoints */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              متدهای وب‌سرویس REST
            </span>
            <div className="space-y-1">
              {ENDPOINTS.map((ep) => {
                const isSelected = selectedEndpoint.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => setSelectedEndpoint(ep)}
                    className={`w-full text-right px-3 py-2 rounded-xl transition text-xs font-medium flex items-center justify-between ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    <span className="truncate">{ep.title}</span>
                    <span
                      className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded ml-1 ${
                        ep.method === "POST"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-sky-500/20 text-sky-400"
                      }`}
                    >
                      {ep.method}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Environment Config Info Card */}
          <div className="mt-auto p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2 text-right">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>پیکربندی محیطی (EMAILS)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ایمیل‌های مجاز ادمین از متغیر محیطی <code className="text-emerald-300 font-mono">EMAILS</code> خوانده می‌شوند.
            </p>
          </div>
        </aside>

        {/* Center Content Column (GitBook documentation body) */}
        <main className="flex-1 p-6 md:p-10 max-w-4xl space-y-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Docs</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 rotate-180" />
            <span>{selectedEndpoint.category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 rotate-180" />
            <span className="text-emerald-400 font-semibold">{selectedEndpoint.title}</span>
          </div>

          {/* Endpoint Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-black font-mono px-3 py-1 rounded-lg border ${
                  selectedEndpoint.method === "POST"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-sky-500/10 text-sky-400 border-sky-500/30"
                }`}
              >
                {selectedEndpoint.method}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {selectedEndpoint.title}
              </h1>
            </div>

            {/* Path Box with 1-click Copy */}
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 font-mono text-xs text-slate-300 shadow-inner">
              <span className="text-emerald-400 select-all" dir="ltr">
                {selectedEndpoint.path}
              </span>
              <button
                onClick={() => handleCopy(`http://localhost:3050${selectedEndpoint.path}`, "path")}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-xs font-sans"
              >
                {copiedId === "path" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی آدرس</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed pt-2">
              {selectedEndpoint.description}
            </p>
          </div>

          {/* Callout Alert: GitBook style */}
          <div className="bg-emerald-500/5 border-r-4 border-emerald-500 border border-emerald-500/20 rounded-2xl p-4 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>نکته حیاتی برای پیاده‌سازی</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              تمامی مبالغ پرداختی توسط این متد بر اساس تومان محاسبه می‌شوند. سیستم برای جلوگیری از تداخل فاکتورهای هم‌قیمت، به ازای هر درخواست موازی مقدار آفست ۱۱، ۱۲ یا ۱۳ تومانی اضافه می‌کند و شناسه یکتای شمسی با فرمت <code className="font-mono text-emerald-300">PAY-14050817XXXXXXXX</code> صادر می‌نماید.
            </p>
          </div>

          {/* Request Headers Table */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>هدرهای درخواست (Headers)</span>
            </h3>
            <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-medium">
                  <tr>
                    <th className="py-3 px-4 font-mono">Header</th>
                    <th className="py-3 px-4 font-mono">Value</th>
                    <th className="py-3 px-4">توضیحات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {selectedEndpoint.headers.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-900/30 transition">
                      <td className="py-3 px-4 font-mono text-emerald-300" dir="ltr">
                        {h.key}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300" dir="ltr">
                        {h.value}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{h.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Parameters Table */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-teal-400" />
              <span>پارامترهای ورودی (Body Parameters)</span>
            </h3>
            <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-medium">
                  <tr>
                    <th className="py-3 px-4">پارامتر</th>
                    <th className="py-3 px-4">نوع داده</th>
                    <th className="py-3 px-4">الزام</th>
                    <th className="py-3 px-4">نمونه</th>
                    <th className="py-3 px-4">شرح کاربرد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {selectedEndpoint.params.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-900/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-white" dir="ltr">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{p.type}</td>
                      <td className="py-3 px-4">
                        {p.required ? (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                            اجباری
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                            اختیاری
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-300" dir="ltr">
                        {p.example}
                      </td>
                      <td className="py-3 px-4 text-slate-300 leading-relaxed">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deep Architectural Guides & Sections */}
          <section id="architecture" className="space-y-4 pt-8 border-t border-slate-800">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>چرخه جامع جریان داده در سیستم (Data Pipeline)</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              سیستم CardPay یک دروازه بدون واسطه P2P است. به ازای هر سفارش، کارت بانکی معتبر انتخاب و مبلغی منحصربه‌فرد رزرو می‌شود. کاربر با همراه بانک مبلغ را انتقال می‌دهد. اپلیکیشن اندروید پیامک واریز را دریافت و به وب‌سرویس ارسال می‌کند. وب‌سرویس تراکنش را تطبیق داده و به فروشگاه وب‌هوک می‌فرستد.
            </p>
            <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed" dir="ltr">
{`[Buyer Checkout] --(1. POST /payment/request)--> [CardPay Gateway]
                                                       |
[Buyer Pays Card-to-Card] <--(2. Unique Amount +11T)---+
          |
          v
[Bank Mehr Iran SMS] --(3. Broadcast)--> [Android Sync Service]
                                                 |
                                                 v
[CardPay Gateway] <--(4. POST /sms/receive)------+
          |
          +--(5. Realtime Instant Match & Settle)
          |
          v
[Merchant Webhook / Verify] --(6. Order Fulfilled)`}
            </pre>
          </section>

          <section id="offset-logic" className="space-y-4 pt-6 border-t border-slate-800">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-teal-400" />
              <span>فرمول الگوریتم آفست پویا (+11 تومان)</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              برای حذف هرگونه ابهام بین تراکنش‌های همزمان، اگر ۵ خریدار همزمان قصد پرداخت ۱۰۰,۰۰۰ تومان را داشته باشند، سیستم مبالغ را به این صورت تفکیک می‌کند:
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>خریدار اول: <span className="font-mono text-emerald-400">۱۰۰,۰۱۱ تومان</span> (آفست +11)</li>
              <li>خریدار دوم: <span className="font-mono text-emerald-400">۱۰۰,۰۱۲ تومان</span> (آفست +12)</li>
              <li>خریدار سوم: <span className="font-mono text-emerald-400">۱۰۰,۰۱۳ تومان</span> (آفست +13)</li>
              <li>بازه انقضای رزرو امن: <span className="font-mono text-emerald-400">۲۰ دقیقه</span></li>
            </ul>
          </section>

          <section id="android-sync" className="space-y-4 pt-6 border-t border-slate-800">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <span>اپلیکیشن کاتلین همگام‌ساز پیامک (CardPay Sync)</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              اپلیکیشن اندروید نیتیو وظیفه همگام‌سازی بلادرنگ پیامک‌های واریزی بدون قطعی پس‌زمینه را بر عهده دارد. دارای صفحه تنظیمات اختصاصی (آیکون ⚙️) و سرویس پیش‌زمینه پایدار است.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="https://github.com/ranjbarabbas/cardpay-gateway/releases/download/v1.0.0/cardpay-sync.apk"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20"
              >
                <Download className="w-4 h-4" />
                <span>دانلود مستقیم فایل APK (نسخه ۱.۰.۰ از گیت‌هاب)</span>
              </a>
              <Link
                href="/api/v1/download/apk"
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-4 py-2.5 rounded-xl transition"
              >
                <span>دانلود از سرور محلی Gateway</span>
              </Link>
            </div>
          </section>
        </main>

        {/* Right Sticky Column (Live Code Snippets & Interactive Playground) */}
        <aside className="w-[420px] border-r border-slate-800/80 bg-[#0B0F17]/95 p-6 flex flex-col gap-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto hidden xl:flex">
          {/* Code Snippet Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                نمونه کد فراخوانی
              </span>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono">
                {(["curl", "node", "python", "php"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveCodeLang(lang)}
                    className={`px-2 py-0.5 rounded transition ${
                      activeCodeLang === lang
                        ? "bg-emerald-600 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
              <button
                onClick={() =>
                  handleCopy(getCodeSnippet(selectedEndpoint, activeCodeLang), "code-snippet")
                }
                className="absolute top-2.5 left-2.5 p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                title="کپی کد"
              >
                {copiedId === "code-snippet" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <pre
                className="p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56 leading-relaxed"
                dir="ltr"
              >
                {getCodeSnippet(selectedEndpoint, activeCodeLang)}
              </pre>
            </div>
          </div>

          {/* Live Playground Box */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">تست زنده API (Live Playground)</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Interactive
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              شما می‌توانید درخواست را به صورت واقعی علیه سرور فعال اجرا کرده و پاسخ زنده دریافت کنید:
            </p>

            {/* Editable Request Payload */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 block">Request Payload (JSON):</label>
              <textarea
                rows={5}
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                dir="ltr"
              />
            </div>

            {/* Execute Button */}
            <button
              onClick={handleRunPlayground}
              disabled={liveLoading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20"
            >
              {liveLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال ارسال درخواست...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال درخواست تست به سرور</span>
                </>
              )}
            </button>

            {/* Live Response Box */}
            {liveResponse && (
              <div className="space-y-2 pt-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Status:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded ${
                        liveStatusCode && liveStatusCode < 300
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {liveStatusCode}
                    </span>
                  </div>
                  {liveLatency && (
                    <span className="text-slate-500">{liveLatency} ms</span>
                  )}
                </div>
                <pre
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[10px] text-slate-200 overflow-x-auto max-h-56 leading-relaxed"
                  dir="ltr"
                >
                  {JSON.stringify(liveResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
