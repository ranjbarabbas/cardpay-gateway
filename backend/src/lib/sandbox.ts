import { NextRequest } from "next/server";
import { getSystemSettings } from "./settings";

export const SANDBOX_API_KEY = "hp_sandbox_test_key_2026";
export const SANDBOX_DEVICE_KEY = "hp_sandbox_sync_key_2026";

/**
 * Checks if a given key is a designated sandbox API key
 */
export function isSandboxKey(key?: string | null): boolean {
  if (!key) return false;
  const clean = key.trim();
  return (
    clean === SANDBOX_API_KEY ||
    clean === SANDBOX_DEVICE_KEY ||
    clean === "dev_sandbox_device_key_2026" ||
    clean === "cp_sec_art_hub_2026_sandbox" ||
    clean.startsWith("hp_sandbox_") ||
    clean.startsWith("sandbox_") ||
    clean.includes("sandbox")
  );
}

/**
 * Determines if an incoming HTTP request is in Sandbox Mode
 */
export function isSandboxRequest(req: NextRequest): boolean {
  const apiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.headers.get("x-device-key") ||
    req.nextUrl.searchParams.get("api_key");

  const sandboxHeader = req.headers.get("x-sandbox-mode");
  if (sandboxHeader === "true" || sandboxHeader === "1") return true;

  return isSandboxKey(apiKey);
}

export interface SandboxTransaction {
  authority: string;
  internalTrackingCode: string;
  originalAmountToman: number;
  offsetToman: number;
  payableAmountToman: number;
  payableAmountRial: number;
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  createdAt: Date;
  expiresAt: Date;
  paidAt?: Date;
  callbackUrl: string;
  webhookUrl?: string;
  customerMobile?: string;
  description?: string;
  transferType?: "CARD_TO_CARD" | "POL";
  card: {
    ownerName: string;
    cardNumber: string;
    accountNumber?: string;
    iban?: string;
    bankTitle: string;
    bankSlug: string;
    bankLogo?: string;
  };
}

// In-memory store on globalThis to survive HMR/reloads
const globalForSandbox = globalThis as unknown as {
  sandboxStore?: Map<string, SandboxTransaction>;
};

export const sandboxStore =
  globalForSandbox.sandboxStore ?? new Map<string, SandboxTransaction>();

if (process.env.NODE_ENV !== "production") {
  globalForSandbox.sandboxStore = sandboxStore;
}

/**
 * Creates and stores a temporary Sandbox Transaction in memory
 */
export function createSandboxTransaction(params: {
  amount?: number;
  callbackUrl?: string;
  webhookUrl?: string;
  customerMobile?: string;
  description?: string;
}): SandboxTransaction {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const authority = `hp_sandbox_${timestamp}_${randomSuffix}`;
  const internalTrackingCode = `PAY-SANDBOX-${timestamp.toString().slice(-8)}`;

  const originalAmountToman = Number(params.amount) || 50000;
  const offsetToman = 15; // Dynamic test offset
  const payableAmountToman = originalAmountToman + offsetToman;
  const payableAmountRial = payableAmountToman * 10;
  const settings = getSystemSettings();
  const cardLimit = settings.limits?.cardTransferLimitToman || 15000000;
  const isPol = originalAmountToman > cardLimit;

  const tx: SandboxTransaction = {
    authority,
    internalTrackingCode,
    originalAmountToman,
    offsetToman,
    payableAmountToman,
    payableAmountRial,
    status: "PENDING",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes validity
    callbackUrl: params.callbackUrl || "https://honarhub.com/order/callback",
    webhookUrl: params.webhookUrl,
    customerMobile: params.customerMobile || "09120000000",
    description: params.description || (isPol ? "تراکنش آزمایشی انتقال سامانه پل (محیط سندباکس)" : "تراکنش آزمایشی کارت‌به‌کارت (محیط سندباکس)"),
    transferType: isPol ? "POL" : "CARD_TO_CARD",
    card: {
      ownerName: "حساب آزمایشی هنرهاب پی (محیط سندباکس)",
      cardNumber: "6063731099887766",
      accountNumber: "111122223333444455",
      iban: "IR820600000000111122223333",
      bankTitle: "بانک قرض‌الحسنه مهر ایران",
      bankSlug: "mehr_iran",
      bankLogo: "/images/banks/mehriran.svg",
    },
  };

  sandboxStore.set(authority, tx);
  sandboxStore.set(internalTrackingCode, tx);

  return tx;
}

/**
 * Retrieves a sandbox transaction by authority or internal tracking code
 */
export function getSandboxTransaction(identifier: string): SandboxTransaction | null {
  if (!identifier) return null;

  if (sandboxStore.has(identifier)) {
    return sandboxStore.get(identifier)!;
  }

  // Synthesize realistic fallback transaction if identifier looks like test/sandbox
  if (
    identifier.startsWith("hp_sandbox_") ||
    identifier.includes("sandbox") ||
    identifier === "test" ||
    identifier.startsWith("PAY-SANDBOX-")
  ) {
    const fallbackTx = createSandboxTransaction({
      amount: 150000,
      callbackUrl: "https://honarhub.com/order/callback",
      description: "تراکنش نمونه محیط سندباکس",
    });
    // Link this identifier to the fallback
    sandboxStore.set(identifier, fallbackTx);
    return fallbackTx;
  }

  return null;
}

/**
 * Updates a sandbox transaction status (e.g. for simulation)
 */
export function updateSandboxStatus(
  identifier: string,
  status: "PAID" | "CANCELLED"
): SandboxTransaction | null {
  const tx = getSandboxTransaction(identifier);
  if (!tx) return null;

  tx.status = status;
  if (status === "PAID") {
    tx.paidAt = new Date();
  }

  sandboxStore.set(tx.authority, tx);
  sandboxStore.set(tx.internalTrackingCode, tx);
  return tx;
}
