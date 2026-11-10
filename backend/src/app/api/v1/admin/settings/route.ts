import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { getSystemSettings, saveSystemSettings } from "@/lib/settings";
import { db, formatFriendlyDbError } from "@/lib/db";

async function checkDatabaseHealth() {
  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return {
      connected: true,
      latencyMs: Date.now() - start,
      provider: process.env.DATABASE_URL?.includes("postgres") ? "PostgreSQL" : "SQLite",
    };
  } catch (err: any) {
    return {
      connected: false,
      error: formatFriendlyDbError(err),
    };
  }
}

// GET /api/v1/admin/settings - Retrieve current configuration & DB health
export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = getSystemSettings();
    const dbHealth = await checkDatabaseHealth();
    return NextResponse.json({
      success: true,
      data: settings,
      dbHealth,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/v1/admin/settings - Update configuration
export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = saveSystemSettings(body);
    const dbHealth = await checkDatabaseHealth();

    if (!dbHealth.connected) {
      return NextResponse.json(
        {
          success: false,
          warning: true,
          error: `هشدار بحرانی: تنظیمات ذخیره گردید اما پایگاه داده قطع است! (${dbHealth.error})`,
          message: "تنظیمات در فایل سرور ذخیره شد، اما سرور پایگاه داده در دسترس نیست.",
          data: updated,
          dbHealth,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تنظیمات سامانه با موفقیت ذخیره و اعمال شد.",
      data: updated,
      dbHealth,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
