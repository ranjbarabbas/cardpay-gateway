import { NextRequest } from "next/server";

export function verifyAdminAuth(req: NextRequest): boolean {
  // 1. Verify via Google SSO Admin Cookie Session
  const session = req.cookies.get("honarhub_admin_session")?.value;
  const email = req.cookies.get("honarhub_admin_email")?.value?.toLowerCase();
  const envEmails = (process.env.ADMIN_EMAILS || process.env.EMAILS || "ranjbar.abbas1988@gmail.com,admin@honarhub.ir,admin@cardpay.local,merchant@example.com")
    .split(",")
    .map((e) => e.trim().toLowerCase());

  if (session === "active_admin_session" && email && envEmails.includes(email)) {
    return true;
  }

  // 2. Verify via Server-to-Server API Keys
  const adminKey = process.env.ADMIN_API_KEY || "super-secret-admin-key-change-me";
  const merchantKey = process.env.MERCHANT_API_KEY || adminKey;
  
  const authHeader =
    req.headers.get("x-admin-key") ||
    req.headers.get("x-api-key") ||
    req.headers.get("authorization");

  if (!authHeader) return false;

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : authHeader.trim();

  return token === adminKey || token === merchantKey;
}
