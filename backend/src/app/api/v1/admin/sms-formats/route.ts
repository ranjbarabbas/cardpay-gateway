import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { IRANIAN_BANKS, BankInfo } from "@/lib/bank-utils";

const SMS_FORMATS_KEY = "bank_sms_formats";

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const record = await db.systemSetting.findUnique({
      where: { key: SMS_FORMATS_KEY },
    });

    let savedFormats: Record<string, { sampleSmsCard?: string; sampleSmsPol?: string }> = {};
    if (record && record.value) {
      try {
        savedFormats = JSON.parse(record.value);
      } catch (err) {
        console.warn("[SMS_FORMATS] Error parsing saved formats:", err);
      }
    }

    const mergedBanks = IRANIAN_BANKS.map((b) => {
      const custom = savedFormats[b.id] || {};
      return {
        ...b,
        sampleSmsCard: custom.sampleSmsCard || b.sampleSmsCard || "",
        sampleSmsPol: custom.sampleSmsPol || b.sampleSmsPol || "",
      };
    });

    return NextResponse.json({
      success: true,
      data: mergedBanks,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bankId, sampleSmsCard, sampleSmsPol } = body;

    if (!bankId) {
      return NextResponse.json({ success: false, error: "bankId is required" }, { status: 400 });
    }

    const record = await db.systemSetting.findUnique({
      where: { key: SMS_FORMATS_KEY },
    });

    let currentMap: Record<string, { sampleSmsCard?: string; sampleSmsPol?: string }> = {};
    if (record && record.value) {
      try {
        currentMap = JSON.parse(record.value);
      } catch (e) {
        // ignore
      }
    }

    currentMap[bankId] = {
      sampleSmsCard: sampleSmsCard || "",
      sampleSmsPol: sampleSmsPol || "",
    };

    await db.systemSetting.upsert({
      where: { key: SMS_FORMATS_KEY },
      update: { value: JSON.stringify(currentMap) },
      create: { key: SMS_FORMATS_KEY, value: JSON.stringify(currentMap) },
    });

    return NextResponse.json({
      success: true,
      message: "فرمت پیامک‌های بانک مورد نظر با موفقیت ذخیره شد.",
      data: currentMap[bankId],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
