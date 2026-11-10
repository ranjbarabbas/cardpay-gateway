// Resend Email Gateway Integration
// Supports sending transactional alerts, lead notifications, and reports

import { getSystemSettings } from "./settings";

export interface ResendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendResendEmail(options: ResendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const settings = getSystemSettings();
  const apiKey = (settings.email.apiKey || process.env.RESEND_API_KEY || "").trim();
  const fromName = settings.email.fromName || "هنرهاب پی | HonarHub Pay";
  const fromEmail = options.from || (settings.email.fromEmail ? `${fromName} <${settings.email.fromEmail}>` : (process.env.RESEND_FROM_EMAIL || "HonarHub Pay <noreply@honarhub.com>"));

  if (settings.email.enabled === false) {
    return { success: false, error: "ارسال ایمیل در تنظیمات سامانه غیرفعال است." };
  }

  // Validate API Key - must start with re_ and not be a demo placeholder
  if (!apiKey || apiKey === "your-resend-api-key" || apiKey.includes("demo") || !apiKey.startsWith("re_")) {
    const errorMsg = "کلید API وب‌سرویس Resend تنظیم نشده یا نامعتبر است (کلید معتبر باید با re_ شروع شود).";
    console.warn(`[RESEND_EMAIL_UNCONFIGURED] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipients,
        subject: options.subject,
        html: options.html,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.id) {
      return { success: true, id: data.id };
    } else {
      const errMsg = data?.message || `خطای ارسال از طریق وب‌سرویس Resend (کد وضعیت: ${res.status})`;
      console.error("[RESEND_EMAIL_ERROR]", { status: res.status, data });
      return { success: false, error: errMsg };
    }
  } catch (err: any) {
    console.error("[RESEND_EMAIL_EXCEPTION]", err);
    return { success: false, error: `خطای ارتباط با سرور Resend: ${err.message}` };
  }
}
