import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { IRANIAN_BANKS } from "@/lib/bank-utils";

const SMS_FORMATS_KEY = "bank_sms_formats";

export async function GET(req: NextRequest) {
  try {
    const record = await db.systemSetting.findUnique({
      where: { key: SMS_FORMATS_KEY },
    });

    let savedFormats: Record<string, { sampleSmsCard?: string; sampleSmsPol?: string }> = {};
    if (record && record.value) {
      try {
        savedFormats = JSON.parse(record.value);
      } catch (err) {
        // ignore
      }
    }

    const data = IRANIAN_BANKS.map((b) => ({
      id: b.id,
      nameFa: b.nameFa,
      nameEn: b.nameEn,
      cardPrefixes: b.cardPrefixes,
      ibanCode: b.ibanCode,
      logo: b.logo,
      sampleSmsCard: savedFormats[b.id]?.sampleSmsCard || b.sampleSmsCard || "",
      sampleSmsPol: savedFormats[b.id]?.sampleSmsPol || b.sampleSmsPol || "",
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
