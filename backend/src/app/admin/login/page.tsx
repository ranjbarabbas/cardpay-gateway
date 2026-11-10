"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Shield, Lock, ArrowLeft, AlertCircle, CheckCircle2, Mail, ExternalLink, Sparkles, Check } from "lucide-react";
import { APP_NAME, APP_VERSION } from "@/lib/version";

declare global {
  interface Window {
    google?: any;
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState("");
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [gmailAccounts, setGmailAccounts] = useState<string[]>([]);
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check query params for error and fetch admin info
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      if (urlError) {
        setError(decodeURIComponent(urlError));
      }
    }

    const fetchAdminInfo = async () => {
      try {
        const res = await fetch("/api/v1/auth/admin");
        const data = await res.json();
        if (data.authenticated) {
          router.push("/admin");
          return;
        }
        if (data.allowedEmails && data.allowedEmails.length > 0) {
          setAllowedEmails(data.allowedEmails);
          const gmails = data.gmailAccounts || data.allowedEmails.filter((e: string) => e.endsWith("@gmail.com"));
          setGmailAccounts(gmails);
          if (gmails.length > 0) {
            setAdminEmail(gmails[0]);
          } else {
            setAdminEmail(data.allowedEmails[0]);
          }
        }
        if (data.googleClientId) {
          setGoogleClientId(data.googleClientId);
        }
      } catch {
        // Fallback default
        setAllowedEmails(["ranjbar.abbas1988@gmail.com", "admin@cardpay.local"]);
        setGmailAccounts(["ranjbar.abbas1988@gmail.com"]);
        setAdminEmail("ranjbar.abbas1988@gmail.com");
      }
    };
    fetchAdminInfo();
  }, [router]);

  // Handle Google SSO & Email Authentication
  const handleAdminAuth = async (emailToSubmit: string, credential?: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToSubmit.trim(),
          credential,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "دسترسی مدیریت به این حساب داده نشده است.");
      }

      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "خطا در احراز هویت ادمین");
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Identity Services if available
  const initGoogleGIS = () => {
    const cId = googleClientId || "488680062949-dp0todqjgl6a67ku94a2j9sbr7hee8du.apps.googleusercontent.com";
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: cId,
          callback: async (response: any) => {
            if (response?.credential) {
              await handleAdminAuth("", response.credential);
            }
          },
        });
      } catch (e) {
        console.warn("[GIS_INIT_WARNING]", e);
      }
    }
  };

  const primaryGmail = gmailAccounts[0] || "ranjbar.abbas1988@gmail.com";

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Google Identity Services Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleGIS}
      />

      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[30%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[130px]" />
      </div>

      {/* Header */}
      <header className="p-6 max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/images/honarhub_pay_logo.png" alt="هنرهاب پی" className="h-8 w-auto object-contain" />
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full font-mono">
            v{APP_VERSION}
          </span>
        </Link>

        <Link href="/" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition">
          <span>بازگشت به سایت</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white">ورود به پنل مدیریت</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              احراز هویت امن مدیران با حساب رسمی گوگل (Google OAuth / SSO) و ایمیل‌های ثبت‌شده در متغیر محیطی <code className="text-emerald-400 font-mono">.env</code>
            </p>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] px-2.5 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Google OAuth فعال و متصل به سرور</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Official Google OAuth Redirect Button */}
          <div className="space-y-3">
            <a
              href="/api/v1/auth/google"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl transition shadow-lg text-xs group"
            >
              {/* Official Google Vector Logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>ورود با حساب رسمی گوگل (Google SSO)</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition" />
            </a>

            {/* Quick 1-Click for primary admin gmail */}
            <button
              onClick={() => handleAdminAuth(primaryGmail)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-medium py-2.5 rounded-xl transition text-[11px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{loading ? "در حال تایید..." : `ورود سریع با جیمیل پیش‌فرض (${primaryGmail})`}</span>
            </button>

            {/* Configured Admin Emails Quick Pills */}
            {allowedEmails.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>حساب‌های مجاز در سیستم (.env):</span>
                  <span className="text-emerald-400 font-mono text-[10px]">{allowedEmails.length} حساب</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allowedEmails.map((mail, idx) => {
                    const isG = mail.endsWith("@gmail.com");
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAdminEmail(mail);
                          handleAdminAuth(mail);
                        }}
                        disabled={loading}
                        className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                          mail === adminEmail
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                        }`}
                        dir="ltr"
                      >
                        {isG ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        ) : (
                          <Mail className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{mail}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="relative flex items-center justify-center my-4">
              <span className="bg-[#0F172A] px-3 text-[10px] text-slate-500 z-10">یا ورود با تایپ آدرس ایمیل مجاز</span>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
            </div>

            {/* 2. Manual Email Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAdminAuth(adminEmail);
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block text-xs">آدرس ایمیل ادمین:</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="ranjbar.abbas1988@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-xs font-mono focus:outline-none transition"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !adminEmail}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl transition text-xs shadow-lg shadow-amber-500/20"
              >
                {loading ? "در حال اعتبارسنجی ادمین..." : "ورود به کنترل‌پنل مدیریت"}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-[11px] text-slate-600">
        سامانه درگاه پرداخت {APP_NAME} • کنترل پنل مدیریت یکپارچه
      </footer>
    </div>
  );
}
