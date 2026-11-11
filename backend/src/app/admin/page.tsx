"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  Bell,
  BookOpen,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Archive,
  RotateCcw,
  Users,
  Database,
  AlertTriangle,
  LogOut,
  Settings,
  LayoutDashboard,
  Search,
  Filter,
  UserPlus,
  Power,
  Phone,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  MessageSquareCode,
  BrainCircuit,
} from "lucide-react";
import { APP_NAME, WEB_APP_VERSION, ANDROID_APK_VERSION } from "@/lib/version";
import { toPersianDigits, formatPersianNumber } from "@/lib/persian-utils";
import {
  IRANIAN_BANKS,
  BankInfo,
  BankSmsTemplate,
  getBankByCardNumber,
  isValidIranianCardNumber,
  isValidIranianIban,
  parseBankDepositSms,
} from "@/lib/bank-utils";

type AdminTab =
  | "overview"
  | "users"
  | "cards"
  | "devices"
  | "senders"
  | "transactions"
  | "sms-formats"
  | "settings"
  | "sandbox";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [adminKey, setAdminKey] = useState("super-secret-admin-key-change-me");
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // State data
  const [cards, setCards] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [approvedSenders, setApprovedSenders] = useState<any[]>([]);
  const [pendingSenders, setPendingSenders] = useState<any[]>([]);
  const [blockedSenders, setBlockedSenders] = useState<any[]>([]);

  // Sub-tabs
  const [senderSubTab, setSenderSubTab] = useState<"approved" | "blocked" | "pending">("approved");
  const [cardSubTab, setCardSubTab] = useState<"active" | "archived">("active");
  const [txSubTab, setTxSubTab] = useState<"transactions" | "sms_logs" | "tickets">("transactions");
  const [settingsSubTab, setSettingsSubTab] = useState<"admin_card" | "sms" | "email">("admin_card");

  // Filtering & Pagination
  const [userSearch, setUserSearch] = useState("");
  const [userPlanFilter, setUserPlanFilter] = useState("ALL");
  const [txSearch, setTxSearch] = useState("");
  const [cardUserFilter, setCardUserFilter] = useState("ALL");
  const [txUserFilter, setTxUserFilter] = useState("ALL");

  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  // Settings State
  const [systemSettings, setSystemSettings] = useState<any>({
    adminCard: {
      ownerName: "هنرهاب پی (حساب رسمی مدیریت)",
      cardNumber: "6063731099887766",
      iban: "IR000000000000000000000000",
      bankTitle: "بانک قرض‌الحسنه مهر ایران",
      description: "کارت رسمی پرداخت و ارتقای اشتراک و پلن‌های هنرهاب پی",
    },
    pricing: {
      pro1MonthToman: 199000,
      pro3MonthsToman: 499000,
      pro6MonthsToman: 899000,
      special1MonthToman: 399000,
      special3MonthsToman: 999000,
      special6MonthsToman: 1799000,
    },
    sms: {
      provider: "farazsms",
      enabled: true,
      apiKey: "",
      username: "honarhub",
      password: "",
      senderNumber: "+983000505",
      patternOtp: "hnr_otp_v1",
      patternDeposit: "hnr_deposit_alert",
      depositAlertProEnabled: true,
      patternWelcome: "hnr_welcome_user",
    },
    email: {
      provider: "resend",
      enabled: true,
      apiKey: "",
      fromEmail: "notifications@honarhub.com",
      fromName: "هنرهاب پی | HonarHub Pay",
      replyTo: "support@honarhub.com",
    },
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);
  const [dbHealth, setDbHealth] = useState<{ connected: boolean; error?: string; latencyMs?: number; provider?: string } | null>(null);
  const [dbChecking, setDbChecking] = useState(false);

  // Test SMS / Email States
  const [testSmsRecipient, setTestSmsRecipient] = useState("09120000000");
  const [testSmsPattern, setTestSmsPattern] = useState("hnr_deposit_alert");
  const [testSmsLoading, setTestSmsLoading] = useState(false);
  const [testSmsResult, setTestSmsResult] = useState<any>(null);

  const [testEmailRecipient, setTestEmailRecipient] = useState("admin@honarhub.com");
  const [testEmailSubject, setTestEmailSubject] = useState("تست وب‌سرویس ایمیل هنرهاب پی");
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<any>(null);

  // User Create Modal
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    phone: "",
    email: "",
    plan: "FREE",
    role: "USER",
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);

  // User Plan & Duration Management Modal
  const [planModalUser, setPlanModalUser] = useState<any | null>(null);
  const [planModalTarget, setPlanModalTarget] = useState<string>("PRO");
  const [planModalDuration, setPlanModalDuration] = useState<number>(1);
  const [planModalNotes, setPlanModalNotes] = useState<string>("");
  const [planModalLoading, setPlanModalLoading] = useState(false);

  // Broadcast Notification Modal
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // New Card Form
  const [newCard, setNewCard] = useState({
    ownerName: "",
    cardNumber: "",
    iban: "",
    accountNumber: "",
    bankSlug: "mehr_iran",
    bankTitle: "بانک قرض‌الحسنه مهر ایران",
    deviceId: "",
    userId: "",
  });

  // Bank SMS Formats State
  const [selectedBankId, setSelectedBankId] = useState<string>("mehr-iran");
  const [bankSmsFormats, setBankSmsFormats] = useState<BankInfo[]>(IRANIAN_BANKS);
  const [activeBankCardSms, setActiveBankCardSms] = useState<string>(
    IRANIAN_BANKS[0].sampleSmsCard || ""
  );
  const [activeBankPolSms, setActiveBankPolSms] = useState<string>(
    IRANIAN_BANKS[0].sampleSmsPol || ""
  );
  const [smsFormatSaving, setSmsFormatSaving] = useState(false);
  const [smsFormatFeedback, setSmsFormatFeedback] = useState<string | null>(null);
  const [bankSearchQuery, setBankSearchQuery] = useState("");

  // Bank SMS Tester State
  const [testBankSmsText, setTestBankSmsText] = useState<string>("");
  const [testBankSmsResult, setTestBankSmsResult] = useState<any>(null);
  const [testBankSmsLoading, setTestBankSmsLoading] = useState(false);

  // Smart SMS Analysis & Templates State
  const [smartAnalysisLoading, setSmartAnalysisLoading] = useState(false);
  const [smartAnalysisResult, setSmartAnalysisResult] = useState<any>(null);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateType, setNewTemplateType] = useState<"CARD_TO_CARD" | "POL" | "PAYA" | "SIGN_BASED" | "GENERAL">("SIGN_BASED");
  const [quickSenderInput, setQuickSenderInput] = useState("");

  // New Device Form
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceUserId, setNewDeviceUserId] = useState("");

  // New Sender Form
  const [newSender, setNewSender] = useState({ senderId: "", bankSlug: "mehr_iran", description: "" });

  // Direct Push Notification Modal
  const [notifyDeviceId, setNotifyDeviceId] = useState<string | null>(null);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyLoading, setNotifyLoading] = useState(false);

  // Sandbox State
  const [testAmount, setTestAmount] = useState(100000);
  const [testCardId, setTestCardId] = useState("");
  const [createdTestTx, setCreatedTestTx] = useState<any>(null);
  const [simSender, setSimSender] = useState("B.QMEHRIRAN");
  const [simText, setSimText] = useState(`111122223333444455\n1,000,110+\n1405/8/17-14:20\nمانده:3,500,000`);
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

  const handleAdminLogout = async () => {
    await fetch("/api/v1/auth/admin", { method: "DELETE" });
    window.location.href = "/admin/login";
  };

  // Load all initial or tab data
  const loadData = async () => {
    setLoading(true);
    try {
      // Check system health & database connectivity
      const healthRes = await fetch("/api/v1/health").catch(() => null);
      if (healthRes) {
        const hData = await healthRes.json().catch(() => null);
        if (hData?.database) {
          setDbHealth(hData.database);
        }
      }

      // Load overview / core collections in parallel
      const [cRes, dRes, uRes, txRes, sRes] = await Promise.all([
        fetch("/api/v1/admin/cards", { headers }).catch(() => null),
        fetch("/api/v1/admin/devices", { headers }).catch(() => null),
        fetch("/api/v1/admin/users", { headers }).catch(() => null),
        fetch("/api/v1/admin/transactions?type=transactions", { headers }).catch(() => null),
        fetch("/api/v1/admin/settings", { headers }).catch(() => null),
      ]);

      if (cRes) {
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.success) {
            setCards(cData.data);
            if (cData.data.length > 0 && !testCardId) {
              setTestCardId(cData.data[0].id);
            }
          }
        } else {
          const errData = await cRes.json().catch(() => null);
          if (errData?.error && (errData.error.includes("پایگاه داده") || errData.error.includes("database"))) {
            setDbHealth({ connected: false, error: errData.error });
          }
        }
      }
      if (dRes?.ok) {
        const dData = await dRes.json();
        if (dData.success) setDevices(dData.data);
      }
      if (uRes?.ok) {
        const uData = await uRes.json();
        if (uData.success) setUsers(uData.data);
      }
      if (txRes?.ok) {
        const txData = await txRes.json();
        if (txData.success) setTransactions(txData.data);
      }
      if (sRes?.ok) {
        const sData = await sRes.json();
        if (sData.success) {
          setSystemSettings(sData.data);
          if (sData.dbHealth) setDbHealth(sData.dbHealth);
        }
      }

      // Load senders
      const [resApproved, resBlocked, resPending] = await Promise.all([
        fetch("/api/v1/admin/senders?status=APPROVED", { headers }).catch(() => null),
        fetch("/api/v1/admin/senders?status=REJECTED", { headers }).catch(() => null),
        fetch("/api/v1/admin/senders?status=PENDING_REVIEW", { headers }).catch(() => null),
      ]);
      if (resApproved?.ok) {
        const d = await resApproved.json();
        if (d.success) setApprovedSenders(d.data);
      }
      if (resBlocked?.ok) {
        const d = await resBlocked.json();
        if (d.success) setBlockedSenders(d.data);
      }
      if (resPending?.ok) {
        const d = await resPending.json();
        if (d.success) setPendingSenders(d.data);
      }

      // Load raw SMS & Tickets
      const [smsRes, tktRes] = await Promise.all([
        fetch("/api/v1/admin/transactions?type=sms_logs", { headers }).catch(() => null),
        fetch("/api/v1/admin/transactions?type=tickets", { headers }).catch(() => null),
      ]);
      if (smsRes?.ok) {
        const d = await smsRes.json();
        if (d.success) setSmsLogs(d.data);
      }
      if (tktRes?.ok) {
        const d = await tktRes.json();
        if (d.success) setTickets(d.data);
      }

      // Load Bank SMS Formats
      const smsFormatRes = await fetch("/api/v1/admin/sms-formats", { headers }).catch(() => null);
      if (smsFormatRes?.ok) {
        const d = await smsFormatRes.json();
        if (d.success && Array.isArray(d.data)) {
          setBankSmsFormats(d.data);
          const found = d.data.find((b: BankInfo) => b.id === selectedBankId) || d.data[0];
          if (found) {
            setActiveBankCardSms(found.sampleSmsCard || "");
            setActiveBankPolSms(found.sampleSmsPol || "");
          }
        }
      }
    } catch (err) {
      console.error("Failed to load admin dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/v1/auth/admin")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.email) {
          setAdminEmail(data.email);
          setIsAuthenticated(true);
          setAuthChecking(false);
          loadData();
        } else {
          window.location.href = "/admin/login";
        }
      })
      .catch(() => {
        window.location.href = "/admin/login";
      });
  }, []);

  // User Actions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.phone && !newUserForm.email) {
      alert("حداقل شماره تماس یا ایمیل باید مشخص شود.");
      return;
    }
    setCreateUserLoading(true);
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers,
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (data.success) {
        alert("کاربر جدید با موفقیت ایجاد گردید.");
        setShowCreateUserModal(false);
        setNewUserForm({ name: "", phone: "", email: "", plan: "FREE", role: "USER" });
        loadData();
      } else {
        alert("خطا در ایجاد کاربر: " + data.error);
      }
    } catch (err: any) {
      alert("خطای ارتباط: " + err.message);
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleOpenPlanModal = (u: any) => {
    setPlanModalUser(u);
    setPlanModalTarget(u.plan === "FREE" ? "PRO" : u.plan);
    setPlanModalDuration(u.planDurationMonths || 1);
    setPlanModalNotes("");
  };

  const handleSaveUserPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planModalUser) return;
    setPlanModalLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${planModalUser.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          plan: planModalTarget,
          durationMonths: planModalDuration,
          notes: planModalNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("پلن و مدت زمان کاربر به‌روزرسانی شد، کارت‌ها بازتنظیم شدند و پیام اطلاع‌رسانی ارسال گردید.");
        setPlanModalUser(null);
        loadData();
      } else {
        alert("خطا در تغییر پلن کاربر: " + data.error);
      }
    } catch (err: any) {
      alert("خطای ارتباط: " + err.message);
    } finally {
      setPlanModalLoading(false);
    }
  };

  const handleUpdateUserPlan = async (userId: string, newPlan: string) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ plan: newPlan, durationMonths: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert("خطا در تغییر پلن کاربر: " + data.error);
      }
    } catch (err: any) {
      alert("خطای ارتباط: " + err.message);
    }
  };

  const handleToggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u)));
      } else {
        alert("خطا: " + data.error);
      }
    } catch (err: any) {
      alert("خطای ارتباط: " + err.message);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`آیا از حذف حساب کاربر "${userName || userId}" اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        alert("خطا در حذف کاربر: " + data.error);
      }
    } catch (err: any) {
      alert("خطای ارتباط: " + err.message);
    }
  };

  // Settings Actions
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setSettingsFeedback(null);
    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers,
        body: JSON.stringify(systemSettings),
      });
      const data = await res.json();
      if (data.dbHealth) {
        setDbHealth(data.dbHealth);
      }
      if (data.success) {
        setSettingsFeedback("تنظیمات با موفقیت ذخیره و در سامانه اعمال گردید.");
        setTimeout(() => setSettingsFeedback(null), 4000);
      } else {
        alert(data.error || "خطا در ذخیره تنظیمات");
      }
    } catch (err: any) {
      alert("خطای ارتباط: " + err.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Bank SMS Formats Actions
  const reloadBankSmsFormats = async () => {
    try {
      const res = await fetch("/api/v1/admin/sms-formats", { headers });
      if (res?.ok) {
        const d = await res.json();
        if (d.success && Array.isArray(d.data)) {
          setBankSmsFormats(d.data);
        }
      }
      const resPending = await fetch("/api/v1/admin/senders?status=PENDING_REVIEW", { headers });
      if (resPending?.ok) {
        const d = await resPending.json();
        if (d.success) setPendingSenders(d.data);
      }
      const resApproved = await fetch("/api/v1/admin/senders?status=APPROVED", { headers });
      if (resApproved?.ok) {
        const d = await resApproved.json();
        if (d.success) setApprovedSenders(d.data);
      }
    } catch (err) {
      console.error("Failed to reload bank sms formats", err);
    }
  };

  const handleSelectBank = (bankId: string) => {
    setSelectedBankId(bankId);
    setSmsFormatFeedback(null);
    setTestBankSmsResult(null);
    setSmartAnalysisResult(null);
    const bank = bankSmsFormats.find((b) => b.id === bankId);
    if (bank) {
      setActiveBankCardSms(bank.sampleSmsCard || "");
      setActiveBankPolSms(bank.sampleSmsPol || "");
      const sample = bank.templates?.[0]?.sampleText || bank.sampleSmsCard || "";
      setTestBankSmsText(sample);
      setNewTemplateTitle("");
    }
  };

  const handleSaveBankSmsFormat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmsFormatSaving(true);
    setSmsFormatFeedback(null);
    try {
      const res = await fetch("/api/v1/admin/sms-formats", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "SAVE_LEGACY",
          bankId: selectedBankId,
          sampleSmsCard: activeBankCardSms,
          sampleSmsPol: activeBankPolSms,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSmsFormatFeedback("الگوی پیامک‌های بانک با موفقیت ذخیره شد.");
        await reloadBankSmsFormats();
        setTimeout(() => setSmsFormatFeedback(null), 4000);
      } else {
        alert("خطا در ذخیره الگوی پیامک: " + data.error);
      }
    } catch (err: any) {
      alert("خطای ارتباط: " + err.message);
    } finally {
      setSmsFormatSaving(false);
    }
  };

  const handleAnalyzeBankSms = async () => {
    if (!testBankSmsText.trim()) return;
    setSmartAnalysisLoading(true);
    setSmartAnalysisResult(null);
    try {
      const res = await fetch("/api/v1/admin/sms-formats/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          text: testBankSmsText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSmartAnalysisResult(data.data);
        const activeBank = bankSmsFormats.find((b) => b.id === selectedBankId);
        const bName = activeBank?.nameFa || "بانک";
        if (data.data.patternType === "SIGN_BASED") {
          setNewTemplateTitle(`الگوی واریز علامتی (+) ${bName}`);
          setNewTemplateType("SIGN_BASED");
        } else if (data.data.type === "POL" || data.data.accountOrIban?.startsWith("IR")) {
          setNewTemplateTitle(`الگوی واریز انتقال پل ${bName}`);
          setNewTemplateType("POL");
        } else {
          setNewTemplateTitle(`الگوی واریز کارت‌به‌کارت ${bName}`);
          setNewTemplateType("CARD_TO_CARD");
        }
      } else {
        alert("خطا در تحلیل هوشمند پیامک: " + (data.error || "خطای ناشناخته"));
      }
    } catch (err: any) {
      alert("خطای سرور: " + err.message);
    } finally {
      setSmartAnalysisLoading(false);
    }
  };

  const handleSaveSmartTemplate = async (status: "CONFIRMED" | "PENDING") => {
    if (!testBankSmsText.trim()) return;
    setSmsFormatSaving(true);
    setSmsFormatFeedback(null);
    try {
      const activeBank = bankSmsFormats.find((b) => b.id === selectedBankId);
      const bName = activeBank?.nameFa || "بانک";
      const title = newTemplateTitle.trim() || `${status === "CONFIRMED" ? "الگوی تایید شده" : "الگوی در انتظار"} ${bName}`;
      const res = await fetch("/api/v1/admin/sms-formats", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "SAVE_TEMPLATE",
          bankId: selectedBankId,
          template: {
            title,
            type: newTemplateType,
            sampleText: testBankSmsText.trim(),
            status,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSmsFormatFeedback(
          status === "CONFIRMED"
            ? "الگو با موفقیت تایید نهایی شد و برای اپلیکیشن موبایل و وب فعال گردید."
            : "الگو به عنوان پیش‌نویس (در انتظار تایید) ذخیره شد."
        );
        await reloadBankSmsFormats();
        setTimeout(() => setSmsFormatFeedback(null), 4000);
      } else {
        alert("خطا: " + (data.error || "عملیات ناموفق بود"));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSmsFormatSaving(false);
    }
  };

  const handleToggleTemplateStatus = async (templateId: string, currentStatus: "CONFIRMED" | "PENDING") => {
    const newStatus = currentStatus === "CONFIRMED" ? "PENDING" : "CONFIRMED";
    try {
      const res = await fetch("/api/v1/admin/sms-formats", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "UPDATE_STATUS",
          bankId: selectedBankId,
          templateId,
          newStatus,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setSmsFormatFeedback(`وضعیت الگو به «${newStatus === "CONFIRMED" ? "تایید شده" : "در انتظار"}» تغییر یافت.`);
        await reloadBankSmsFormats();
        setTimeout(() => setSmsFormatFeedback(null), 3000);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("آیا از حذف این الگوی پیامک اطمینان دارید؟")) return;
    try {
      const res = await fetch("/api/v1/admin/sms-formats", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "DELETE_TEMPLATE",
          bankId: selectedBankId,
          templateId,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setSmsFormatFeedback("الگو با موفقیت حذف شد.");
        await reloadBankSmsFormats();
        setTimeout(() => setSmsFormatFeedback(null), 3000);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddSenderForBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSenderInput.trim()) return;
    try {
      const res = await fetch("/api/v1/admin/senders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          senderId: quickSenderInput.trim(),
          bankSlug: selectedBankId,
          description: `سرخط رسمی پیامک‌های این بانک`,
          status: "APPROVED",
        }),
      });
      const d = await res.json();
      if (d.success) {
        setQuickSenderInput("");
        setSmsFormatFeedback("سرشماره با موفقیت ثبت و تایید گردید.");
        await reloadBankSmsFormats();
        setTimeout(() => setSmsFormatFeedback(null), 3000);
      } else {
        alert(d.error || "خطا در ثبت سرشماره");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprovePendingSenderForBank = async (senderId: string) => {
    try {
      const res = await fetch(`/api/v1/admin/senders/${senderId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: "APPROVED",
          bankSlug: selectedBankId,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setSmsFormatFeedback("سرشماره تایید و به این بانک متصل شد.");
        await reloadBankSmsFormats();
        setTimeout(() => setSmsFormatFeedback(null), 3000);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTestBankSmsParser = async () => {
    if (!testBankSmsText.trim()) return;
    setTestBankSmsLoading(true);
    setTestBankSmsResult(null);
    try {
      const res = await fetch("/api/v1/admin/sms-formats/test", {
        method: "POST",
        headers,
        body: JSON.stringify({
          rawText: testBankSmsText,
          bankId: selectedBankId,
        }),
      });
      const data = await res.json();
      setTestBankSmsResult(data.data || data);
    } catch (err: any) {
      setTestBankSmsResult({ success: false, error: err.message });
    } finally {
      setTestBankSmsLoading(false);
    }
  };

  const handleTestSms = async () => {
    setTestSmsLoading(true);
    setTestSmsResult(null);
    try {
      const res = await fetch("/api/v1/admin/settings/test", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "sms",
          recipient: testSmsRecipient,
          pattern: testSmsPattern,
        }),
      });
      const data = await res.json();
      setTestSmsResult(data);
    } catch (err: any) {
      setTestSmsResult({ success: false, error: err.message });
    } finally {
      setTestSmsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTestEmailLoading(true);
    setTestEmailResult(null);
    try {
      const res = await fetch("/api/v1/admin/settings/test", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "email",
          recipient: testEmailRecipient,
          subject: testEmailSubject,
        }),
      });
      const data = await res.json();
      setTestEmailResult(data);
    } catch (err: any) {
      setTestEmailResult({ success: false, error: err.message });
    } finally {
      setTestEmailLoading(false);
    }
  };

  // Card Actions
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/cards", {
      method: "POST",
      headers,
      body: JSON.stringify({ ...newCard, userId: newCard.userId || undefined }),
    });
    const data = await res.json();
    if (data.success) {
      setNewCard({
        ownerName: "",
        cardNumber: "",
        iban: "",
        accountNumber: "",
        bankSlug: "mehr_iran",
        bankTitle: "بانک قرض‌الحسنه مهر ایران",
        deviceId: "",
        userId: "",
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

  const handleArchiveCard = async (id: string) => {
    if (!confirm("آیا از آرشیو کردن این کارت مطمئن هستید؟")) return;
    await fetch(`/api/v1/admin/cards/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ isArchived: true }),
    });
    loadData();
  };

  const handleUnarchiveCard = async (id: string) => {
    await fetch(`/api/v1/admin/cards/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ isArchived: false }),
    });
    loadData();
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm("آیا از حذف دائمی این کارت مطمئن هستید؟")) return;
    await fetch(`/api/v1/admin/cards/${id}`, { method: "DELETE", headers });
    loadData();
  };

  // Device Actions
  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName) return;
    const res = await fetch("/api/v1/admin/devices", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: newDeviceName, userId: newDeviceUserId || undefined }),
    });
    const data = await res.json();
    if (data.success) {
      setNewDeviceName("");
      setNewDeviceUserId("");
      loadData();
    } else {
      alert("خطا: " + data.error);
    }
  };

  const handleToggleDevice = async (id: string, currentStatus: boolean) => {
    await fetch(`/api/v1/admin/devices/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ isActive: !currentStatus }),
    });
    loadData();
  };

  const handleBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setBroadcastLoading(true);
    try {
      const res = await fetch("/api/v1/admin/devices/broadcast", {
        method: "POST",
        headers,
        body: JSON.stringify({ title: broadcastTitle, message: broadcastMessage }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "نوتیفیکیشن همگانی با موفقیت ارسال گردید.");
        setIsBroadcastOpen(false);
        setBroadcastTitle("");
        setBroadcastMessage("");
      } else {
        alert("خطا: " + (data.error || "مشکلی رخ داد"));
      }
    } catch (e: any) {
      alert("خطای ارتباط: " + e.message);
    } finally {
      setBroadcastLoading(false);
    }
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyDeviceId || !notifyTitle || !notifyMessage) return;
    setNotifyLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/devices/${notifyDeviceId}/notify`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title: notifyTitle, message: notifyMessage }),
      });
      const data = await res.json();
      if (data.success) {
        alert("نوتیفیکیشن با موفقیت برای دستگاه ارسال شد.");
        setNotifyDeviceId(null);
        setNotifyTitle("");
        setNotifyMessage("");
      } else {
        alert("خطا: " + data.error);
      }
    } finally {
      setNotifyLoading(false);
    }
  };

  // Sender Actions
  const handleAddSender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSender.senderId) return;
    const res = await fetch("/api/v1/admin/senders", {
      method: "POST",
      headers,
      body: JSON.stringify(newSender),
    });
    const data = await res.json();
    if (data.success) {
      setNewSender({ senderId: "", bankSlug: "mehr_iran", description: "" });
      loadData();
    } else {
      alert("خطا: " + data.error);
    }
  };

  const handleApproveSender = async (id: string) => {
    await fetch(`/api/v1/admin/senders/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "APPROVED" }),
    });
    loadData();
  };

  const handleRejectSender = async (id: string) => {
    await fetch(`/api/v1/admin/senders/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "REJECTED" }),
    });
    loadData();
  };

  const handleDeleteSender = async (id: string) => {
    if (!confirm("آیا از حذف این سرشماره مطمئن هستید؟")) return;
    await fetch(`/api/v1/admin/senders/${id}`, { method: "DELETE", headers });
    loadData();
  };

  // Reconcile
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

  // Sandbox Payment
  const handleCreateTestPayment = async () => {
    try {
      const res = await fetch("/api/v1/payment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: testAmount,
          cardId: testCardId || undefined,
          callbackUrl: window.location.origin + "/admin",
          description: "تراکنش آزمایشی درگاه",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedTestTx(data.data);
        const cardObj = cards.find((c) => c.id === testCardId);
        const account = cardObj?.accountNumber || "111122223333444455";
        setSimText(`${account}\n${data.data.payableAmountRial.toLocaleString()}+\n1405/8/17-14:20\nمانده:5,000,000`);
      } else {
        alert("خطا در ایجاد پرداخت: " + data.error);
      }
    } catch (e: any) {
      alert("خطا در ارتباط: " + e.message);
    }
  };

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

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      (u.name && u.name.includes(userSearch)) ||
      (u.phone && u.phone.includes(userSearch)) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.apiKey && u.apiKey.includes(userSearch));

    const matchesPlan =
      userPlanFilter === "ALL" ||
      u.plan === userPlanFilter ||
      (userPlanFilter === "SPECIAL" && (u.plan === "SPECIAL" || u.plan === "PREMIUM"));

    return matchesSearch && matchesPlan;
  });

  const activeUsersCount = users.filter((u) => u.isActive).length;
  const proUsersCount = users.filter((u) => u.plan === "PRO").length;
  const specialUsersCount = users.filter((u) => u.plan === "SPECIAL" || u.plan === "PREMIUM").length;
  const activeCards = cards.filter((c) => !c.isArchived);
  const archivedCards = cards.filter((c) => c.isArchived);
  const filteredCards = (cardSubTab === "active" ? activeCards : archivedCards).filter((c) => {
    if (cardUserFilter === "ALL") return true;
    return c.userId === cardUserFilter || c.user?.id === cardUserFilter;
  });

  const activeDevices = devices.filter((d) => d.isActive);
  const paidTransactions = transactions.filter((t) => t.status === "PAID");
  const totalVolumeToman = paidTransactions.reduce((acc, t) => acc + Number(t.finalAmountToman || 0), 0);

  const filteredTransactions = transactions.filter((tx) => {
    if (txUserFilter === "ALL") return true;
    return (
      tx.userId === txUserFilter ||
      tx.user?.id === txUserFilter ||
      tx.card?.userId === txUserFilter ||
      tx.card?.user?.id === txUserFilter
    );
  });

  const filteredTickets = tickets.filter((tkt) => {
    if (txUserFilter === "ALL") return true;
    return (
      tkt.transaction?.userId === txUserFilter ||
      tkt.transaction?.user?.id === txUserFilter ||
      tkt.transaction?.card?.userId === txUserFilter ||
      tkt.transaction?.card?.user?.id === txUserFilter
    );
  });

  const getDeviceStatus = (device: any) => {
    if (!device.lastSeenAt) {
      return {
        label: "در انتظار اتصال اولیه",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        dot: "bg-amber-400",
        pulse: false,
      };
    }
    const diffMs = Date.now() - new Date(device.lastSeenAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins <= 5 && device.isActive) {
      return {
        label: "آنلاین و متصل",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        dot: "bg-emerald-400",
        pulse: true,
      };
    }

    let relativeTime = "";
    if (diffMins < 60) {
      relativeTime = `${toPersianDigits(Math.max(1, diffMins))} دقیقه پیش`;
    } else if (diffMins < 1440) {
      relativeTime = `${toPersianDigits(Math.floor(diffMins / 60))} ساعت پیش`;
    } else {
      relativeTime = toPersianDigits(new Date(device.lastSeenAt).toLocaleDateString("fa-IR"));
    }

    return {
      label: `قطع ارتباط (آخرین اتصال: ${relativeTime})`,
      color: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      dot: "bg-rose-400",
      pulse: false,
    };
  };

  if (authChecking || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070A0F] flex flex-col items-center justify-center text-slate-400 gap-3" dir="rtl">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-sm font-medium">در حال بررسی احراز هویت مدیریت...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/images/honarhub_pay_logo.png"
                alt={APP_NAME}
                className="h-9 w-auto object-contain group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                    نسخه وب v{WEB_APP_VERSION}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">سامانه جامع مدیریت هوشمند درگاه کارت‌به‌کارت</p>
              </div>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Database Status Indicator */}
            {dbHealth && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  dbHealth.connected
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/40 text-rose-300 animate-pulse"
                }`}
                title={dbHealth.connected ? `متصل به دیتابیس (${dbHealth.latencyMs ?? "<5"}ms)` : `خطا: ${dbHealth.error}`}
              >
                <div className={`w-2 h-2 rounded-full ${dbHealth.connected ? "bg-emerald-400" : "bg-rose-400 animate-ping"}`} />
                <span>{dbHealth.connected ? `دیتابیس: متصل (${dbHealth.latencyMs ?? "<5"}ms)` : "دیتابیس: قطع!"}</span>
              </div>
            )}

            <Link
              href="/docs"
              target="_blank"
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition border border-slate-800"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">مستندات فنی</span>
            </Link>

            <a
              href="/api/v1/download/apk"
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md shadow-emerald-600/20"
              title="دانلود مستقیم فایل نصب اپلیکیشن اندروید (APK)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود اپ اندروید (v{ANDROID_APK_VERSION})</span>
            </a>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition"
              title="تازه‌سازی اطلاعات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>

            {/* Separator before Logout */}
            <div className="h-6 w-px bg-slate-800 hidden sm:block mx-1" />

            {/* Dedicated Logout Button (Positioned at far left) */}
            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm"
              title="خروج امن از پنل مدیریت"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Database Offline Critical Alert Banner */}
        {dbHealth && !dbHealth.connected && (
          <div className="bg-rose-950/80 border-2 border-rose-500/80 text-white p-5 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black text-sm text-rose-200">
                  ⚠️ هشدار بحرانی: ارتباط با سرور پایگاه داده برقرار نیست!
                </h3>
                <p className="text-xs text-rose-300 mt-1 leading-relaxed">
                  {dbHealth.error || "سرور دیتابیس در دسترس نیست. لطفاً اتصال سرور پایگاه داده در کولیفای (کانتینر PostgreSQL) و متغیر DATABASE_URL را بررسی فرمایید."}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                setDbChecking(true);
                try {
                  const res = await fetch("/api/v1/health");
                  const d = await res.json();
                  if (d?.database) setDbHealth(d.database);
                } finally {
                  setDbChecking(false);
                  loadData();
                }
              }}
              disabled={dbChecking}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shrink-0 flex items-center gap-2 shadow"
            >
              <RefreshCw className={`w-4 h-4 ${dbChecking ? "animate-spin" : ""}`} />
              <span>{dbChecking ? "در حال بررسی..." : "تلاش مجدد اتصال دیتابیس"}</span>
            </button>
          </div>
        )}

        {/* Modern Segmented Navigation Tabs */}
        <nav className="flex overflow-x-auto gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-xl no-scrollbar">
          {[
            { id: "overview", label: "داشبورد و آمار", icon: LayoutDashboard },
            { id: "users", label: "مدیریت کاربران", icon: Users, count: users.length, badgeColor: "bg-emerald-500/20 text-emerald-300" },
            { id: "cards", label: "کارت‌های بانکی", icon: CreditCard, count: activeCards.length },
            { id: "devices", label: "دستگاه‌های اندروید", icon: Smartphone, count: devices.length },
            { id: "senders", label: "سرشماره‌های بانکی", icon: ShieldCheck, count: pendingSenders.length, alert: pendingSenders.length > 0 },
            { id: "transactions", label: "تراکنش‌ها و مغایرت", icon: Receipt, count: transactions.length },
            { id: "sms-formats", label: "فرمت پیامک‌های بانکی", icon: MessageSquareCode, count: IRANIAN_BANKS.length },
            { id: "settings", label: "تنظیمات سامانه و مبالغ", icon: Settings },
            { id: "sandbox", label: "شبیه‌ساز و لابراتوار", icon: FlaskConical },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold transition text-xs whitespace-nowrap shrink-0 ${
                  active
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 font-black"
                    : tab.alert
                    ? "bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/40 animate-pulse"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      active ? "bg-black/30 text-white" : tab.badgeColor || "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {toPersianDigits(tab.count)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* TAB 1: OVERVIEW & KPIS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>کل حجم تراکنش‌های موفق</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {formatPersianNumber(totalVolumeToman)} <span className="text-xs font-normal text-slate-400">تومان</span>
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{toPersianDigits(paidTransactions.length)} تراکنش موفق ثبت‌شده</span>
                </div>
              </div>

              <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>کاربران و پذیرندگان</span>
                  <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {toPersianDigits(users.length)} <span className="text-xs font-normal text-slate-400">کاربر</span>
                </div>
                <div className="text-[11px] text-teal-300 flex items-center gap-1">
                  <span>{toPersianDigits(activeUsersCount)} کاربر فعال</span>
                  <span className="text-slate-600">•</span>
                  <span>{toPersianDigits(proUsersCount + specialUsersCount)} کاربر پرو/VIP</span>
                </div>
              </div>

              <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>کارت‌های بانکی مقصد</span>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {toPersianDigits(activeCards.length)} <span className="text-xs font-normal text-slate-400">کارت فعال</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>{toPersianDigits(archivedCards.length)} کارت آرشیوشده امن</span>
                </div>
              </div>

              <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>دستگاه‌های همگام‌ساز</span>
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                    <Smartphone className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {toPersianDigits(activeDevices.length)} <span className="text-xs font-normal text-slate-400">دستگاه آنلاین</span>
                </div>
                <div className="text-[11px] text-indigo-300 flex items-center gap-1">
                  <span>پوش‌نوتیفیکیشن فعال و آماده</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Gateway Status */}
            <div className="w-full bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>وضعیت زنده هسته درگاه و ارائه‌دهندگان</span>
                </h3>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                  سیستم کاملاً پایدار (Online)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">سامانه پیامک (فراز اس‌ام‌اس):</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      systemSettings?.sms?.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                    }`}>
                      {systemSettings?.sms?.enabled ? "فعال و متصل" : "غیرفعال"}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    سرشماره ارسال: <span className="font-mono text-slate-200">{systemSettings?.sms?.senderNumber || "+983000505"}</span>
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">وب‌سرویس ایمیل (Resend):</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      systemSettings?.email?.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                    }`}>
                      {systemSettings?.email?.enabled ? "فعال و آماده" : "غیرفعال"}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    فرستنده: <span className="font-mono text-slate-200">{systemSettings?.email?.fromEmail || "notifications@honarhub.com"}</span>
                  </p>
                </div>
              </div>

              {/* Direct Shortcut Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab("users")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>مدیریت کاربران ({toPersianDigits(users.length)})</span>
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                >
                  <Settings className="w-3.5 h-3.5 text-teal-400" />
                  <span>تنظیمات ارائه‌دهندگان پیامک و ایمیل</span>
                </button>
                <button
                  onClick={() => setActiveTab("sandbox")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                  <span>آزمایشگاه تست و شبیه‌ساز</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT (مدیریت کاربران) */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              {/* Header and Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <span>مدیریت کاربران و پذیرندگان</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    مشاهده پذیرندگان، تغییر پلن تعرفه (رایگان، پرو، نامحدود)، فعال‌سازی/غیرفعال‌سازی و دسترسی به کلید وب‌سرویس
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowCreateUserModal(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>ایجاد کاربر جدید</span>
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="جستجو بر اساس نام، موبایل، ایمیل..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Plan Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto">
                  {[
                    { id: "ALL", label: "همه کاربران" },
                    { id: "FREE", label: "رایگان (FREE)" },
                    { id: "PRO", label: "حرفه‌ای (PRO)" },
                    { id: "SPECIAL", label: "نامحدود (SPECIAL)" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setUserPlanFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition text-xs ${
                        userPlanFilter === f.id
                          ? "bg-emerald-600 text-white shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users Table */}
              {filteredUsers.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-500">
                  کاربری با این مشخصات یافت نشد.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-2xl overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold">
                      <tr>
                        <th className="p-3.5">نام / عنوان</th>
                        <th className="p-3.5">اطلاعات تماس</th>
                        <th className="p-3.5">پلن تعرفه</th>
                        <th className="p-3.5">وضعیت</th>
                        <th className="p-3.5">کارت‌ها / دستگاه‌ها</th>
                        <th className="p-3.5">تراکنش‌ها</th>
                        <th className="p-3.5">کلید API (x-api-key)</th>
                        <th className="p-3.5">تاریخ عضویت</th>
                        <th className="p-3.5 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white font-sans">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                                {(u.name || "ک")[0]}
                              </div>
                              <div>
                                <div>{u.name || "کاربر هنرهاب"}</div>
                                <div className="text-[10px] text-slate-500 font-mono">ID: {u.id.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              {u.phone ? (
                                <a href={`tel:${u.phone}`} className="text-emerald-400 hover:underline block font-mono">
                                  {u.phone}
                                </a>
                              ) : null}
                              {u.email ? (
                                <a href={`mailto:${u.email}`} className="text-slate-400 hover:text-white block font-mono text-[11px]">
                                  {u.email}
                                </a>
                              ) : null}
                            </div>
                          </td>

                          {/* Plan Badge & Expiration & Modal Opener */}
                          <td className="p-3.5 font-sans">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                                    u.plan === "PRO"
                                      ? "bg-teal-500/10 text-teal-300 border-teal-500/30"
                                      : u.plan === "SPECIAL" || u.plan === "PREMIUM"
                                      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                      : "bg-slate-800 text-slate-300 border-slate-700"
                                  }`}
                                >
                                  {u.plan === "PRO"
                                    ? "حرفه‌ای (PRO)"
                                    : u.plan === "SPECIAL" || u.plan === "PREMIUM"
                                    ? "ویژه (SPECIAL)"
                                    : "پایه (FREE)"}
                                </span>
                                <button
                                  onClick={() => handleOpenPlanModal(u)}
                                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                                  title="مدیریت و تمدید اشتراک"
                                >
                                  <Settings className="w-3 h-3 text-teal-400" />
                                </button>
                              </div>
                              <div className="text-[10px] text-slate-400 font-sans">
                                {u.plan === "FREE" ? (
                                  <span>دائمی رایگان</span>
                                ) : u.planExpiresAt ? (
                                  new Date(u.planExpiresAt) > new Date() ? (
                                    <span className="text-teal-400">
                                      تا {toPersianDigits(new Date(u.planExpiresAt).toLocaleDateString("fa-IR"))}
                                    </span>
                                  ) : (
                                    <span className="text-rose-400 font-bold">منقضی شده</span>
                                  )
                                ) : (
                                  <span>بدون تاریخ انقضا</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Status Toggle */}
                          <td className="p-3.5 font-sans">
                            <button
                              onClick={() => handleToggleUserActive(u.id, u.isActive)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
                                u.isActive
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30"
                              }`}
                              title="کلیک کنید تا وضعیت کاربر تغییر کند"
                            >
                              <Power className="w-3 h-3" />
                              <span>{u.isActive ? "فعال" : "غیرفعال"}</span>
                            </button>
                          </td>

                          {/* Cards & Devices Count */}
                          <td className="p-3.5 font-sans">
                            <div className="flex items-center gap-2 text-slate-300">
                              <span className="flex items-center gap-1" title="کارت‌های بانکی فعال">
                                <CreditCard className="w-3.5 h-3.5 text-teal-400" />
                                <span>{toPersianDigits(u.activeCardsCount || 0)}</span>
                              </span>
                              {u.frozenCardsCount > 0 && (
                                <span
                                  className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold"
                                  title="کارت‌های فریز شده به دلیل سقف پلن"
                                >
                                  {toPersianDigits(u.frozenCardsCount)} فریز
                                </span>
                              )}
                              <span className="text-slate-600">|</span>
                              <span className="flex items-center gap-1" title="دستگاه‌های اندروید متصل">
                                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{toPersianDigits(u.devicesCount || 0)}</span>
                              </span>
                            </div>
                          </td>

                          {/* Transactions Count */}
                          <td className="p-3.5 font-sans text-slate-300">
                            {toPersianDigits(u.transactionsCount || 0)} تراکنش
                          </td>

                          {/* API Key */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[11px] w-fit">
                              <span className="text-emerald-400 font-mono select-all">
                                {u.apiKey ? `${u.apiKey.slice(0, 14)}...` : "—"}
                              </span>
                              {u.apiKey && (
                                <button
                                  onClick={() => copyToClipboard(u.apiKey, `key_${u.id}`)}
                                  className="text-slate-400 hover:text-white"
                                  title="کپی کلید اختصاصی کاربر"
                                >
                                  {copiedKey === `key_${u.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Registration Date */}
                          <td className="p-3.5 text-slate-500 font-sans text-[11px]">
                            {toPersianDigits(new Date(u.createdAt).toLocaleDateString("fa-IR"))}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenPlanModal(u)}
                                className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition"
                                title="مدیریت، ارتقا و تمدید پلن"
                              >
                                <Sparkles className="w-4 h-4 text-teal-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                title="حذف کاربر"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BANK CARDS */}
        {activeTab === "cards" && (
          <div className="space-y-6">
            <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <span>مدیریت کارت‌های بانکی پذیرندگان و درگاه</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    کارت‌های فعال در چرخه دریافت واریزهای کارت‌به‌کارت و پایش اتوماتیک هوشمند
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
                    <Users className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <select
                      value={cardUserFilter}
                      onChange={(e) => setCardUserFilter(e.target.value)}
                      className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL" className="bg-slate-900 text-white">همه کاربران ({toPersianDigits(cards.length)})</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                          {u.name || "کاربر"} ({u.phone || u.email || u.id.slice(0, 6)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setCardSubTab("active")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition ${
                        cardSubTab === "active" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      کارت‌های فعال ({toPersianDigits(activeCards.length)})
                    </button>
                    <button
                      onClick={() => setCardSubTab("archived")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition ${
                        cardSubTab === "archived" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      کارت‌های بایگانی‌شده ({toPersianDigits(archivedCards.length)})
                    </button>
                  </div>
                </div>
              </div>

              {/* Add New Card Form */}
              <form onSubmit={handleAddCard} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>ثبت و اتصال کارت بانکی جدید</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">نام صاحب حساب:</label>
                    <input
                      type="text"
                      placeholder="امیر رضایی"
                      value={newCard.ownerName}
                      onChange={(e) => setNewCard({ ...newCard, ownerName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400">شماره کارت ۱۶ رقمی:</label>
                      {newCard.cardNumber.length === 16 && (
                        <span className={`text-[10px] font-bold ${isValidIranianCardNumber(newCard.cardNumber).valid ? "text-emerald-400" : "text-rose-400"}`}>
                          {isValidIranianCardNumber(newCard.cardNumber).valid ? "✓ معتبر" : "✕ نامعتبر"}
                        </span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        maxLength={16}
                        placeholder="60637310..."
                        value={newCard.cardNumber}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, "");
                          const detected = getBankByCardNumber(clean);
                          setNewCard({
                            ...newCard,
                            cardNumber: clean,
                            ...(detected ? { bankTitle: detected.nameFa, bankSlug: detected.id.replace(/-/g, "_") } : {}),
                          });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400">شماره شبا (IBAN) (اختیاری):</label>
                      {newCard.iban && (
                        <span className={`text-[10px] font-bold ${isValidIranianIban(newCard.iban).valid ? "text-emerald-400" : "text-rose-400"}`}>
                          {isValidIranianIban(newCard.iban).valid ? "✓ معتبر" : "✕ نامعتبر"}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={26}
                      placeholder="IR... یا ۲۴ رقم"
                      value={newCard.iban}
                      onChange={(e) => setNewCard({ ...newCard, iban: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500 text-xs"
                      dir="ltr"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      برای مبالغ بالای ۱۵م انتقال پل تا ۲۰۰م
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">عنوان نمایشی بانک (اختیاری):</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="عنوان بانک"
                        value={newCard.bankTitle}
                        onChange={(e) => setNewCard({ ...newCard, bankTitle: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-3 pl-8 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                      />
                      {getBankByCardNumber(newCard.cardNumber) && (
                        <img
                          src={getBankByCardNumber(newCard.cardNumber)!.logo}
                          alt=""
                          className="w-4 h-4 object-contain absolute left-2 top-2.5 bg-white/10 rounded-full p-0.5"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">کاربر مالک کارت (اختیاری):</label>
                    <select
                      value={newCard.userId}
                      onChange={(e) => setNewCard({ ...newCard, userId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">سیستم عمومی / بدون کاربر</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name || "کاربر"} ({u.phone || u.email || u.id.slice(0, 6)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">دستگاه متصل برای پیامک:</label>
                    <select
                      value={newCard.deviceId}
                      onChange={(e) => setNewCard({ ...newCard, deviceId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">انتخاب دستگاه پیامک‌خوان...</option>
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.phoneModel ? `(${d.phoneModel})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن و فعال‌سازی کارت</span>
                  </button>
                </div>
              </form>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-3 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{card.ownerName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          card.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {card.isActive ? "فعال در درگاه" : "غیرفعال"}
                      </span>
                    </div>

                    {/* Associated User Badge */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
                      <Users className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>کاربر مالک: <strong className="text-white font-medium">{card.user?.name || card.user?.phone || "کاربر عمومی سیستم"}</strong></span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold tracking-wider">{card.cardNumber}</span>
                        {getBankByCardNumber(card.cardNumber)?.logo && (
                          <img
                            src={getBankByCardNumber(card.cardNumber)!.logo}
                            alt=""
                            className="w-5 h-5 object-contain bg-white/10 rounded-full p-0.5"
                          />
                        )}
                      </div>
                      {card.iban && (
                        <div className="text-sky-300 text-[11px] truncate" dir="ltr">شبا: {card.iban}</div>
                      )}
                      {card.accountNumber && (
                        <div className="text-slate-400 text-[11px]">حساب: {card.accountNumber}</div>
                      )}
                      <div className="text-slate-400 text-[11px] font-sans">
                        {card.bankTitle || getBankByCardNumber(card.cardNumber)?.nameFa || "بانک شتاب"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        onClick={() => handleToggleCard(card.id, card.isActive)}
                        className="text-slate-400 hover:text-white text-[11px]"
                      >
                        {card.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                      </button>

                      {card.isArchived ? (
                        <button
                          onClick={() => handleUnarchiveCard(card.id)}
                          className="text-amber-400 hover:text-amber-300 text-[11px]"
                        >
                          خروج از آرشیو
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchiveCard(card.id)}
                          className="text-amber-400 hover:text-amber-300 text-[11px]"
                        >
                          بایگانی کارت
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-rose-400 hover:text-rose-300 text-[11px]"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DEVICES & PUSH NOTIFICATIONS */}
        {activeTab === "devices" && (
          <div className="space-y-6">
            <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-indigo-400" />
                    <span>دستگاه‌های اندروید همگام‌ساز پیامک</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    اتصال اپلیکیشن موبایل هنرهاب پی، دریافت پوش‌نوتیفیکیشن و ارسال خودکار پیامک‌های واریز به سرور
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsBroadcastOpen(true)}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow"
                  >
                    <Bell className="w-4 h-4" />
                    <span>ارسال پوش همگانی به همه دستگاه‌ها</span>
                  </button>
                </div>
              </div>

              {/* Register Device Form */}
              <form onSubmit={handleAddDevice} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 text-xs">
                <input
                  type="text"
                  placeholder="نام دستگاه جدید (مثلاً: گوشی سامسونگ پشتیبانی #۱)"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
                <select
                  value={newDeviceUserId}
                  onChange={(e) => setNewDeviceUserId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">کاربر مالک دستگاه (اختیاری)...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || "کاربر"} ({u.phone || u.email || u.id.slice(0, 6)})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition whitespace-nowrap"
                >
                  ثبت دستگاه جدید
                </button>
              </form>

              {/* Devices Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices.map((device) => {
                  const status = getDeviceStatus(device);
                  return (
                    <div key={device.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-sm truncate">{device.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 ${status.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${status.pulse ? "animate-pulse" : ""}`} />
                          <span>{status.label}</span>
                        </span>
                      </div>

                      {/* Associated User Badge */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
                        <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>کاربر متصل: <strong className="text-white font-medium">{device.user?.name || device.user?.phone || "کاربر عمومی سیستم"}</strong></span>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                        <div className="text-slate-400">
                          کلید اتصال اپلیکیشن (API Key):
                        </div>
                        <div className="flex items-center justify-between text-indigo-300 font-mono text-[11px]">
                          <span>{device.apiKey.slice(0, 16)}...</span>
                          <button
                            onClick={() => copyToClipboard(device.apiKey, device.id)}
                            className="text-slate-400 hover:text-white"
                          >
                            {copiedKey === device.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          onClick={() => {
                            setNotifyDeviceId(device.id);
                            setNotifyTitle("");
                            setNotifyMessage("");
                          }}
                          className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 text-[11px]"
                        >
                          <Send className="w-3 h-3" />
                          <span>ارسال پوش اختصاصی</span>
                        </button>

                        <button
                          onClick={() => handleToggleDevice(device.id, device.isActive)}
                          className="text-slate-400 hover:text-white text-[11px]"
                        >
                          {device.isActive ? "غیرفعال" : "فعال‌سازی"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TRUSTED SMS SENDERS */}
        {activeTab === "senders" && (
          <div className="space-y-6">
            <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>سرشماره‌های معتبر بانکی و اعتبارسنجی پیامک</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    فقط پیامک‌های دریافتی از این سرشماره‌ها مجاز به تسویه خودکار تراکنش‌ها هستند
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setSenderSubTab("approved")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      senderSubTab === "approved" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    تاییدشده ({toPersianDigits(approvedSenders.length)})
                  </button>
                  <button
                    onClick={() => setSenderSubTab("pending")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      senderSubTab === "pending" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    در انتظار بررسی ({toPersianDigits(pendingSenders.length)})
                  </button>
                  <button
                    onClick={() => setSenderSubTab("blocked")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      senderSubTab === "blocked" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    مسدودشده ({toPersianDigits(blockedSenders.length)})
                  </button>
                </div>
              </div>

              {/* Add Sender Form */}
              <form onSubmit={handleAddSender} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 text-xs">
                <input
                  type="text"
                  placeholder="سرشماره یا نام فرستنده پیامک (مثلاً: B.QMEHRIRAN یا 982000...)"
                  value={newSender.senderId}
                  onChange={(e) => setNewSender({ ...newSender, senderId: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
                <input
                  type="text"
                  placeholder="توضیحات (مثلاً: سرخط رسمی بانک مهر ایران)"
                  value={newSender.description}
                  onChange={(e) => setNewSender({ ...newSender, description: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl transition"
                >
                  ثبت سرشماره معتبر
                </button>
              </form>

              {/* Senders List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(senderSubTab === "approved"
                  ? approvedSenders
                  : senderSubTab === "blocked"
                  ? blockedSenders
                  : pendingSenders
                ).map((sender) => (
                  <div key={sender.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white text-sm">{sender.senderId}</span>
                      <span className="text-[10px] text-slate-500 font-sans">{sender.bankSlug}</span>
                    </div>
                    {sender.description && (
                      <p className="text-xs text-slate-400">{sender.description}</p>
                    )}
                    {sender.sampleMessage && (
                      <div className="bg-slate-950 p-2 rounded-lg text-[10px] text-slate-400 font-mono line-clamp-2">
                        {sender.sampleMessage}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      {senderSubTab === "pending" && (
                        <button
                          onClick={() => handleApproveSender(sender.id)}
                          className="text-emerald-400 hover:underline font-bold"
                        >
                          تایید سرشماره
                        </button>
                      )}
                      {senderSubTab !== "blocked" && (
                        <button
                          onClick={() => handleRejectSender(sender.id)}
                          className="text-rose-400 hover:underline"
                        >
                          مسدودسازی
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSender(sender.id)}
                        className="text-slate-500 hover:text-white"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: TRANSACTIONS & RECONCILE */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-400" />
                    <span>تراکنش‌ها، لاگ پیامک‌ها و مغایرت‌ها</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    سوابق تمامی تراکنش‌های کارت‌به‌کارت و امکان تسویه دستی
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
                    <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <select
                      value={txUserFilter}
                      onChange={(e) => setTxUserFilter(e.target.value)}
                      className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL" className="bg-slate-900 text-white">همه کاربران ({toPersianDigits(transactions.length)})</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                          {u.name || "کاربر"} ({u.phone || u.email || u.id.slice(0, 6)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setTxSubTab("transactions")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition ${
                        txSubTab === "transactions" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      تراکنش‌ها ({toPersianDigits(filteredTransactions.length)})
                    </button>
                    <button
                      onClick={() => setTxSubTab("sms_logs")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition ${
                        txSubTab === "sms_logs" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      لاگ پیامک‌های خام ({toPersianDigits(smsLogs.length)})
                    </button>
                    <button
                      onClick={() => setTxSubTab("tickets")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition ${
                        txSubTab === "tickets" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      مغایرت‌ها ({toPersianDigits(filteredTickets.length)})
                    </button>
                  </div>
                </div>
              </div>

              {/* Transactions Sub-Tab */}
              {txSubTab === "transactions" && (
                <div className="border border-slate-800 rounded-2xl overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">شناسه پیگیری / لینک</th>
                        <th className="p-3">کاربر پذیرنده</th>
                        <th className="p-3">مبلغ پایه</th>
                        <th className="p-3">آفست</th>
                        <th className="p-3">مبلغ پرداختی نهایی</th>
                        <th className="p-3">وضعیت</th>
                        <th className="p-3">کارت مقصد</th>
                        <th className="p-3">کد رهگیری پیامک</th>
                        <th className="p-3">زمان</th>
                        <th className="p-3 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-900/40 transition">
                          <td className="p-3">
                            <Link
                              href={`/pay/${tx.authority}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-bold"
                            >
                              <span>{tx.internalTrackingCode || tx.authority.slice(0, 14)}</span>
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                            </Link>
                          </td>
                          <td className="p-3 font-sans text-xs">
                            <span className="text-slate-300 font-medium">
                              {tx.user?.name || tx.card?.user?.name || (tx.user?.phone ? tx.user.phone : "کاربر سیستم")}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{formatPersianNumber(tx.originalAmountToman)} ت</td>
                          <td className="p-3 text-teal-400 font-bold">+{toPersianDigits(tx.offsetToman)} ت</td>
                          <td className="p-3 text-emerald-400 font-bold">{formatPersianNumber(tx.finalAmountToman)} ت</td>
                          <td className="p-3 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tx.status === "PAID"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : tx.status === "PENDING"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                  : tx.status === "EXPIRED"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {tx.status === "PAID"
                                ? "پرداخت شده"
                                : tx.status === "PENDING"
                                ? "در انتظار"
                                : tx.status === "EXPIRED"
                                ? "منقضی شده"
                                : tx.status}
                            </span>
                          </td>
                          <td className="p-3 font-sans text-slate-400">{tx.card?.ownerName || "—"}</td>
                          <td className="p-3 text-slate-300">{tx.trackingCode || "—"}</td>
                          <td className="p-3 font-sans text-slate-500 text-[11px]">
                            {toPersianDigits(new Date(tx.createdAt).toLocaleTimeString("fa-IR"))}
                          </td>
                          <td className="p-3 text-center font-sans">
                            {tx.status === "PENDING" && (
                              <button
                                onClick={() => handleManualReconcile(tx.id)}
                                className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg hover:bg-emerald-500/20"
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
              )}

              {/* Raw SMS Logs Sub-Tab */}
              {txSubTab === "sms_logs" && (
                <div className="space-y-3">
                  {smsLogs.map((log) => (
                    <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold">{log.sender}</span>
                        <span className="text-slate-500 text-[11px]">{new Date(log.receivedAt).toLocaleString("fa-IR")}</span>
                      </div>
                      <p className="text-slate-300 whitespace-pre-line bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        {log.rawText}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tickets Sub-Tab */}
              {txSubTab === "tickets" && (
                <div className="space-y-3">
                  {filteredTickets.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-8">مغایرتی ثبت نشده است.</p>
                  ) : (
                    filteredTickets.map((tkt) => {
                      const tktUser = tkt.transaction?.user || tkt.transaction?.card?.user;
                      return (
                        <div key={tkt.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
                          <div className="flex items-center justify-between font-bold text-white">
                            <div className="flex items-center gap-2">
                              <span>{tkt.reason}</span>
                              {tktUser && (
                                <span className="text-[11px] bg-slate-950 px-2 py-0.5 rounded text-teal-400 font-normal">
                                  کاربر: {tktUser.name || tktUser.phone}
                                </span>
                              )}
                            </div>
                            <span className="text-amber-400">{tkt.status}</span>
                          </div>
                          <p className="text-slate-400">{tkt.notes}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: BANK SMS FORMATS & CBI REGISTRY (فرمت پیامک‌های بانکی) */}
        {activeTab === "sms-formats" && (
          <div className="space-y-6">
            <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <MessageSquareCode className="w-5 h-5 text-teal-400" />
                    <span>فرمت پیامک‌های بانکی و سامانه انتقال پل</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    فهرست رسمی کلیه بانک‌ها و موسسات اعتباری تحت نظارت بانک مرکزی به همراه لوگو و پیشوندهای کارت جهت پردازش هوشمند پیامک‌های واریزی کارت به کارت و پل
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-emerald-400 font-mono font-bold">
                    {toPersianDigits(bankSmsFormats.length)} بانک رسمی
                  </span>
                </div>
              </div>

              {smsFormatFeedback && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{smsFormatFeedback}</span>
                </div>
              )}

              {/* Two Column Layout: Bank Selector & Pattern Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Bank List / Search Sidebar (4 cols) */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">انتخاب بانک از فهرست:</span>
                    <span className="text-[11px] text-slate-500">لوگوی رسمی</span>
                  </div>

                  {/* Bank Search Input */}
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="جستجوی بانک، نام یا پیشوند..."
                      value={bankSearchQuery}
                      onChange={(e) => setBankSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs pr-8"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
                  </div>

                  {/* Scrollable Banks List */}
                  <div className="max-h-[560px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                    {bankSmsFormats
                      .filter((b) => {
                        if (!bankSearchQuery.trim()) return true;
                        const q = bankSearchQuery.trim().toLowerCase();
                        return (
                          b.nameFa.toLowerCase().includes(q) ||
                          b.nameEn.toLowerCase().includes(q) ||
                          b.cardPrefixes.some((p) => p.includes(q)) ||
                          b.ibanCode.some((code) => code.includes(q))
                        );
                      })
                      .map((b) => {
                        const isSelected = selectedBankId === b.id;
                        const confirmedCount = (b.templates || []).filter((t: any) => t.status === "CONFIRMED").length;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => handleSelectBank(b.id)}
                            className={`w-full text-right p-3 rounded-2xl border transition flex items-center justify-between gap-2.5 ${
                              isSelected
                                ? "bg-gradient-to-r from-teal-950/80 to-emerald-950/50 border-teal-500/60 shadow-lg text-white"
                                : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/80 text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={b.logo}
                                alt={b.nameFa}
                                className="w-7 h-7 object-contain bg-white/10 rounded-full p-0.5 shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-xs block truncate text-slate-100">{b.nameFa}</span>
                                <span className="text-[10px] text-slate-400 font-mono block truncate" dir="ltr">
                                  {b.cardPrefixes.slice(0, 2).join(", ")}
                                </span>
                              </div>
                            </div>
                            <div className="text-left shrink-0">
                              {confirmedCount > 0 ? (
                                <span className="text-[9px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded-full">
                                  ✓ {toPersianDigits(confirmedCount)} تایید شده
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 border border-slate-800">
                                  کد: {b.ibanCode[0] || "---"}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Active Bank SMS Formats Editor & Test Lab (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                  {(() => {
                    const activeBank = bankSmsFormats.find((b) => b.id === selectedBankId) || bankSmsFormats[0];
                    if (!activeBank) return null;

                    return (
                      <div className="space-y-6">
                        {/* Selected Bank Banner */}
                        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={activeBank.logo}
                              alt={activeBank.nameFa}
                              className="w-12 h-12 object-contain bg-white/10 rounded-2xl p-1.5 shadow-md"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-black text-white text-base">{activeBank.nameFa}</h3>
                                <span className="text-[11px] text-slate-400 font-sans">({activeBank.nameEn})</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <span className="text-[10px] text-slate-400">پیشوندهای کارت:</span>
                                {activeBank.cardPrefixes.map((p) => (
                                  <span
                                    key={p}
                                    className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded-md font-bold"
                                    dir="ltr"
                                  >
                                    {p}
                                  </span>
                                ))}
                                <span className="bg-sky-950/60 border border-sky-500/30 text-sky-300 font-mono text-[10px] px-2 py-0.5 rounded-md font-bold mr-1">
                                  کد شبا: {activeBank.ibanCode.join(", ")}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-emerald-400 font-mono font-bold">
                              {toPersianDigits((activeBank.templates || []).filter((t: any) => t.status === "CONFIRMED").length)} الگو تایید شده
                            </span>
                            <span className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-amber-400 font-mono font-bold">
                              {toPersianDigits((activeBank.templates || []).filter((t: any) => t.status === "PENDING").length)} در انتظار
                            </span>
                          </div>
                        </div>

                        {/* Section 1: Registered Templates */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
                            <div className="flex items-center gap-2">
                              <MessageSquareCode className="w-4 h-4 text-emerald-400" />
                              <h4 className="text-xs font-bold text-white">الگوهای ثبت‌شده برای {activeBank.nameFa}</h4>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              مورد استفاده در سرور و اپلیکیشن اندروید (بدون نیاز به آپدیت APK)
                            </span>
                          </div>

                          {(!activeBank.templates || activeBank.templates.length === 0) ? (
                            <p className="text-xs text-slate-500 py-4 text-center">
                              هنوز الگویی برای این بانک ثبت نشده است. از بخش زیر برای تحلیل و استخراج الگو استفاده فرمایید.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {activeBank.templates.map((tpl: any) => {
                                const isConfirmed = tpl.status === "CONFIRMED";
                                return (
                                  <div
                                    key={tpl.id}
                                    className={`p-4 rounded-xl border transition ${
                                      isConfirmed
                                        ? "bg-slate-950/70 border-emerald-500/30 shadow-sm"
                                        : "bg-slate-950/40 border-amber-500/30"
                                    }`}
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs text-white">{tpl.title}</span>
                                        <span
                                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                            tpl.patternType === "SIGN_BASED"
                                              ? "bg-purple-950/80 text-purple-300 border border-purple-500/30"
                                              : tpl.patternType === "KEYWORD_BASED"
                                              ? "bg-teal-950/80 text-teal-300 border border-teal-500/30"
                                              : "bg-blue-950/80 text-blue-300 border border-blue-500/30"
                                          }`}
                                        >
                                          {tpl.patternType === "SIGN_BASED"
                                            ? "واریز علامتی (+)"
                                            : tpl.patternType === "KEYWORD_BASED"
                                            ? "قالب کلیدواژه‌ای"
                                            : "قالب ترکیبی"}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {isConfirmed ? (
                                          <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                            <span>تایید نهایی شده (فعال)</span>
                                          </span>
                                        ) : (
                                          <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3 text-amber-400" />
                                            <span>در انتظار تایید ادمین</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Sample Text Box */}
                                    <pre className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                                      {tpl.sampleText}
                                    </pre>

                                    {/* Extracted preview tags */}
                                    {tpl.extractedPreview && (
                                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
                                        {tpl.extractedPreview.amountToman && (
                                          <span className="bg-slate-900 px-2 py-0.5 rounded text-emerald-400 font-mono border border-slate-800">
                                            مبلغ: {formatPersianNumber(tpl.extractedPreview.amountToman)} تومان
                                          </span>
                                        )}
                                        {tpl.extractedPreview.balanceToman && (
                                          <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 font-mono border border-slate-800">
                                            مانده: {formatPersianNumber(tpl.extractedPreview.balanceToman)} تومان
                                          </span>
                                        )}
                                        {tpl.extractedPreview.accountOrCard && (
                                          <span className="bg-slate-900 px-2 py-0.5 rounded text-sky-400 font-mono border border-slate-800" dir="ltr">
                                            حساب/کارت: {tpl.extractedPreview.accountOrCard}
                                          </span>
                                        )}
                                        {tpl.extractedPreview.trackingCode && (
                                          <span className="bg-slate-900 px-2 py-0.5 rounded text-amber-400 font-mono border border-slate-800" dir="ltr">
                                            پیگیری: {tpl.extractedPreview.trackingCode}
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 mt-2.5 text-xs">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTestBankSmsText(tpl.sampleText);
                                          handleAnalyzeBankSms();
                                        }}
                                        className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-bold text-[11px]"
                                      >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>بارگذاری در لابراتوار هوشمند</span>
                                      </button>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleTemplateStatus(tpl.id, tpl.status)}
                                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                                            isConfirmed
                                              ? "bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800"
                                              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                                          }`}
                                        >
                                          {isConfirmed ? "تغییر به در انتظار" : "تایید نهایی این الگو"}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteTemplate(tpl.id)}
                                          className="text-slate-500 hover:text-rose-400 p-1"
                                          title="حذف الگو"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Section 2: Smart Extraction & AI Engine */}
                        <div className="bg-slate-950/90 border-2 border-teal-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-teal-400" />
                              <h4 className="text-xs font-black text-white">
                                استخراج داده‌های بانکی و تشخیص الگوریتم با هوش مصنوعی
                              </h4>
                            </div>
                            <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded-full font-mono">
                              موتور هوشمند آفلاین
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            نمونه پیامک جدید یا ناشناخته را در کادر زیر قرار دهید. موتور هوشمند با تحلیل ساختار، توکن‌های عددی (+/-)، متغیرها و شباهت ساختاری با بانک‌ها، الگو را استخراج می‌کند بدون اینکه نیازی به اتصال اینترنت خارجی باشد.
                          </p>

                          {/* Quick Sample Fillers */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-slate-500">نمونه‌های سریع:</span>
                            {selectedBankId === "mehr-iran" && (
                              <button
                                type="button"
                                onClick={() => setTestBankSmsText("662179818703777001 \n1,000,000+\n1405/8/16-15:46\nمانده:1,420,000")}
                                className="text-[10px] bg-purple-950/60 border border-purple-500/30 text-purple-300 px-2 py-1 rounded-lg hover:bg-purple-900/60 font-mono"
                              >
                                پیامک واقعی مهر ایران (+)
                              </button>
                            )}
                            {activeBank.sampleSmsCard && (
                              <button
                                type="button"
                                onClick={() => setTestBankSmsText(activeBank.sampleSmsCard || "")}
                                className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-800"
                              >
                                قالب سنتی کارت‌به‌کارت
                              </button>
                            )}
                            {activeBank.sampleSmsPol && (
                              <button
                                type="button"
                                onClick={() => setTestBankSmsText(activeBank.sampleSmsPol || "")}
                                className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-800"
                              >
                                قالب انتقال پل
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            <textarea
                              rows={4}
                              value={testBankSmsText}
                              onChange={(e) => setTestBankSmsText(e.target.value)}
                              placeholder="متن پیامک جدید یا آزمایشی را اینجا قرار دهید..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500 font-sans leading-relaxed"
                            />

                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={handleAnalyzeBankSms}
                                disabled={smartAnalysisLoading || !testBankSmsText.trim()}
                                className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 hover:from-teal-500 hover:to-emerald-400 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-teal-500/20"
                              >
                                <Sparkles className={`w-4 h-4 ${smartAnalysisLoading ? "animate-spin" : ""}`} />
                                <span>{smartAnalysisLoading ? "در حال تحلیل ساختار هوشمند..." : "استخراج داده‌های بانکی و تشخیص الگوریتم با هوش مصنوعی"}</span>
                              </button>
                            </div>
                          </div>

                          {/* Smart Analysis Result Panel */}
                          {smartAnalysisResult && (
                            <div className="bg-slate-900/95 border border-teal-500/40 rounded-xl p-4 space-y-4 animate-in fade-in">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-2.5 gap-2">
                                <div className="flex items-center gap-2">
                                  {smartAnalysisResult.isDeposit ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-rose-400" />
                                  )}
                                  <span className="text-xs font-bold text-white">
                                    {smartAnalysisResult.isDeposit
                                      ? "پیامک معتبر واریزی تشخیص داده شد"
                                      : "پیامک واریزی نیست"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold bg-teal-950 border border-teal-500/40 text-teal-300 px-2.5 py-0.5 rounded-full font-mono">
                                    الگو: {smartAnalysisResult.patternType}
                                  </span>
                                </div>
                              </div>

                              {/* Pattern explanation note */}
                              {smartAnalysisResult.patternType === "SIGN_BASED" && (
                                <div className="p-3 bg-purple-950/40 border border-purple-500/30 text-purple-200 rounded-xl text-xs flex items-center gap-2">
                                  <Info className="w-4 h-4 text-purple-400 shrink-0" />
                                  <span>
                                    تشخیص الگوی علامتی (+): در این پیامک واژه «واریز» وجود ندارد اما مبلغ با علامت مثبت در خط دوم تشخیص داده شده و مانده حساب به درستی تفکیک گردید.
                                  </span>
                                </div>
                              )}

                              {/* Similarity Scores */}
                              {smartAnalysisResult.similarityScores && smartAnalysisResult.similarityScores.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="text-[11px] font-bold text-slate-300 block">شباهت ساختاری با بانک‌ها:</span>
                                  <div className="flex flex-wrap gap-2">
                                    {smartAnalysisResult.similarityScores.slice(0, 3).map((s: any) => (
                                      <span
                                        key={s.bankId}
                                        className="text-[10px] bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300"
                                      >
                                        <strong className="text-teal-400 font-mono">{toPersianDigits(s.score)}٪</strong> شباهت به {s.nameFa}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Extracted Parameters Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                                  <span className="text-[10px] text-slate-400 block mb-0.5">مبلغ واریزی (تومان):</span>
                                  <span className="font-bold text-emerald-400 font-mono text-sm">
                                    {smartAnalysisResult.amountToman ? `${formatPersianNumber(smartAnalysisResult.amountToman)} ت` : "یافت نشد"}
                                  </span>
                                </div>

                                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                                  <span className="text-[10px] text-slate-400 block mb-0.5">مبلغ به ریال:</span>
                                  <span className="font-bold text-slate-200 font-mono text-xs">
                                    {smartAnalysisResult.amountRial ? formatPersianNumber(smartAnalysisResult.amountRial) : "یافت نشد"}
                                  </span>
                                </div>

                                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                                  <span className="text-[10px] text-slate-400 block mb-0.5">مانده حساب (تومان):</span>
                                  <span className="font-bold text-sky-300 font-mono text-xs">
                                    {smartAnalysisResult.balanceToman ? `${formatPersianNumber(smartAnalysisResult.balanceToman)} ت` : "یافت نشد"}
                                  </span>
                                </div>

                                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                                  <span className="text-[10px] text-slate-400 block mb-0.5">کارت یا شماره حساب:</span>
                                  <span className="font-bold text-amber-300 font-mono text-xs" dir="ltr">
                                    {smartAnalysisResult.accountOrCard || "یافت نشد"}
                                  </span>
                                </div>
                              </div>

                              {/* Save & Confirm Form */}
                              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
                                <span className="text-xs font-bold text-white block">ثبت و تایید نهایی این الگو در سامانه:</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-1">عنوان الگو:</label>
                                    <input
                                      type="text"
                                      value={newTemplateTitle}
                                      onChange={(e) => setNewTemplateTitle(e.target.value)}
                                      placeholder="مثال: الگوی واریز علامتی بانک مهر ایران"
                                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-1">نوع ساختار پیام:</label>
                                    <select
                                      value={newTemplateType}
                                      onChange={(e) => setNewTemplateType(e.target.value as any)}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500 font-sans"
                                    >
                                      <option value="SIGN_BASED">واریز علامتی (+) بدون کلمه واریز</option>
                                      <option value="CARD_TO_CARD">واریز کارت به کارت (سحاب / شتابی)</option>
                                      <option value="POL">انتقال پل به شماره شبا</option>
                                      <option value="PAYA">انتقال پایا / ساتنا</option>
                                      <option value="GENERAL">عمومی</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveSmartTemplate("PENDING")}
                                    disabled={smsFormatSaving}
                                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-xl transition font-bold"
                                  >
                                    ذخیره به عنوان پیش‌نویس (در انتظار تایید)
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSaveSmartTemplate("CONFIRMED")}
                                    disabled={smsFormatSaving}
                                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>{smsFormatSaving ? "در حال ذخیره..." : "تایید نهایی الگو و فعال‌سازی در سامانه"}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section 3: Senders & Unknown SMS Registry */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              <h4 className="text-xs font-bold text-white">
                                سرخط‌های پیامکی این بانک ({activeBank.nameFa})
                              </h4>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              پیامک‌های دریافتی از این سرشماره‌ها با الگوهای این بانک پردازش می‌شوند
                            </span>
                          </div>

                          {/* Approved Senders Badges */}
                          <div className="space-y-2">
                            <span className="text-[10px] text-slate-400 block">سرشماره‌های تایید شده:</span>
                            <div className="flex flex-wrap items-center gap-2">
                              {approvedSenders
                                .filter((s) => {
                                  const norm = s.bankSlug?.replace(/_/g, "-") || "";
                                  return norm === activeBank.id || norm === activeBank.id.replace(/-/g, "_");
                                })
                                .map((s) => (
                                  <span
                                    key={s.id}
                                    className="bg-slate-950 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span dir="ltr">{s.senderId}</span>
                                  </span>
                                ))}
                            </div>
                          </div>

                          {/* Quick Add Sender for this bank */}
                          <form onSubmit={handleAddSenderForBank} className="flex gap-2">
                            <input
                              type="text"
                              value={quickSenderInput}
                              onChange={(e) => setQuickSenderInput(e.target.value)}
                              placeholder="افزودن سرخط جدید (مثال: B.QMEHRIRAN یا 983000...)"
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                              dir="ltr"
                            />
                            <button
                              type="submit"
                              disabled={!quickSenderInput.trim()}
                              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                            >
                              افزودن سرخط
                            </button>
                          </form>

                          {/* Pending Senders with similarity match to this bank */}
                          {(() => {
                            const matchingPending = pendingSenders.filter((s) => {
                              const norm = s.bankSlug?.replace(/_/g, "-") || "";
                              const suggested = s.smartSuggestion?.suggestedBank?.replace(/_/g, "-") || "";
                              return (
                                norm === activeBank.id ||
                                norm === activeBank.id.replace(/-/g, "_") ||
                                suggested === activeBank.id ||
                                suggested === activeBank.id.replace(/-/g, "_")
                              );
                            });

                            if (matchingPending.length === 0) return null;

                            return (
                              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>سرخط‌های ناشناخته با شباهت ساختاری به این بانک:</span>
                                </span>

                                <div className="space-y-2">
                                  {matchingPending.map((p) => {
                                    const score = p.smartSuggestion?.similarityScores?.[0]?.score || 90;
                                    return (
                                      <div
                                        key={p.id}
                                        className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                      >
                                        <div className="space-y-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-amber-300 text-xs" dir="ltr">
                                              {p.senderId}
                                            </span>
                                            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                                              {toPersianDigits(score)}٪ شباهت ساختاری
                                            </span>
                                          </div>
                                          {p.sampleMessage && (
                                            <p className="text-[11px] text-slate-400 font-mono truncate" dir="ltr">
                                              {p.sampleMessage}
                                            </p>
                                          )}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleApprovePendingSenderForBank(p.id)}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow shrink-0"
                                        >
                                          تایید و اتصال به {activeBank.nameFa}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS (تنظیمات فراز اس‌ام‌اس و Resend) */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-teal-400" />
                    <span>تنظیمات ارائه‌دهندگان پیامک (فراز اس‌ام‌اس) و ایمیل (Resend)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    پیکربندی کلیدهای وب‌سرویس، خطوط ارسال پیامک خدماتی، الگوهای پترن و ابزار تست زنده ارسال
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveSettings}
                    disabled={settingsSaving}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>{settingsSaving ? "در حال ذخیره..." : "ذخیره تنظیمات"}</span>
                  </button>
                </div>
              </div>

              {settingsFeedback && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{settingsFeedback}</span>
                </div>
              )}

              {/* Live Infrastructure & Diagnostic Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs">
                {/* Database Connectivity */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Database className={`w-4 h-4 ${dbHealth?.connected ? "text-emerald-400" : "text-rose-400"}`} />
                    <div>
                      <span className="font-bold text-white block">پایگاه داده ({dbHealth?.provider || "PostgreSQL"})</span>
                      <span className="text-[11px] text-slate-400">
                        {dbHealth?.connected ? `متصل (${dbHealth.latencyMs ?? "<5"}ms)` : "قطع / بدون دسترسی"}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    dbHealth?.connected ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300 animate-pulse"
                  }`}>
                    {dbHealth?.connected ? "ONLINE" : "OFFLINE"}
                  </span>
                </div>

                {/* Faraz SMS Status */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-teal-400" />
                    <div>
                      <span className="font-bold text-white block">فراز اس‌ام‌اس</span>
                      <span className="text-[11px] text-slate-400">
                        {systemSettings.sms?.apiKey && !systemSettings.sms.apiKey.includes("demo")
                          ? (systemSettings.sms.enabled ? "آماده ارسال عملیاتی" : "غیرفعال شده")
                          : "کلید API تنظیم نشده"}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    systemSettings.sms?.apiKey && !systemSettings.sms.apiKey.includes("demo") && systemSettings.sms.enabled
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}>
                    {systemSettings.sms?.apiKey && !systemSettings.sms.apiKey.includes("demo") && systemSettings.sms.enabled
                      ? "READY"
                      : "PENDING"}
                  </span>
                </div>

                {/* Resend Email Status */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sky-400" />
                    <div>
                      <span className="font-bold text-white block">سرویس ایمیل Resend</span>
                      <span className="text-[11px] text-slate-400">
                        {systemSettings.email?.apiKey && systemSettings.email.apiKey.startsWith("re_") && !systemSettings.email.apiKey.includes("demo")
                          ? (systemSettings.email.enabled ? "آماده ارسال عملیاتی" : "غیرفعال شده")
                          : "کلید API تنظیم نشده"}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    systemSettings.email?.apiKey && systemSettings.email.apiKey.startsWith("re_") && !systemSettings.email.apiKey.includes("demo") && systemSettings.email.enabled
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}>
                    {systemSettings.email?.apiKey && systemSettings.email.apiKey.startsWith("re_") && !systemSettings.email.apiKey.includes("demo") && systemSettings.email.enabled
                      ? "READY"
                      : "PENDING"}
                  </span>
                </div>
              </div>

              {/* Sub-tabs for Settings */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  onClick={() => setSettingsSubTab("admin_card")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    settingsSubTab === "admin_card"
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>کارت بانکی مدیریت و تعرفه اشتراک</span>
                </button>
                <button
                  onClick={() => setSettingsSubTab("sms")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    settingsSubTab === "sms"
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>سرویس پیامک: فراز اس‌ام‌اس (Faraz SMS)</span>
                </button>
                <button
                  onClick={() => setSettingsSubTab("email")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    settingsSubTab === "email"
                      ? "bg-teal-600 text-white shadow"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>سرویس ایمیل: Resend</span>
                </button>
              </div>

              {/* SUBTAB 0: ADMIN CARD & PRICING */}
              {settingsSubTab === "admin_card" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Admin Bank Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-bold text-white text-sm block">کارت بانکی رسمی مدیریت سامانه</span>
                        <span className="text-[11px] text-slate-400">شماره کارت مقصد جهت دریافت مبالغ ارتقای اشتراک پذیرندگان</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-slate-400 block mb-1">نام صاحب حساب مدیریت:</label>
                        <input
                          type="text"
                          value={systemSettings.adminCard?.ownerName || ""}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              adminCard: { ...systemSettings.adminCard, ownerName: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-sans"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">شماره کارت ۱۶ رقمی:</label>
                        <input
                          type="text"
                          value={systemSettings.adminCard?.cardNumber || ""}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              adminCard: { ...systemSettings.adminCard, cardNumber: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono tracking-wider"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">شماره شبا (اختیاری با IR):</label>
                        <input
                          type="text"
                          value={systemSettings.adminCard?.iban || ""}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              adminCard: { ...systemSettings.adminCard, iban: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">نام و عنوان نمایشی بانک:</label>
                        <input
                          type="text"
                          value={systemSettings.adminCard?.bankTitle || ""}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              adminCard: { ...systemSettings.adminCard, bankTitle: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-sans"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">توضیحات راهنما برای کاربران:</label>
                        <textarea
                          rows={2}
                          value={systemSettings.adminCard?.description || ""}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              adminCard: { ...systemSettings.adminCard, description: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-sans text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing Configuration */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Sparkles className="w-4 h-4 text-teal-400" />
                      <div>
                        <span className="font-bold text-white text-sm block">تعرفه پلن‌های اشتراک (تومان)</span>
                        <span className="text-[11px] text-slate-400">قیمت‌گذاری دوره‌های ۱، ۳ و ۱۲ ماهه</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                        <div className="font-bold text-teal-300">پلن حرفه‌ای (PRO) - تا ۵ کارت و ۵۰۰ تراکنش</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">۱ ماهه:</label>
                            <input
                              type="number"
                              value={systemSettings.pricing?.pro1MonthToman || 199000}
                              onChange={(e) =>
                                setSystemSettings({
                                  ...systemSettings,
                                  pricing: { ...systemSettings.pricing, pro1MonthToman: Number(e.target.value) },
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">۳ ماهه:</label>
                            <input
                              type="number"
                              value={systemSettings.pricing?.pro3MonthsToman || 499000}
                              onChange={(e) =>
                                setSystemSettings({
                                  ...systemSettings,
                                  pricing: { ...systemSettings.pricing, pro3MonthsToman: Number(e.target.value) },
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">۶ ماهه:</label>
                            <input
                              type="number"
                              value={systemSettings.pricing?.pro6MonthsToman || 899000}
                              onChange={(e) =>
                                setSystemSettings({
                                  ...systemSettings,
                                  pricing: { ...systemSettings.pricing, pro6MonthsToman: Number(e.target.value) },
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                        <div className="font-bold text-amber-300">پلن ویژه (VIP / SPECIAL) - کارت و تراکنش نامحدود</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">۱ ماهه:</label>
                            <input
                              type="number"
                              value={systemSettings.pricing?.special1MonthToman || 399000}
                              onChange={(e) =>
                                setSystemSettings({
                                  ...systemSettings,
                                  pricing: { ...systemSettings.pricing, special1MonthToman: Number(e.target.value) },
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">۳ ماهه:</label>
                            <input
                              type="number"
                              value={systemSettings.pricing?.special3MonthsToman || 999000}
                              onChange={(e) =>
                                setSystemSettings({
                                  ...systemSettings,
                                  pricing: { ...systemSettings.pricing, special3MonthsToman: Number(e.target.value) },
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">۶ ماهه:</label>
                            <input
                              type="number"
                              value={systemSettings.pricing?.special6MonthsToman || 1799000}
                              onChange={(e) =>
                                setSystemSettings({
                                  ...systemSettings,
                                  pricing: { ...systemSettings.pricing, special6MonthsToman: Number(e.target.value) },
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transfer Limits Configuration */}
                  <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <div>
                          <span className="font-bold text-white text-sm block">تنظیمات سقف مبالغ تراکنش (کارت به کارت و سامانه پل)</span>
                          <span className="text-[11px] text-slate-400">
                            مسیریابی هوشمند بین روش‌های انتقال کارت‌به‌کارت و انتقال بین‌بانکی پل با شماره شبا
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-mono">
                        هندلینگ خودکار بیزینس
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-emerald-400">۱. سقف انتقال کارت به کارت (تومان):</label>
                          <span className="font-mono text-white text-xs font-bold">
                            {formatPersianNumber(systemSettings.limits?.cardTransferLimitToman || 15000000)} تومان
                          </span>
                        </div>
                        <input
                          type="number"
                          step={1000000}
                          value={systemSettings.limits?.cardTransferLimitToman ?? 15000000}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              limits: {
                                ...(systemSettings.limits || {}),
                                cardTransferLimitToman: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          پیش‌فرض مصوب بانک مرکزی: ۱۵,۰۰۰,۰۰۰ تومان (۱۵ م). برای مبالغ بالاتر از این عدد، درگاه به صورت خودکار به درگاه سامانه پل (با شماره شبا) هدایت خواهد شد.
                        </p>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-sky-400">۲. سقف مجاز انتقال سامانه پل (تومان):</label>
                          <span className="font-mono text-white text-xs font-bold">
                            {formatPersianNumber(systemSettings.limits?.polTransferLimitToman || 100000000)} تومان
                          </span>
                        </div>
                        <input
                          type="number"
                          step={10000000}
                          max={200000000}
                          value={systemSettings.limits?.polTransferLimitToman ?? 100000000}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              limits: {
                                ...(systemSettings.limits || {}),
                                polTransferLimitToman: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                        />
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          پیش‌فرض سامانه پل: ۱۰۰,۰۰۰,۰۰۰ تومان (تا ۲۰۰ میلیون تومان امکان‌پذیر است). برای مبالغ بیش از ۱۵ م، ثبت شماره شبا در تنظیمات کارت بانکی الزامی است.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 1: FARAZ SMS */}
              {settingsSubTab === "sms" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* SMS Configuration Form */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white text-sm">پیکربندی سامانه فراز اس‌ام‌اس</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.sms.enabled}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              sms: { ...systemSettings.sms, enabled: e.target.checked },
                            })
                          }
                          className="rounded text-emerald-500 focus:ring-0"
                        />
                        <span className="text-slate-300 font-bold">فعال‌سازی ارسال پیامک</span>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-slate-400 block mb-1">نام کاربری سامانه فراز اس‌ام‌اس (Username):</label>
                        <input
                          type="text"
                          value={systemSettings.sms.username}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              sms: { ...systemSettings.sms, username: e.target.value },
                            })
                          }
                          placeholder="honarhub"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">کلمه عبور / پسورد (اختیاری در صورت استفاده از کلید وب‌سرویس):</label>
                        <input
                          type="password"
                          value={systemSettings.sms.password || ""}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              sms: { ...systemSettings.sms, password: e.target.value },
                            })
                          }
                          placeholder="••••••••"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">کلید API وب‌سرویس (API Key فراز / IPPanel):</label>
                        <input
                          type="text"
                          value={systemSettings.sms.apiKey}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              sms: { ...systemSettings.sms, apiKey: e.target.value },
                            })
                          }
                          placeholder="کلید وب‌سرویس دریافتی از منوی توسعه‌دهندگان فراز اس‌ام‌اس..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">سرشماره اختصاصی یا خدماتی ارسال پیامک:</label>
                        <input
                          type="text"
                          value={systemSettings.sms.senderNumber}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              sms: { ...systemSettings.sms, senderNumber: e.target.value },
                            })
                          }
                          placeholder="+983000505"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-3">
                        <span className="font-bold text-slate-300 block text-xs">پترن‌های پیامکی سامانه (Faraz SMS Patterns):</span>

                        {/* Pattern 1: OTP */}
                        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-slate-300 font-bold block text-[11px]">۱. پترن رمز یکبار مصرف (OTP):</label>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">متغیر: code</span>
                          </div>
                          <input
                            type="text"
                            value={systemSettings.sms.patternOtp || ""}
                            onChange={(e) =>
                              setSystemSettings({
                                ...systemSettings,
                                sms: { ...systemSettings.sms, patternOtp: e.target.value },
                              })
                            }
                            placeholder="hnr_otp_v1"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                          />
                          <p className="text-[10px] text-slate-500">برای ارسال کد تایید یکبار مصرف، تغییر رمز عبور و ورود امن با متغیر %code%.</p>
                        </div>

                        {/* Pattern 2: Deposit notification for PRO/SPECIAL with toggle */}
                        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-slate-300 font-bold block text-[11px]">۲. پترن اطلاع‌رسانی واریزی‌ها (پلن حرفه‌ای/ویژه):</label>
                            <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-mono">متغیرها: amount , track</span>
                          </div>
                          <input
                            type="text"
                            value={systemSettings.sms.patternDeposit}
                            onChange={(e) =>
                              setSystemSettings({
                                ...systemSettings,
                                sms: { ...systemSettings.sms, patternDeposit: e.target.value },
                              })
                            }
                            placeholder="hnr_deposit_alert"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                          />
                          
                          {/* Toggle for PRO Deposit Alerts */}
                          <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-slate-800/80">
                            <input
                              type="checkbox"
                              checked={systemSettings.sms.depositAlertProEnabled ?? true}
                              onChange={(e) =>
                                setSystemSettings({
                                  ...systemSettings,
                                  sms: { ...systemSettings.sms, depositAlertProEnabled: e.target.checked },
                                })
                              }
                              className="accent-emerald-500 w-4 h-4 rounded"
                            />
                            <span className="text-slate-300 text-[11px]">
                              فعال‌سازی ارسال پیامک واریزی به صاحب درگاه (پلن‌های حرفه‌ای و ویژه)
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SMS Live Tester */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white text-sm">ابزار تست زنده ارسال پیامک فراز اس‌ام‌اس</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-slate-400 block mb-1">شماره موبایل گیرنده تست:</label>
                        <input
                          type="text"
                          value={testSmsRecipient}
                          onChange={(e) => setTestSmsRecipient(e.target.value)}
                          placeholder="09120000000"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">کد پترن انتخابی:</label>
                        <input
                          type="text"
                          value={testSmsPattern}
                          onChange={(e) => setTestSmsPattern(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <button
                        onClick={handleTestSms}
                        disabled={testSmsLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition shadow flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>{testSmsLoading ? "در حال ارسال تست..." : "ارسال پیامک تستی به شماره فوق"}</span>
                      </button>

                      {testSmsResult && (
                        <div
                          className={`p-4 rounded-xl border text-xs space-y-2 ${
                            testSmsResult.success
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                          }`}
                        >
                          <div className="font-bold font-sans flex items-center gap-2">
                            {testSmsResult.success ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>ارسال پیامک تستی به سرور فراز با موفقیت انجام شد</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                <span>خطا در ارسال پیامک تستی</span>
                              </>
                            )}
                          </div>
                          {testSmsResult.success ? (
                            <div className="font-mono text-[11px] space-y-1">
                              <div>وضعیت: تحویل داده شده به وب‌سرویس فراز</div>
                              {testSmsResult.data?.gatewayTrackingId && (
                                <div>شناسه پیگیری فراز: {testSmsResult.data.gatewayTrackingId}</div>
                              )}
                              {testSmsResult.message && (
                                <p className="font-sans text-[11px] pt-1 text-emerald-200">{testSmsResult.message}</p>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] font-sans leading-relaxed space-y-1">
                              <p className="font-bold text-rose-200">علت خطا:</p>
                              <p className="bg-rose-950/60 p-2.5 rounded-lg border border-rose-500/20 text-rose-300 font-mono text-[11px]">
                                {testSmsResult.error || "خطای ناشناخته از وب‌سرویس فراز اس‌ام‌اس"}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: RESEND EMAIL */}
              {settingsSubTab === "email" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Resend Configuration Form */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-teal-400" />
                        <span className="font-bold text-white text-sm">پیکربندی سرویس ایمیل Resend</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.email.enabled}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              email: { ...systemSettings.email, enabled: e.target.checked },
                            })
                          }
                          className="rounded text-teal-500 focus:ring-0"
                        />
                        <span className="text-slate-300 font-bold">فعال‌سازی ارسال ایمیل</span>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-slate-400 block mb-1">کلید دسترسی Resend API Key (شروع با re_):</label>
                        <input
                          type="text"
                          value={systemSettings.email.apiKey}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              email: { ...systemSettings.email, apiKey: e.target.value },
                            })
                          }
                          placeholder="re_123456789..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">آدرس ایمیل فرستنده (From Email):</label>
                        <input
                          type="email"
                          value={systemSettings.email.fromEmail}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              email: { ...systemSettings.email, fromEmail: e.target.value },
                            })
                          }
                          placeholder="notifications@honarhub.com یا onboarding@resend.dev"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">نام فرستنده (Sender Display Name):</label>
                        <input
                          type="text"
                          value={systemSettings.email.fromName}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              email: { ...systemSettings.email, fromName: e.target.value },
                            })
                          }
                          placeholder="هنرهاب پی | HonarHub Pay"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">آدرس ایمیل پاسخ (Reply-To):</label>
                        <input
                          type="email"
                          value={systemSettings.email.replyTo || ""}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              email: { ...systemSettings.email, replyTo: e.target.value },
                            })
                          }
                          placeholder="support@honarhub.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resend Live Tester */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Send className="w-4 h-4 text-teal-400" />
                      <span className="font-bold text-white text-sm">ابزار تست زنده ارسال ایمیل Resend</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-slate-400 block mb-1">ایمیل گیرنده تست:</label>
                        <input
                          type="email"
                          value={testEmailRecipient}
                          onChange={(e) => setTestEmailRecipient(e.target.value)}
                          placeholder="admin@honarhub.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">موضوع ایمیل آزمایشی:</label>
                        <input
                          type="text"
                          value={testEmailSubject}
                          onChange={(e) => setTestEmailSubject(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <button
                        onClick={handleTestEmail}
                        disabled={testEmailLoading}
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl transition shadow flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>{testEmailLoading ? "در حال ارسال ایمیل..." : "ارسال ایمیل آزمایشی Resend"}</span>
                      </button>

                      {testEmailResult && (
                        <div
                          className={`p-4 rounded-xl border text-xs space-y-2 ${
                            testEmailResult.success
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                          }`}
                        >
                          <div className="font-bold font-sans flex items-center gap-2">
                            {testEmailResult.success ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>ارسال ایمیل آزمایشی به سرور Resend با موفقیت انجام شد</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                <span>خطا در ارسال ایمیل آزمایشی</span>
                              </>
                            )}
                          </div>
                          {testEmailResult.success ? (
                            <div className="font-mono text-[11px] space-y-1">
                              <div>سرویس: {testEmailResult.data?.provider || "Resend"}</div>
                              {testEmailResult.data?.resendId && (
                                <div>شناسه پیگیری Resend: {testEmailResult.data.resendId}</div>
                              )}
                              {testEmailResult.message && (
                                <p className="font-sans text-[11px] pt-1 text-emerald-200">{testEmailResult.message}</p>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] font-sans leading-relaxed space-y-1">
                              <p className="font-bold text-rose-200">علت خطا:</p>
                              <p className="bg-rose-950/60 p-2.5 rounded-lg border border-rose-500/20 text-rose-300 font-mono text-[11px]">
                                {testEmailResult.error || "عدم تایید تحویل ایمیل توسط وب‌سرویس Resend"}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: SANDBOX REAL-TIME TESTING LAB */}
        {activeTab === "sandbox" && (
          <div className="space-y-6">
            <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-amber-400" />
                  <span>شبیه‌ساز و لابراتوار تست ریل‌تایم تراکنش و پیامک بانکی</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  ایجاد تراکنش تستی، تولید پیامک شبیه‌سازی‌شده بانکی و اعتبارسنجی الگوریتم تطبیق درجا
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Step 1: Create Test Payment */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">۱</span>
                    <span>ایجاد تراکنش پرداخت آزمایشی</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-400 block mb-1">مبلغ پایه (تومان):</label>
                      <input
                        type="number"
                        value={testAmount}
                        onChange={(e) => setTestAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">کارت بانکی مقصد:</label>
                      <select
                        value={testCardId}
                        onChange={(e) => setTestCardId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      >
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.bankTitle} - {c.ownerName} ({c.cardNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleCreateTestPayment}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition shadow"
                    >
                      تولید تراکنش تستی درگاه
                    </button>

                    {createdTestTx && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 font-mono">
                        <div className="text-emerald-400 font-bold">تراکنش تستی ایجاد شد:</div>
                        <div className="text-[11px] text-slate-300">
                          مبلغ نهایی: {createdTestTx.payableAmountToman.toLocaleString()} تومان (+{createdTestTx.offsetToman} آفست)
                        </div>
                        <Link
                          href={createdTestTx.paymentUrl}
                          target="_blank"
                          className="text-teal-400 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>مشاهده صفحه پرداخت</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Simulate Bank SMS */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs">۲</span>
                    <span>شبیه‌سازی دریافت پیامک بانکی</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-400 block mb-1">سرشماره فرستنده:</label>
                      <input
                        type="text"
                        value={simSender}
                        onChange={(e) => setSimSender(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">متن خام پیامک واریز:</label>
                      <textarea
                        rows={4}
                        value={simText}
                        onChange={(e) => setSimText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs leading-relaxed"
                      />
                    </div>

                    <button
                      onClick={handleSimulateIncomingSms}
                      disabled={simLoading}
                      className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl transition shadow flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>{simLoading ? "در حال تطبیق و پردازش..." : "ارسال پیامک و اجرای الگوریتم تطبیق"}</span>
                    </button>

                    {simResult && (
                      <div
                        className={`p-4 rounded-xl border font-mono text-xs space-y-1.5 ${
                          simResult.success && simResult.data?.status === "MATCHED"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        }`}
                      >
                        <div className="font-bold font-sans">نتیجه الگوریتم تطبیق:</div>
                        <div>وضعیت: {simResult.data?.status || (simResult.success ? "MATCHED" : "FAILED")}</div>
                        {simResult.data?.matchedTransactionId && (
                          <div className="text-[11px]">شناسه تراکنش منطبق: {simResult.data.matchedTransactionId}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Create New User */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>ثبت کاربر یا پذیرنده جدید</span>
              </h3>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">نام و نام‌خانوادگی / عنوان کسب‌وکار:</label>
                <input
                  type="text"
                  placeholder="مثال: فروشگاه هنر یا امیر رضایی"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">شماره همراه:</label>
                <input
                  type="text"
                  placeholder="09121234567"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">آدرس ایمیل:</label>
                <input
                  type="email"
                  placeholder="merchant@example.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">پلن تعرفه اولیه:</label>
                <select
                  value={newUserForm.plan}
                  onChange={(e) => setNewUserForm({ ...newUserForm, plan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="FREE">پلن رایگان (FREE • ۵۰ تراکنش ماهانه • ۱ کارت)</option>
                  <option value="PRO">پلن حرفه‌ای (PRO • ۵۰۰ تراکنش ماهانه • ۵ کارت)</option>
                  <option value="SPECIAL">پلن نامحدود (SPECIAL • بدون سقف • نامحدود)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={createUserLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl transition shadow"
                >
                  {createUserLoading ? "در حال ثبت..." : "ثبت کاربر"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Direct Push Notification */}
      {notifyDeviceId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                <span>ارسال پوش اختصاصی به دستگاه</span>
              </h3>
              <button
                onClick={() => setNotifyDeviceId(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendPush} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">عنوان پیام:</label>
                <input
                  type="text"
                  value={notifyTitle}
                  onChange={(e) => setNotifyTitle(e.target.value)}
                  placeholder="مثال: تست ارتباط پیامک"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">متن پیام:</label>
                <textarea
                  rows={3}
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  placeholder="متن پیام نوتیفیکیشن..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNotifyDeviceId(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={notifyLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition"
                >
                  {notifyLoading ? "در حال ارسال..." : "ارسال نوتیفیکیشن"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Broadcast Notification */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                <span>ارسال اعلان همگانی (Broadcast)</span>
              </h3>
              <button
                onClick={() => setIsBroadcastOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcastNotification} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">عنوان اعلان همگانی:</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="مثال: بروزرسانی سامانه هنرهاب پی"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">متن پیام همگانی برای همه دستگاه‌ها:</label>
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="این پیام برای تمامی دستگاه‌های متصل ارسال خواهد شد..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={broadcastLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition"
                >
                  {broadcastLoading ? "در حال ارسال همگانی..." : "ارسال به تمام دستگاه‌ها"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: Manage User Subscription Plan & Duration */}
      {planModalUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <span>مدیریت و تمدید اشتراک: {planModalUser.name || planModalUser.phone}</span>
              </h3>
              <button
                onClick={() => setPlanModalUser(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserPlan} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">پلن تعرفه انتخابی:</label>
                <select
                  value={planModalTarget}
                  onChange={(e) => setPlanModalTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-sans"
                >
                  <option value="FREE">پلن پایه (FREE • رایگان • حداکثر ۱ کارت فعال)</option>
                  <option value="PRO">پلن حرفه‌ای (PRO • تا ۵ کارت فعال • ۵۰۰ تراکنش ماهانه)</option>
                  <option value="SPECIAL">پلن ویژه (SPECIAL • نامحدود • بدون سقف)</option>
                </select>
              </div>

              {planModalTarget !== "FREE" && (
                <div>
                  <label className="text-slate-300 font-medium block mb-1">مدت زمان اشتراک:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { months: 1, label: "۱ ماهه" },
                      { months: 3, label: "۳ ماهه" },
                      { months: 12, label: "۱۲ ماهه (۱ ساله)" },
                    ].map((d) => (
                      <button
                        key={d.months}
                        type="button"
                        onClick={() => setPlanModalDuration(d.months)}
                        className={`py-2 px-3 rounded-xl border text-center font-bold transition ${
                          planModalDuration === d.months
                            ? "bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-600/30"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-300 font-medium block mb-1">پیام یا یادداشت مدیریت (اختیاری جهت درج در اعلان کاربر):</label>
                <input
                  type="text"
                  placeholder="مثال: تمدید اشتراک ویژه به مناسبت تخفیف سالانه"
                  value={planModalNotes}
                  onChange={(e) => setPlanModalNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-sans"
                />
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="text-teal-300 font-bold">نکات اعمال خودکار:</p>
                <p>• در صورت ارتقا، کارت‌های فریز شده به صورت خودکار فعال خواهند شد.</p>
                <p>• در صورت دانگرید به رایگان، تنها کارت اول فعال مانده و سایر کارت‌ها فریز می‌شوند.</p>
                <p>• اعلان فوری درون‌برنامه‌ای، پیامکی و ایمیلی برای کاربر ارسال می‌گردد.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPlanModalUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={planModalLoading}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold px-5 py-2.5 rounded-xl transition shadow"
                >
                  {planModalLoading ? "در حال ثبت و اعمال..." : "ذخیره و اعمال فوری"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
