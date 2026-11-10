import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

/**
 * Parse allowed admin emails from environment variables and .env file
 */
export function getAdminEmails(): string[] {
  const emailSet = new Set<string>();

  // 1. From process.env
  const envVars = [
    process.env.ADMIN_EMAILS,
    process.env.EMAILS,
    process.env.ADMIN_EMAIL_ALERT,
  ];

  envVars.forEach((val) => {
    if (val) {
      val.split(",").forEach((e) => {
        const clean = e.trim().toLowerCase();
        if (clean && clean.includes("@")) emailSet.add(clean);
      });
    }
  });

  // 2. Read directly from .env file to ensure immediate sync on edits
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
        const [k, ...vParts] = trimmed.split("=");
        const key = k.trim();
        const rawVal = vParts.join("=").trim().replace(/^["']|["']$/g, "");
        if (["ADMIN_EMAILS", "EMAILS", "ADMIN_EMAIL_ALERT"].includes(key) && rawVal) {
          rawVal.split(",").forEach((e) => {
            const clean = e.trim().toLowerCase();
            if (clean && clean.includes("@")) emailSet.add(clean);
          });
        }
      }
    }
  } catch {
    // Graceful fallback
  }

  // Fallback defaults if none configured
  if (emailSet.size === 0) {
    emailSet.add("ranjbar.abbas1988@gmail.com");
    emailSet.add("admin@cardpay.local");
  }

  return Array.from(emailSet);
}

/**
 * Get Google OAuth Credentials from environment or .env file
 */
export function getGoogleOAuthCredentials(): { clientId: string; clientSecret: string } {
  let clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    try {
      const envPath = path.join(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const lines = content.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
          const [k, ...vParts] = trimmed.split("=");
          const key = k.trim();
          const rawVal = vParts.join("=").trim().replace(/^["']|["']$/g, "");
          if ((key === "GOOGLE_CLIENT_ID" || key === "NEXT_PUBLIC_GOOGLE_CLIENT_ID") && !clientId) {
            clientId = rawVal;
          }
          if (key === "GOOGLE_CLIENT_SECRET" && !clientSecret) {
            clientSecret = rawVal;
          }
        }
      }
    } catch {
      // Fallback
    }
  }

  return {
    clientId: clientId || "488680062949-dp0todqjgl6a67ku94a2j9sbr7hee8du.apps.googleusercontent.com",
    clientSecret: clientSecret,
  };
}

/**
 * Get Google OAuth Redirect URI consistently
 */
export function getGoogleRedirectUri(req?: NextRequest): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI.trim();
  }

  // If request is provided, inspect host
  if (req) {
    const url = new URL(req.url);
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
    return `${proto}://${host}/api/v1/auth/google/callback`;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  if (appUrl) {
    return `${appUrl}/api/v1/auth/google/callback`;
  }

  return "http://localhost:3050/api/v1/auth/google/callback";
}

export function verifyAdminAuth(req: NextRequest): boolean {
  // 1. Verify via Admin Cookie Session
  const session = req.cookies.get("honarhub_admin_session")?.value;
  const email = req.cookies.get("honarhub_admin_email")?.value?.toLowerCase();
  const allowedEmails = getAdminEmails();

  if (session === "active_admin_session" && email && allowedEmails.includes(email)) {
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
