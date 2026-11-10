import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { getSystemSettings, saveSystemSettings } from "@/lib/settings";

// GET /api/v1/admin/settings - Retrieve current configuration
export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = getSystemSettings();
    return NextResponse.json({
      success: true,
      data: settings,
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
    return NextResponse.json({
      success: true,
      message: "تنظیمات سامانه با موفقیت ذخیره و اعمال شد.",
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
