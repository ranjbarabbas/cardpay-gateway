import { NextRequest, NextResponse } from "next/server";
import { db, formatFriendlyDbError } from "@/lib/db";
import { getSystemSettings } from "@/lib/settings";
import { APP_VERSION } from "@/lib/version";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const settings = getSystemSettings();
  let dbStatus: {
    connected: boolean;
    latencyMs?: number;
    provider?: string;
    error?: string;
  };

  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    dbStatus = {
      connected: true,
      latencyMs,
      provider: process.env.DATABASE_URL?.includes("postgres") ? "PostgreSQL" : "SQLite",
    };
  } catch (err: any) {
    dbStatus = {
      connected: false,
      error: formatFriendlyDbError(err),
    };
  }

  const farazKey = (settings.sms.apiKey || "").trim();
  const resendKey = (settings.email.apiKey || "").trim();

  const isHealthy = dbStatus.connected;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
      database: dbStatus,
      services: {
        sms: {
          provider: "farazsms",
          enabled: Boolean(settings.sms.enabled),
          isConfigured: Boolean(farazKey && !farazKey.includes("demo") && farazKey !== "your-faraz-sms-api-key"),
        },
        email: {
          provider: "resend",
          enabled: Boolean(settings.email.enabled),
          isConfigured: Boolean(resendKey && resendKey.startsWith("re_") && !resendKey.includes("demo")),
        },
      },
    },
    {
      status: isHealthy ? 200 : 503,
    }
  );
}
