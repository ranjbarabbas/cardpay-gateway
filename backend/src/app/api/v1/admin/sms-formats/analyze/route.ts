import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { analyzeBankSmsStructure } from "@/lib/bank-utils";

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: "متن پیامک بانکی جهت تحلیل الزامی است." },
        { status: 400 }
      );
    }

    const analysis = analyzeBankSmsStructure(text);

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
