import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { parseBankDepositSms, getBankById } from "@/lib/bank-utils";

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { rawText, bankId } = body;

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        { success: false, error: "متن پیامک بانکی برای تست الزامی است." },
        { status: 400 }
      );
    }

    const parsed = parseBankDepositSms(rawText);
    const bank = bankId ? getBankById(bankId) : parsed.detectedBank;

    return NextResponse.json({
      success: true,
      data: {
        rawText,
        ...parsed,
        bank: bank || parsed.detectedBank || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
