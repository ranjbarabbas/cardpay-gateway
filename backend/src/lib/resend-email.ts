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
  const apiKey = settings.email.apiKey || process.env.RESEND_API_KEY || "";
  const fromName = settings.email.fromName || "هنرهاب پی | HonarHub Pay";
  const fromEmail = options.from || (settings.email.fromEmail ? `${fromName} <${settings.email.fromEmail}>` : (process.env.RESEND_FROM_EMAIL || "HonarHub Pay <noreply@honarhub.ir>"));

  // If Resend API Key is not configured yet, simulate safely in console/log
  if (!apiKey || apiKey === "your-resend-api-key") {
    console.log(`[RESEND_EMAIL_SIMULATION] To: ${JSON.stringify(options.to)} | Subject: ${options.subject}`);
    return { success: true, id: `sim_email_${Date.now()}` };
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
    if (res.ok) {
      return { success: true, id: data?.id };
    } else {
      console.error("[RESEND_EMAIL_ERROR]", data);
      return { success: false, error: data?.message || "Resend email delivery error" };
    }
  } catch (err: any) {
    console.error("[RESEND_EMAIL_EXCEPTION]", err);
    return { success: false, error: err.message };
  }
}
