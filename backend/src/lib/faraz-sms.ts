// Faraz SMS (IPPanel) Gateway Integration
// Supports sending SMS alerts and OTPs to Admins and Users

export interface FarazSmsOptions {
  recipient: string;
  message: string;
  patternCode?: string;
  patternValues?: Record<string, string>;
}

export async function sendFarazSms(options: FarazSmsOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.FARAZ_SMS_API_KEY;
  const senderNumber = process.env.FARAZ_SMS_SENDER || "+983000505";
  const cleanPhone = options.recipient.replace(/[^0-9]/g, "");

  // If Faraz SMS API Key is not configured yet, simulate safely in console/log
  if (!apiKey || apiKey === "your-faraz-sms-api-key") {
    console.log(`[FARAZ_SMS_SIMULATION] To: ${cleanPhone} | Sender: ${senderNumber} | Msg: ${options.message}`);
    return { success: true, messageId: `sim_sms_${Date.now()}` };
  }

  try {
    // IPPanel / Faraz SMS REST API v1
    const res = await fetch("https://edge.ippanel.com/api/v1/sms/send/webservice/single", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `AccessKey ${apiKey}`,
      },
      body: JSON.stringify({
        recipient: [cleanPhone],
        sender: senderNumber,
        message: options.message,
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
