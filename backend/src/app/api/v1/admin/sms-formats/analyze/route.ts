import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { db } from "@/lib/db";
import { analyzeBankSmsStructure, BankSmsTemplate } from "@/lib/bank-utils";

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { text, bankId } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: "متن پیامک بانکی جهت تحلیل الزامی است." },
        { status: 400 }
      );
    }

    // Retrieve saved confirmed templates to evaluate against custom rules
    let confirmedTemplates: BankSmsTemplate[] = [];
    try {
      const record = await db.systemSetting.findUnique({
        where: { key: "bank_sms_formats" },
      });
      if (record?.value) {
        const formats = JSON.parse(record.value);
        if (bankId && formats[bankId]?.templates) {
          confirmedTemplates = formats[bankId].templates.filter((t: BankSmsTemplate) => t.status === "CONFIRMED");
        } else {
          for (const k of Object.keys(formats)) {
            if (formats[k]?.templates) {
              const list = formats[k].templates.filter((t: BankSmsTemplate) => t.status === "CONFIRMED");
              confirmedTemplates.push(...list);
            }
          }
        }
      }
    } catch {
      // ignore
    }

    const analysis = analyzeBankSmsStructure(text, { confirmedTemplates });

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "خطا در تحلیل ساختار پیامک" },
      { status: 500 }
    );
  }
}
