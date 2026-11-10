import fs from "fs";
import path from "path";

export interface SystemSettings {
  sms: {
    provider: "farazsms";
    enabled: boolean;
    apiKey: string;
    username: string;
    password?: string;
    senderNumber: string;
    patternOtp: string;
    patternDeposit: string;
    patternWelcome: string;
  };
  email: {
    provider: "resend";
    enabled: boolean;
    apiKey: string;
    fromEmail: string;
    fromName: string;
    replyTo?: string;
  };
  general: {
    siteName: string;
    supportPhone: string;
    supportEmail: string;
    autoReconcile: boolean;
    defaultGracePeriodMinutes: number;
  };
  updatedAt: string;
}

const SETTINGS_FILE_PATH = path.join(process.cwd(), "system_settings.json");

const defaultSettings: SystemSettings = {
  sms: {
    provider: "farazsms",
    enabled: true,
    apiKey: process.env.FARAZ_SMS_API_KEY || "",
    username: process.env.FARAZ_SMS_USERNAME || "honarhub",
    password: "",
    senderNumber: process.env.FARAZ_SMS_SENDER || "+983000505",
    patternOtp: "hnr_otp_v1",
    patternDeposit: "hnr_deposit_alert",
    patternWelcome: "hnr_welcome_user",
  },
  email: {
    provider: "resend",
    enabled: true,
    apiKey: process.env.RESEND_API_KEY || "re_honarhub_pay_live_2026",
    fromEmail: process.env.RESEND_FROM_EMAIL || "notifications@honarhub.ir",
    fromName: "هنرهاب پی | HonarHub Pay",
    replyTo: "support@honarhub.ir",
  },
  general: {
    siteName: "هنرهاب پی (HonarHub Pay)",
    supportPhone: "۰۲۱-۹۱۰۰۰۰۰۰",
    supportEmail: "support@honarhub.ir",
    autoReconcile: true,
    defaultGracePeriodMinutes: 10,
  },
  updatedAt: new Date().toISOString(),
};

export function getSystemSettings(): SystemSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      return {
        ...defaultSettings,
        ...parsed,
        sms: { ...defaultSettings.sms, ...parsed.sms },
        email: { ...defaultSettings.email, ...parsed.email },
        general: { ...defaultSettings.general, ...parsed.general },
      };
    }
  } catch (err) {
    console.error("Error reading system settings:", err);
  }
  return defaultSettings;
}

export function saveSystemSettings(updates: Partial<SystemSettings>): SystemSettings {
  try {
    const current = getSystemSettings();
    const updated: SystemSettings = {
      ...current,
      ...updates,
      sms: { ...current.sms, ...(updates.sms || {}) },
      email: { ...current.email, ...(updates.email || {}) },
      general: { ...current.general, ...(updates.general || {}) },
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (err) {
    console.error("Error saving system settings:", err);
    throw err;
  }
}
