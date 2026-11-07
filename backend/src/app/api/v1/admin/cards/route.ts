import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const cards = await db.bankCard.findMany({
    include: { device: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: cards });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      ownerName,
      cardNumber,
      accountNumber,
      iban,
      bankSlug = "mehr_iran",
      bankTitle = "بانک قرض‌الحسنه مهر ایران",
      deviceId,
    } = body;

    if (!ownerName || !cardNumber) {
      return NextResponse.json(
        { success: false, error: "ownerName and cardNumber are required" },
        { status: 400 }
      );
    }

    const cleanCard = cardNumber.replace(/[^0-9]/g, "");

    const card = await db.bankCard.create({
      data: {
        ownerName,
        cardNumber: cleanCard,
        accountNumber: accountNumber ? accountNumber.trim() : null,
        iban: iban ? iban.trim() : null,
        bankSlug,
        bankTitle,
        deviceId: deviceId || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: card });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
