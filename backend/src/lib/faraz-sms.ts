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
function normalizePhone(rawPhone: string): string {
  let cleaned = rawPhone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("98")) {
    cleaned = "0" + cleaned.slice(2);
  } else if (!cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }
  return cleaned;
}

/**
 * Send standard or pattern SMS using Faraz SMS
 */
export async function sendFarazSms(options: FarazSmsOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const settings = getSystemSettings();
  const apiKey = settings.sms.apiKey || process.env.FARAZ_SMS_API_KEY || "";
  const senderNumber = settings.sms.senderNumber || process.env.FARAZ_SMS_SENDER || "90008361";
  const cleanPhone = normalizePhone(options.recipient);

  // If patternCode is provided, send via pattern endpoint
  if (options.patternCode) {
    return sendFarazPatternSms({
      recipient: cleanPhone,
      patternCode: options.patternCode,
      variables: options.patternValues || {},
      apiKey,
      senderNumber,
    });
  }

  // Simulation mode if API key not provided
  if (!apiKey || apiKey === "your-faraz-sms-api-key") {
    console.log(`[FARAZ_SMS_SIMULATION] To: ${cleanPhone} | Sender: ${senderNumber} | Msg: ${options.message}`);
    return { success: true, messageId: `sim_sms_${Date.now()}` };
  }

  // Fallback direct single SMS
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
    return { success: false, error: data?.message || "خطا در ارسال پیامک" };
  } catch (err: any) {
    console.error("[FARAZ_SMS_EXCEPTION]", err);
    return { success: false, error: err.message };
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
  const apiKey = params.apiKey || settings.sms.apiKey || process.env.FARAZ_SMS_API_KEY || "";
  const senderNumber = params.senderNumber || settings.sms.senderNumber || process.env.FARAZ_SMS_SENDER || "90008361";
  const cleanPhone = normalizePhone(params.recipient);

  if (!apiKey || apiKey === "your-faraz-sms-api-key") {
    console.log(`[FARAZ_SMS_PATTERN_SIMULATION] To: ${cleanPhone} | Pattern: ${params.patternCode} | Vars: ${JSON.stringify(params.variables)}`);
    return { success: true, messageId: `sim_pat_${Date.now()}` };
  }

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
      console.log(`[FARAZ_SMS_PATTERN_SUCCESS] To: ${cleanPhone} | Id: ${data?.data?.id}`);
      return { success: true, messageId: String(data?.data?.id || "") };
    } else {
      console.warn("[FARAZ_SMS_IRANPAYAMAK_NOTICE]", data);
    }
  } catch (err: any) {
    console.warn("[FARAZ_SMS_IRANPAYAMAK_EXCEPTION]", err.message);
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
    console.error("[FARAZ_SMS_PATTERN_ERROR]", data);
    return { success: false, error: data?.message || "خطا در ارسال پیامک پترن" };
  } catch (err: any) {
    console.error("[FARAZ_SMS_PATTERN_EXCEPTION]", err);
    return { success: false, error: err.message };
  }
}

/**
 * Helper: Send OTP SMS via Faraz SMS pattern with variable 'code'
 */
export async function sendOtpSms(phone: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const settings = getSystemSettings();
  const patternCode = settings.sms.patternOtp || "rzabaxeRXC";
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
    return { success: false, error: "Deposit alert SMS is disabled in settings" };
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
