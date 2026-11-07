"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Smartphone,
  Receipt,
  MessageSquare,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  Key,
  RefreshCw,
  Copy,
  Check,
  Download,
  FlaskConical,
  ExternalLink,
  Send,
  Zap,
  Sparkles,
  Info,
  Radio,
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"cards" | "devices" | "transactions" | "sms" | "tickets" | "sandbox">("cards");
  const [adminKey, setAdminKey] = useState("super-secret-admin-key-change-me");

  // State data
  const [cards, setCards] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [senders, setSenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Card Form
  const [newCard, setNewCard] = useState({
    ownerName: "",
    cardNumber: "",
    accountNumber: "",
    bankSlug: "mehr_iran",
    bankTitle: "بانک قرض‌الحسنه مهر ایران",
    deviceId: "",
  });

  // New Device Form
  const [newDeviceName, setNewDeviceName] = useState("");

  // New Sender Form
  const [newSender, setNewSender] = useState({ senderId: "", bankSlug: "mehr_iran", description: "" });

  // Sandbox State
  const [testAmount, setTestAmount] = useState(100000); // 100,000 Tomans
  const [testCardId, setTestCardId] = useState("");
  const [createdTestTx, setCreatedTestTx] = useState<any>(null);
  const [simSender, setSimSender] = useState("B.QMEHRIRAN");
  const [simText, setSimText] = useState(`662179818703777001
1,000,050+
1405/8/16-15:46
مانده:2,420,000`);
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    "x-admin-key": adminKey,
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "cards" || activeTab === "sandbox") {
        const [cRes, dRes] = await Promise.all([
          fetch("/api/v1/admin/cards", { headers }),
          fetch("/api/v1/admin/devices", { headers }),
        ]);
        const cData = await cRes.json();
        const dData = await dRes.json();
        if (cData.success) {
          setCards(cData.data);
          if (cData.data.length > 0 && !testCardId) {
            setTestCardId(cData.data[0].id);
          }
        }
        if (dData.success) setDevices(dData.data);
      } else if (activeTab === "devices") {
        const res = await fetch("/api/v1/admin/devices", { headers });
        const data = await res.json();
        if (data.success) setDevices(data.data);
      } else if (activeTab === "transactions") {
        const res = await fetch("/api/v1/admin/transactions?type=transactions", { headers });
        const data = await res.json();
        if (data.success) setTransactions(data.data);
      } else if (activeTab === "sms") {
        const [smsRes, sndRes] = await Promise.all([
          fetch("/api/v1/admin/transactions?type=sms_logs", { headers }),
          fetch("/api/v1/admin/senders", { headers }),
        ]);
        const sData = await smsRes.json();
        const sndData = await sndRes.json();
        if (sData.success) setSmsLogs(sData.data);
        if (sndData.success) setSenders(sndData.data);
      } else if (activeTab === "tickets") {
        const res = await fetch("/api/v1/admin/transactions?type=tickets", { headers });
        const data = await res.json();
        if (data.success) setTickets(data.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/cards", {
      method: "POST",
      headers,
      body: JSON.stringify(newCard),
    });
    const data = await res.json();
    if (data.success) {
      setNewCard({
        ownerName: "",
        cardNumber: "",
        accountNumber: "",
        bankSlug: "mehr_iran",
        bankTitle: "بانک قرض‌الحسنه مهر ایران",
        deviceId: "",
      });
      loadData();
    } else {
      alert("خطا: " + data.error);
    }
  };

  const handleToggleCard = async (id: string, currentStatus: boolean) => {
    await fetch(`/api/v1/admin/cards/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ isActive: !currentStatus }),
    });
    loadData();
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm("آیا از حذف این کارت اطمینان دارید؟")) return;
    await fetch(`/api/v1/admin/cards/${id}`, { method: "DELETE", headers });
    loadData();
  };

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName) return;
    const res = await fetch("/api/v1/admin/devices", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: newDeviceName }),
    });
    const data = await res.json();
    if (data.success) {
      setNewDeviceName("");
      loadData();
    }
  };

  const handleAddSender = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/senders", {
      method: "POST",
      headers,
      body: JSON.stringify(newSender),
    });
    const data = await res.json();
    if (data.success) {
      setNewSender({ senderId: "", bankSlug: "mehr_iran", description: "" });
      loadData();
    }
  };

  const handleQuickTrustSender = async (senderId: string) => {
    await fetch("/api/v1/admin/senders", {
      method: "POST",
      headers,
      body: JSON.stringify({
        senderId,
        bankSlug: "mehr_iran",
        description: "Trusted via quick action in SMS log",
      }),
    });
    alert(`سرخط ${senderId} به لیست سرخط‌های مجاز اضافه شد.`);
    loadData();
  };

  const handleManualReconcile = async (transactionId: string) => {
    const code = prompt("شماره پیگیری یا یادداشت ادمین را وارد کنید:", "MANUAL_VERIFIED");
    if (!code) return;
    await fetch("/api/v1/admin/reconcile", {
      method: "POST",
      headers,
      body: JSON.stringify({ transactionId, trackingCode: code }),
    });
    loadData();
  };

  // Create Test Payment in Sandbox
  const handleCreateTestPayment = async () => {
    try {
      const res = await fetch("/api/v1/payment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: testAmount,
          cardId: testCardId || undefined,
          callbackUrl: window.location.origin + "/admin",
          description: "Test Transaction from Sandbox",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedTestTx(data.data);
        // Pre-fill the SMS simulator with matching amount and account
        const account = cards.find((c) => c.id === testCardId)?.accountNumber || "662179818703777001";
        setSimText(`${account}\n${data.data.payableAmountRial.toLocaleString()}+\n1405/8/16-15:46\nمانده:5,000,000`);
      } else {
        alert("خطا در ایجاد پرداخت: " + data.error);
      }
    } catch (e: any) {
      alert("خطا در ارتباط با سرور: " + e.message);
    }
  };

  // Simulate Incoming SMS
  const handleSimulateIncomingSms = async () => {
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await fetch("/api/v1/test/simulate-sms", {
        method: "POST",
        headers,
        body: JSON.stringify({
          sender: simSender,
          rawText: simText,
        }),
      });
      const data = await res.json();
      setSimResult(data);
    } catch (e: any) {
      setSimResult({ success: false, error: e.message });
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800/90 rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white">سامانه هوشمند درگاه کارت‌به‌کارت</h1>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  نسخه ۱.۰
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">مدیریت کارت‌ها، پایش پیامک‌های بانکی و اعتبارسنجی خودکار واریزی‌ها</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* APK Download Button */}
            <a
              href="/api/v1/download/apk"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20"
              title="دانلود مستقیم فایل نصب اپلیکیشن اندروید (APK)"
            >
              <Download className="w-4 h-4" />
              <span>دانلود اپلیکیشن اندروید (APK)</span>
            </a>

            {/* Admin Key */}
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="کلید ادمین"
                className="bg-transparent border-none text-slate-300 focus:outline-none font-mono text-xs w-32"
              />
            </div>

            <button
              onClick={loadData}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl text-slate-300 transition"
              title="بارگذاری مجدد اطلاعات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 border-b border-slate-800/80 pb-3 text-sm no-scrollbar">
          {[
            { id: "cards", label: "کارت‌ها و حساب‌ها", icon: CreditCard, count: cards.length },
            { id: "devices", label: "دستگاه‌های اندروید", icon: Smartphone, count: devices.length },
            { id: "sandbox", label: "لابراتوار تست ریل‌تایم (Sandbox)", icon: FlaskConical, highlight: true },
            { id: "transactions", label: "تراکنش‌ها", icon: Receipt, count: transactions.length },
            { id: "sms", label: "لاگ پیامک‌ها و سرخط‌ها", icon: MessageSquare, count: smsLogs.length },
            { id: "tickets", label: "مغایرت‌ها", icon: AlertCircle, count: tickets.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold transition text-xs md:text-sm whitespace-nowrap ${
                  active
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                    : tab.highlight
                    ? "bg-teal-950/60 text-teal-300 border border-teal-500/30 hover:bg-teal-900/50"
                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${active ? "bg-emerald-700 text-white" : "bg-slate-800 text-slate-300"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab: Real-Time Sandbox Testing Lab */}
        {activeTab === "sandbox" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Step 1: Create Test Payment Link */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-2xl flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">گام اول: ایجاد لینک پرداخت تستی</h2>
                  <p className="text-xs text-slate-400">تولید لینک پرداخت با افست خودکار (+۵ تومانی)</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">انتخاب کارت بانکی مقصد:</label>
                  <select
                    value={testCardId}
                    onChange={(e) => setTestCardId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ownerName} - {c.bankTitle} ({c.cardNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">مبلغ پایه (تومان):</label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleCreateTestPayment}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>تولید لینک پرداخت اختصاصی</span>
                </button>
              </div>

              {createdTestTx && (
                <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>لینک پرداخت ساخته شد:</span>
                    <a
                      href={createdTestTx.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-300 hover:underline"
                    >
                      <span>مشاهده صفحه پرداخت</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="text-slate-400 space-y-1 font-mono text-[11px]">
                    <div>مبلغ درخواستی: {createdTestTx.originalAmountToman.toLocaleString()} تومان</div>
                    <div>افست اعمال‌شده: +{createdTestTx.offsetToman} تومان</div>
                    <div className="text-white font-bold">مبلغ نهایی پرداختی: {createdTestTx.payableAmountToman.toLocaleString()} تومان ({createdTestTx.payableAmountRial.toLocaleString()} ریال)</div>
                    <div>شناسه: {createdTestTx.authority}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: SMS Simulator */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">گام دوم: شبیه‌سازی دریافت پیامک بانک</h2>
                  <p className="text-xs text-slate-400">تست پارسر و تطبیق آنی تراکنش با پیامک ارسالی</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">سرخط یا فرستنده پیامک:</label>
                  <input
                    type="text"
                    value={simSender}
                    onChange={(e) => setSimSender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">متن کامل پیامک بانکی (دقیقاً مانند بانک مهر ایران):</label>
                  <textarea
                    rows={4}
                    value={simText}
                    onChange={(e) => setSimText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-xs dir-ltr text-left focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSimulateIncomingSms}
                    disabled={simLoading}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {simLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>ارسال پیامک آزمایشی به درگاه</span>
                  </button>
                </div>
              </div>

              {simResult && (
                <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                  simResult.success && simResult.data?.matched
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                    : "bg-amber-950/40 border-amber-500/40 text-amber-200"
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {simResult.success && simResult.data?.matched ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>تطبیق تراکنش با موفقیت انجام شد!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span>پیامک دریافت شد ولی با تراکنشی تطبیق نیافت:</span>
                      </>
                    )}
                  </div>
                  <pre className="font-mono text-[11px] whitespace-pre-wrap dir-ltr text-left mt-1 text-slate-300">
                    {JSON.stringify(simResult.data || simResult.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 1: Cards Management */}
        {activeTab === "cards" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>تعریف کارت یا حساب جدید</span>
              </h2>
              <form onSubmit={handleAddCard} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">نام صاحب کارت (ادمین یا هنرمند)</label>
                  <input
                    type="text"
                    required
                    value={newCard.ownerName}
                    onChange={(e) => setNewCard({ ...newCard, ownerName: e.target.value })}
                    placeholder="مثال: عباس رنجبر"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">شماره کارت (۱۶ رقم)</label>
                  <input
                    type="text"
                    required
                    value={newCard.cardNumber}
                    onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                    placeholder="۶۰۳۷۹۹..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">شماره حساب (مطابق متن پیامک بانک)</label>
                  <input
                    type="text"
                    value={newCard.accountNumber}
                    onChange={(e) => setNewCard({ ...newCard, accountNumber: e.target.value })}
                    placeholder="مثال: 662179818703777001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">بانک</label>
                  <select
                    value={newCard.bankSlug}
                    onChange={(e) => setNewCard({ ...newCard, bankSlug: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="mehr_iran">بانک قرض‌الحسنه مهر ایران</option>
                    <option value="meli">بانک ملی ایران</option>
                    <option value="mellat">بانک ملت</option>
                    <option value="saman">بانک سامان</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">دستگاه اندروید متصل (اختیاری)</label>
                  <select
                    value={newCard.deviceId}
                    onChange={(e) => setNewCard({ ...newCard, deviceId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">(انتخاب دستگاه دریافت‌کننده پیامک)</option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl transition"
                >
                  ثبت کارت در سامانه
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-3">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{card.ownerName}</span>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">{card.bankTitle}</span>
                      {card.isActive ? (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> فعال
                        </span>
                      ) : (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> غیرفعال
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-emerald-400 text-sm tracking-wider dir-ltr text-right">
                      {card.cardNumber}
                    </div>
                    {card.accountNumber && (
                      <div className="text-xs text-slate-400 font-mono">
                        شماره حساب: {card.accountNumber}
                      </div>
                    )}
                    <div className="text-xs text-slate-500">
                      شناسه اختصاصی: <span className="font-mono text-slate-400">{card.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleCard(card.id, card.isActive)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition ${
                        card.isActive
                          ? "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                          : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                      }`}
                    >
                      {card.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                      title="حذف کارت"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Devices */}
        {activeTab === "devices" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>اتصال گوشی اندروید جدید</span>
              </h2>
              <form onSubmit={handleCreateDevice} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">نام گوشی یا دارنده</label>
                  <input
                    type="text"
                    required
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="مثال: گوشی ادمین یا موبایل رضا"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl transition"
                >
                  صدور کلید اتصال اختصاصی (API Key)
                </button>
              </form>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 text-slate-400">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-teal-400" />
                  راهنمای اتصال به اپلیکیشن:
                </span>
                <p className="leading-relaxed">
                  اپلیکیشن اندروید را دانلود کرده، سپس آدرس سرور (<code className="text-emerald-400">http://IP:3050</code>) و توکن هر دستگاه را در تنظیمات برنامه کپی کنید.
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              {devices.map((device) => (
                <div key={device.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-emerald-400" />
                      <span className="font-bold text-white text-sm">{device.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      آخرین اتصال: {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleTimeString("fa-IR") : "هنوز متصل نشده"}
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-500 block">Device API Key (جهت درج در اپلیکیشن اندروید):</span>
                      <span className="font-mono text-xs text-emerald-300 select-all">{device.apiKey}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(device.apiKey, device.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="کپی توکن"
                    >
                      {copiedKey === device.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Transactions */}
        {activeTab === "transactions" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">شناسه Authority</th>
                    <th className="p-3">مبلغ اصلی</th>
                    <th className="p-3">افست (+تومان)</th>
                    <th className="p-3">مبلغ نهایی پرداختی</th>
                    <th className="p-3">کارت مقصد</th>
                    <th className="p-3">وضعیت</th>
                    <th className="p-3">زمان ایجاد</th>
                    <th className="p-3">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono text-emerald-400">
                        <a href={`/pay/${tx.authority}`} target="_blank" className="hover:underline flex items-center gap-1">
                          <span>{tx.authority}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      </td>
                      <td className="p-3 font-medium text-slate-200">{Number(tx.originalAmountToman).toLocaleString()} تومان</td>
                      <td className="p-3 text-amber-400 font-bold">+{tx.offsetToman}</td>
                      <td className="p-3 font-bold text-white">{Number(tx.finalAmountToman).toLocaleString()} تومان</td>
                      <td className="p-3 text-slate-300">{tx.card?.ownerName} ({tx.card?.bankTitle})</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          tx.status === "PAID"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : tx.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-400"
                            : tx.status === "MANUALLY_VERIFIED"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{new Date(tx.createdAt).toLocaleTimeString("fa-IR")}</td>
                      <td className="p-3">
                        {tx.status === "PENDING" && (
                          <button
                            onClick={() => handleManualReconcile(tx.id)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg text-xs transition"
                          >
                            تایید دستی
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: SMS Logs */}
        {activeTab === "sms" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>سرخط‌های پیامکی مجاز (Trusted Senders)</span>
              </h2>
              <form onSubmit={handleAddSender} className="flex flex-wrap gap-3 items-center text-xs">
                <input
                  type="text"
                  required
                  placeholder="سرخط یا نام فرستنده (مثلاً B.QMEHRIRAN)"
                  value={newSender.senderId}
                  onChange={(e) => setNewSender({ ...newSender, senderId: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
                <input
                  type="text"
                  placeholder="توضیحات (اختیاری)"
                  value={newSender.description}
                  onChange={(e) => setNewSender({ ...newSender, description: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-xl transition"
                >
                  افزودن به سرخط‌های مورد اعتماد
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2">
                {senders.map((snd) => (
                  <div key={snd.id} className="bg-slate-950 border border-emerald-500/30 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
                    <span className="font-mono text-emerald-400 font-bold">{snd.senderId}</span>
                    <span className="text-slate-400">({snd.bankSlug})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-base font-bold text-white">آخرین پیامک‌های بانکی دریافتی از اپلیکیشن اندروید</h2>
              {smsLogs.map((log) => (
                <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                        {log.sender}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        log.status === "MATCHED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : log.status === "IGNORED"
                          ? "bg-slate-800 text-slate-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickTrustSender(log.sender)}
                        className="text-xs text-slate-400 hover:text-emerald-400 transition"
                      >
                        + افزودن این سرخط به مجازها
                      </button>
                      <span className="text-slate-500">{new Date(log.receivedAt).toLocaleTimeString("fa-IR")}</span>
                    </div>
                  </div>

                  <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs whitespace-pre-wrap dir-ltr text-left">
                    {log.rawText}
                  </pre>

                  {log.parsedAmountToman && (
                    <div className="flex items-center gap-4 text-slate-400">
                      <span>مبلغ پارس‌شده: <strong className="text-white">{Number(log.parsedAmountToman).toLocaleString()} تومان</strong></span>
                      {log.parsedAccount && <span>شماره حساب: <strong className="font-mono text-white">{log.parsedAccount}</strong></span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Discrepancy Tickets */}
        {activeTab === "tickets" && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white">لیست مغایرت‌ها و پرداختی‌های نیازمند پیگیری</h2>
            {tickets.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
                هیچ مغایرتی ثبت نشده است. تمام پرداخت‌ها به صورت خودکار تطبیق یافته‌اند.
              </div>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-sm">مغایرت پرداخت</span>
                    <span className="text-slate-400">{new Date(ticket.createdAt).toLocaleTimeString("fa-IR")}</span>
                  </div>
                  <p className="text-slate-300">{ticket.reason}</p>
                  {ticket.smsLog && (
                    <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-400">
                      {ticket.smsLog.rawText}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
