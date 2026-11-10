// Faraz SMS (IPPanel) Gateway Integration
// Supports sending SMS alerts, OTPs, and Pattern-based messages

import { getSystemSettings } from "./settings";

export interface FarazSmsOptions {
  recipient: string;
  message?: string;
  patternCode?: string;
  patternValues?: Record<string, string>;
}

/**
 * Send standard or pattern SMS using Faraz SMS (IPPanel)
 */
export async function sendFarazSms(options: FarazSmsOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const settings = getSystemSettings();
  const apiKey = settings.sms.apiKey || process.env.FARAZ_SMS_API_KEY || "";
  const senderNumber = settings.sms.senderNumber || process.env.FARAZ_SMS_SENDER || "+983000505";
  const cleanPhone = options.recipient.replace(/[^0-9]/g, "");

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

  try {
    const res = await fetch("https://edge.ippanel.com/api/v1/sms/send/webservice/single", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `AccessKey ${apiKey}`,
      },
      body: JSON.stringify({
        recipient: [cleanPhone],
        sender: senderNumber,
        message: options.message || "",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return { success: true, messageId: data?.data?.message_id || String(data?.data?.bulk_id || "") };
    } else {
      console.error("[FARAZ_SMS_ERROR]", data);
      return { success: false, error: data?.error?.message || "Faraz SMS delivery error" };
    }
  } catch (err: any) {
    console.error("[FARAZ_SMS_EXCEPTION]", err);
    return { success: false, error: err.message };
  }
}

/**
 * Send pattern-based SMS (fast delivery through blacklists)
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
  const senderNumber = params.senderNumber || settings.sms.senderNumber || process.env.FARAZ_SMS_SENDER || "+983000505";
  const cleanPhone = params.recipient.replace(/[^0-9]/g, "");

  if (!apiKey || apiKey === "your-faraz-sms-api-key") {
    console.log(`[FARAZ_SMS_PATTERN_SIMULATION] To: ${cleanPhone} | Pattern: ${params.patternCode} | Vars: ${JSON.stringify(params.variables)}`);
    return { success: true, messageId: `sim_pat_${Date.now()}` };
  }

  try {
    const res = await fetch("https://edge.ippanel.com/api/v1/sms/pattern/normal/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `AccessKey ${apiKey}`,
      },
      body: JSON.stringify({
        code: params.patternCode,
        sender: senderNumber,
        recipient: cleanPhone,
        variable: params.variables,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return { success: true, messageId: String(data?.data?.message_id || data?.data?.bulk_id || "") };
    } else {
      console.error("[FARAZ_SMS_PATTERN_ERROR]", data);
      return { success: false, error: data?.error?.message || "Faraz SMS pattern error" };
    }
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
