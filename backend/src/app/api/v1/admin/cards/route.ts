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
      merchantUserId,
      userId,
      archivePrevious = false,
    } = body;

    if (!ownerName || !cardNumber) {
      return NextResponse.json(
        { success: false, error: "ownerName and cardNumber are required" },
        { status: 400 }
      );
    }

    const cleanCard = cardNumber.replace(/[^0-9]/g, "");
    const cleanUserId = (merchantUserId || userId) ? String(merchantUserId || userId).trim() : null;

    // If requested, safely archive user's previous active cards without deleting any history
    if (archivePrevious && cleanUserId) {
      await db.bankCard.updateMany({
        where: {
          merchantUserId: cleanUserId,
          cardNumber: { not: cleanCard },
          isArchived: false,
        },
        data: {
          isArchived: true,
          isActive: false,
          archivedAt: new Date(),
        },
      });
    }

    const card = await db.bankCard.upsert({
      where: { cardNumber: cleanCard },
      update: {
        ownerName,
        accountNumber: accountNumber ? accountNumber.trim() : null,
        iban: iban ? iban.trim() : null,
        bankSlug,
        bankTitle,
        ...(cleanUserId ? { merchantUserId: cleanUserId } : {}),
        ...(deviceId ? { deviceId } : {}),
        isActive: true,
        isArchived: false,
        archivedAt: null,
      },
      create: {
        ownerName,
        cardNumber: cleanCard,
        accountNumber: accountNumber ? accountNumber.trim() : null,
        iban: iban ? iban.trim() : null,
        bankSlug,
        bankTitle,
        merchantUserId: cleanUserId || null,
        deviceId: deviceId || null,
        isActive: true,
        isArchived: false,
      },
    });

    return NextResponse.json({ success: true, data: card });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
