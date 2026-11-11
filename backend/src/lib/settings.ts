import fs from "fs";
import path from "path";
import { db } from "./db";

export interface SystemSettings {
  adminCard: {
    ownerName: string;
    cardNumber: string;
    iban?: string;
    bankTitle: string;
    description: string;
  };
  limits: {
    cardTransferLimitToman: number; // سقف کارت به کارت (پیش‌فرض: ۱۵,۰۰۰,۰۰۰ تومان)
    polTransferLimitToman: number;  // سقف انتقال سامانه پل (پیش‌فرض: ۱۰۰,۰۰۰,۰۰۰ تومان - تا ۲۰۰ میلیون)
  };
  pricing: {
    pro1MonthToman: number;
    pro3MonthsToman: number;
    pro6MonthsToman: number;
    pro12MonthsToman?: number;
    special1MonthToman: number;
    special3MonthsToman: number;
    special6MonthsToman: number;
    special12MonthsToman?: number;
  };
  sms: {
    provider: "farazsms";
    enabled: boolean;
    apiKey: string;
    username: string;
    password?: string;
    senderNumber: string;
    patternOtp: string; // با متغیر code
    patternDeposit: string; // با متغیرهای amount و track
    depositAlertProEnabled: boolean; // فعال/غیرفعال سازی اطلاع‌رسانی پیامک واریز برای پلن حرفه‌ای/ویژه
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
const DB_SETTINGS_KEY = "system_config";

export const defaultSettings: SystemSettings = {
  adminCard: {
    ownerName: "هنرهاب پی (حساب رسمی مدیریت)",
    cardNumber: "6063731099887766",
    iban: "IR000000000000000000000000",
    bankTitle: "بانک قرض‌الحسنه مهر ایران",
    description: "کارت رسمی پرداخت و ارتقای اشتراک و پلن‌های هنرهاب پی",
  },
  limits: {
    cardTransferLimitToman: 15000000,
    polTransferLimitToman: 100000000,
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
    apiKey: process.env.FARAZ_SMS_API_KEY || "",
    username: process.env.FARAZ_SMS_USERNAME || "honarhub",
    password: "",
    senderNumber: process.env.FARAZ_SMS_SENDER || "+983000505",
    patternOtp: "hnr_otp_v1",
    patternDeposit: "hnr_deposit_alert",
    depositAlertProEnabled: true,
    patternWelcome: "hnr_welcome_user",
  },
  email: {
    provider: "resend",
    enabled: true,
    apiKey: process.env.RESEND_API_KEY || "",
    fromEmail: process.env.RESEND_FROM_EMAIL || "notifications@honarhub.com",
    fromName: "هنرهاب پی | HonarHub Pay",
    replyTo: "support@honarhub.com",
  },
  general: {
    siteName: "هنرهاب پی (HonarHub Pay)",
    supportPhone: "۰۲۱-۹۱۰۰۰۰۰۰",
    supportEmail: "support@honarhub.com",
    autoReconcile: true,
    defaultGracePeriodMinutes: 10,
  },
  updatedAt: new Date().toISOString(),
};

// Global in-memory cache to guarantee fast synchronous access
let inMemorySettings: SystemSettings | null = null;

function mergeWithDefaults(parsed: any): SystemSettings {
  return {
    ...defaultSettings,
    ...parsed,
    adminCard: { ...defaultSettings.adminCard, ...(parsed.adminCard || {}) },
    limits: { ...defaultSettings.limits, ...(parsed.limits || {}) },
    pricing: { ...defaultSettings.pricing, ...(parsed.pricing || {}) },
    sms: { ...defaultSettings.sms, ...(parsed.sms || {}) },
    email: { ...defaultSettings.email, ...(parsed.email || {}) },
    general: { ...defaultSettings.general, ...(parsed.general || {}) },
    updatedAt: parsed.updatedAt || new Date().toISOString(),
  };
}

/**
 * Synchronous getter: Retrieves settings from memory or local disk file
 */
export function getSystemSettings(): SystemSettings {
  if (inMemorySettings) {
    return inMemorySettings;
  }

  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      if (data && data.trim()) {
        const parsed = JSON.parse(data);
        inMemorySettings = mergeWithDefaults(parsed);
        return inMemorySettings;
      }
    }
  } catch (err) {
    console.warn("[SETTINGS] Error reading settings from local file cache:", err);
  }

  inMemorySettings = { ...defaultSettings };
  return inMemorySettings;
}

/**
 * Asynchronous getter: Queries persistent database first, syncs to memory & disk
 */
export async function getSystemSettingsAsync(): Promise<SystemSettings> {
  try {
    const record = await db.systemSetting.findUnique({
      where: { key: DB_SETTINGS_KEY },
    });

    if (record && record.value) {
      const parsed = JSON.parse(record.value);
      const merged = mergeWithDefaults(parsed);
      inMemorySettings = merged;

      // Sync local disk file cache
      try {
        fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(merged, null, 2), "utf-8");
      } catch (fileErr) {
        // Disk write warning (non-fatal)
      }

      return merged;
    }
  } catch (dbErr: any) {
    console.warn("[SETTINGS] Could not fetch settings from DB, falling back to local cache:", dbErr.message);
  }

  return getSystemSettings();
}

/**
 * Asynchronous saver: Persists settings to Database (Primary) AND Disk/Memory (Secondary)
 */
export async function saveSystemSettingsAsync(updates: Partial<SystemSettings>): Promise<SystemSettings> {
  const current = getSystemSettings();
  const updated: SystemSettings = {
    ...current,
    ...updates,
    adminCard: { ...current.adminCard, ...(updates.adminCard || {}) },
    limits: { ...current.limits, ...(updates.limits || {}) },
    pricing: { ...current.pricing, ...(updates.pricing || {}) },
    sms: { ...current.sms, ...(updates.sms || {}) },
    email: { ...current.email, ...(updates.email || {}) },
    general: { ...current.general, ...(updates.general || {}) },
    updatedAt: new Date().toISOString(),
  };

  // 1. Update in-memory cache
  inMemorySettings = updated;

  // 2. Write to local file cache
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (fileErr) {
    console.warn("[SETTINGS] Error writing settings to local file cache:", fileErr);
  }

  // 3. Persist to PostgreSQL / SQLite database
  try {
    await db.systemSetting.upsert({
      where: { key: DB_SETTINGS_KEY },
      update: {
        value: JSON.stringify(updated),
      },
      create: {
        key: DB_SETTINGS_KEY,
        value: JSON.stringify(updated),
      },
    });
    console.log("[SETTINGS] System settings successfully persisted to database.");
  } catch (dbErr: any) {
    console.error("[SETTINGS] Error saving system settings to database:", dbErr);
    throw dbErr;
  }

  return updated;
}

/**
 * Synchronous saver (backward compatibility): Updates memory and file, and triggers background DB write
 */
export function saveSystemSettings(updates: Partial<SystemSettings>): SystemSettings {
  const current = getSystemSettings();
  const updated: SystemSettings = {
    ...current,
    ...updates,
    adminCard: { ...current.adminCard, ...(updates.adminCard || {}) },
    limits: { ...current.limits, ...(updates.limits || {}) },
    pricing: { ...current.pricing, ...(updates.pricing || {}) },
    sms: { ...current.sms, ...(updates.sms || {}) },
    email: { ...current.email, ...(updates.email || {}) },
    general: { ...current.general, ...(updates.general || {}) },
    updatedAt: new Date().toISOString(),
  };

  inMemorySettings = updated;

  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.error("[SETTINGS] Error saving system settings to disk:", err);
  }

  // Trigger background persistence to DB
  db.systemSetting
    .upsert({
      where: { key: DB_SETTINGS_KEY },
      update: { value: JSON.stringify(updated) },
      create: { key: DB_SETTINGS_KEY, value: JSON.stringify(updated) },
    })
    .catch((dbErr) => {
      console.warn("[SETTINGS] Background DB save failed:", dbErr.message);
    });

  return updated;
}
