// Faraz SMS (Iran Payamak / IPPanel) Gateway Integration
// Supports sending SMS alerts, OTPs, and Pattern-based messages

import { getSystemSettings } from "./settings";

export interface FarazSmsOptions {
  recipient: string;
  message?: string;
  patternCode?: string;
  patternValues?: Record<string, string>;
}

/**
 * Clean phone to Iranian standard 11 digits (e.g. 09123456789)
 */
export function normalizePhone(rawPhone: string): string {
  let cleaned = (rawPhone || "").replace(/[^0-9]/g, "");
  if (cleaned.startsWith("98")) {
    cleaned = "0" + cleaned.slice(2);
  } else if (!cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }
  return cleaned;
}

/**
 * Send standard single SMS using Faraz SMS
 */
export async function sendFarazSms(options: FarazSmsOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const settings = getSystemSettings();

  if (settings.sms.enabled === false) {
    return { success: false, error: "ارسال پیامک در تنظیمات سامانه غیرفعال شده است." };
  }

  const apiKey = (settings.sms.apiKey || process.env.FARAZ_SMS_API_KEY || "").trim();
  const senderNumber = (settings.sms.senderNumber || process.env.FARAZ_SMS_SENDER || "90008361").trim();
  const cleanPhone = normalizePhone(options.recipient);

  if (!cleanPhone || cleanPhone.length !== 11) {
    return { success: false, error: "شماره موبایل گیرنده نامعتبر است (باید ۱۱ رقم باشد، مانند ۰۹۱۲۰۰۰۰۰۰۰)." };
  }

  // If patternCode is provided, delegate to pattern endpoint
  if (options.patternCode) {
    return sendFarazPatternSms({
      recipient: cleanPhone,
      patternCode: options.patternCode,
      variables: options.patternValues || {},
      apiKey,
      senderNumber,
    });
  }

  if (!apiKey || apiKey === "your-faraz-sms-api-key" || apiKey.includes("demo")) {
    const errorMsg = "کلید API پنل فراز اس‌ام‌اس در تنظیمات سامانه ثبت نشده یا نامعتبر است.";
    console.warn(`[FARAZ_SMS_UNCONFIGURED] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    const res = await fetch("https://api.iranpayamak.com/ws/v1/sms/send/webservice/single", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Api-Key": apiKey,
      },
      body: JSON.stringify({
        recipient: [cleanPhone],
        sender: senderNumber,
        message: options.message || "",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && (data?.status === "success" || data?.data?.id)) {
      return { success: true, messageId: String(data?.data?.id || "") };
    }
    const errMsg = data?.message || data?.error || `خطا در ارسال پیامک (کد وضعیت: ${res.status})`;
    return { success: false, error: errMsg };
  } catch (err: any) {
    console.error("[FARAZ_SMS_EXCEPTION]", err);
    return { success: false, error: `خطای ارتباط با سرور فراز اس‌ام‌اس: ${err.message}` };
  }
}

/**
 * Send pattern-based SMS via Faraz SMS (Iran Payamak REST API)
 * with automatic fallback to IPPanel REST if needed
 */
export async function sendFarazPatternSms(params: {
  recipient: string;
  patternCode: string;
  variables: Record<string, string>;
  apiKey?: string;
  senderNumber?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const settings = getSystemSettings();

  if (settings.sms.enabled === false) {
    return { success: false, error: "ارسال پیامک در تنظیمات سامانه غیرفعال شده است." };
  }

  const apiKey = (params.apiKey || settings.sms.apiKey || process.env.FARAZ_SMS_API_KEY || "").trim();
  const senderNumber = (params.senderNumber || settings.sms.senderNumber || process.env.FARAZ_SMS_SENDER || "90008361").trim();
  const cleanPhone = normalizePhone(params.recipient);

  if (!cleanPhone || cleanPhone.length !== 11) {
    return { success: false, error: "شماره موبایل گیرنده نامعتبر است (باید ۱۱ رقم باشد، مانند ۰۹۱۲۰۰۰۰۰۰۰)." };
  }

  if (!params.patternCode) {
    return { success: false, error: "کد پترن پیامک مشخص نشده است." };
  }

  if (!apiKey || apiKey === "your-faraz-sms-api-key" || apiKey.includes("demo")) {
    const errorMsg = "کلید API پنل فراز اس‌ام‌اس در تنظیمات سامانه ثبت نشده یا نامعتبر است.";
    console.warn(`[FARAZ_SMS_UNCONFIGURED] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  let firstError = "";

  // 1. Primary: Official Faraz SMS (Iran Payamak) Pattern API
  try {
    const res = await fetch("https://api.iranpayamak.com/ws/v1/sms/pattern", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Api-Key": apiKey,
      },
      body: JSON.stringify({
        code: params.patternCode,
        attributes: params.variables,
        recipient: cleanPhone,
        line_number: senderNumber,
        number_format: "english",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && (data?.status === "success" || data?.data?.id)) {
      return { success: true, messageId: String(data?.data?.id || "") };
    }
    firstError = data?.message || data?.error || `پاسخ ناموفق ${res.status}`;
  } catch (err: any) {
    firstError = err.message;
  }

  // 2. Secondary Fallback: IPPanel REST endpoint
  try {
    const res = await fetch("https://rest.ippanel.com/v1/messages/patterns/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `AccessKey ${apiKey}`,
      },
      body: JSON.stringify({
        pattern_code: params.patternCode,
        originator: senderNumber,
        recipient: cleanPhone,
        values: params.variables,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.data?.message_id) {
      return { success: true, messageId: String(data?.data?.message_id || "") };
    }
    const secondError = data?.message || data?.error || `خطا با کد وضعیت ${res.status}`;
    return { success: false, error: secondError || firstError || "عدم تایید ارسال توسط وب‌سرویس فراز اس‌ام‌اس" };
  } catch (err: any) {
    return { success: false, error: `خطای ارتباط با سرورهای فراز اس‌ام‌اس: ${err.message}` };
  }
}

/**
 * Helper: Send OTP SMS via Faraz SMS pattern with variable 'code'
 */
export async function sendOtpSms(phone: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const settings = getSystemSettings();
  const patternCode = settings.sms.patternOtp || "hnr_otp_v1";
  return sendFarazPatternSms({
    recipient: phone,
    patternCode,
    variables: { code },
  });
}

/**
 * Helper: Send Deposit notification SMS for PRO/SPECIAL users with variables 'amount' and 'track'
 */
export async function sendDepositAlertSms(phone: string, amount: string, track: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const settings = getSystemSettings();
  if (!settings.sms.depositAlertProEnabled) {
    return { success: false, error: "ارسال پیامک واریز در تنظیمات سامانه غیرفعال است." };
  }
  const patternCode = settings.sms.patternDeposit || "hnr_deposit_alert";
  return sendFarazPatternSms({
    recipient: phone,
    patternCode,
    variables: {
      amount,
      track,
    },
  });
}
