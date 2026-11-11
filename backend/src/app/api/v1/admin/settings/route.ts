import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { getSystemSettingsAsync, saveSystemSettingsAsync, saveSystemSettings } from "@/lib/settings";
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

// GET /api/v1/admin/settings - Retrieve current configuration from DB & DB health
export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getSystemSettingsAsync();
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

// POST /api/v1/admin/settings - Update configuration and persist to database
export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dbHealth = await checkDatabaseHealth();
    const body = await req.json();

    if (!dbHealth.connected) {
      // Save locally as temporary fallback, but alert user that DB is disconnected
      const updated = saveSystemSettings(body);
      return NextResponse.json(
        {
          success: false,
          warning: true,
          error: `هشدار بحرانی: ارتباط با پایگاه داده برقرار نیست (${dbHealth.error}). تنظیمات فقط به صورت موقت ذخیره شد و در پایگاه داده پایدار ثبت نگردید!`,
          message: "تنظیمات در فایل موقت ذخیره شد، اما سرور پایگاه داده در دسترس نیست.",
          data: updated,
          dbHealth,
        },
        { status: 503 }
      );
    }

    const updated = await saveSystemSettingsAsync(body);

    return NextResponse.json({
      success: true,
      message: "تنظیمات سامانه با موفقیت در پایگاه داده پایدار و سرور ذخیره و اعمال شد.",
      data: updated,
      dbHealth,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
