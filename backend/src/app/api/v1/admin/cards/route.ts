import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { isSandboxRequest } from "@/lib/sandbox";

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const where: any = {};
  if (userId) {
    where.userId = userId;
  }

  const cards = await db.bankCard.findMany({
    where,
    include: { device: true, user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: cards });
}

export async function POST(req: NextRequest) {
  // -------------------------------------------------------------
  // Sandbox Card Upsert Simulation (No DB pollution)
  // -------------------------------------------------------------
  if (isSandboxRequest(req)) {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      isSandbox: true,
      message: "کارت بانکی در محیط سندباکس با موفقیت شبیه‌سازی گردید.",
      data: {
        id: `sandbox_card_${Date.now().toString(36)}`,
        ownerName: body.ownerName || "امیر رضایی (سندباکس)",
        cardNumber: body.cardNumber || "6037991987654321",
        accountNumber: body.accountNumber || "987654321012345678",
        bankSlug: body.bankSlug || "mehr_iran",
        bankTitle: body.bankTitle || "بانک قرض‌الحسنه مهر ایران",
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    });
  }

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
        ...(cleanUserId ? { merchantUserId: cleanUserId, userId: cleanUserId } : {}),
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
        userId: cleanUserId || null,
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
