import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AmountOffsetService } from "@/lib/services/amount-offset.service";
import { generateInternalTrackingCode } from "@/lib/services/tracking-code.service";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount,
      cardId,
      cardNumber,
      bankSlug,
      callbackUrl,
      webhookUrl,
      description,
      customerMobile,
    } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount provided. Must be greater than 0 Toman." },
        { status: 400 }
      );
    }

    if (!callbackUrl) {
      return NextResponse.json(
        { success: false, error: "callbackUrl is required." },
        { status: 400 }
      );
    }

    // Determine target card: Supports cardId, cardNumber, bankSlug, or auto-select default
    let targetCard = null;
    if (cardId) {
      targetCard = await db.bankCard.findUnique({
        where: { id: cardId, isActive: true },
      });
      if (!targetCard) {
        return NextResponse.json(
          { success: false, error: "Specified card was not found or is currently inactive." },
          { status: 404 }
        );
      }
    } else if (cardNumber) {
      const cleanCard = String(cardNumber).replace(/[^0-9]/g, "");
      targetCard = await db.bankCard.findFirst({
        where: { cardNumber: cleanCard, isActive: true },
      });
      if (!targetCard) {
        return NextResponse.json(
          { success: false, error: `Card with number ${cleanCard} was not found or is currently inactive.` },
          { status: 404 }
        );
      }
    } else if (bankSlug) {
      targetCard = await db.bankCard.findFirst({
        where: { bankSlug, isActive: true },
        orderBy: { createdAt: "asc" },
      });
      if (!targetCard) {
        return NextResponse.json(
          { success: false, error: `No active card found for bank slug: ${bankSlug}` },
          { status: 404 }
        );
      }
    } else {
      // Default: Pick the first active card
      targetCard = await db.bankCard.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
      if (!targetCard) {
        return NextResponse.json(
          { success: false, error: "No active payment cards configured in the gateway." },
          { status: 503 }
        );
      }
    }

    // Resolve unique collision-free amount (+11, +12, +13, ...)
    const resolved = await AmountOffsetService.resolveUniqueAmount(
      targetCard.id,
      BigInt(amount)
    );

    // Generate standard authority token
    const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
    const timestampPart = Date.now().toString(36).toUpperCase();
    const authority = `CPAY_${timestampPart}_${randomSuffix}`;
    const internalTrackingCode = generateInternalTrackingCode();

    const transaction = await db.transaction.create({
      data: {
        authority,
        internalTrackingCode,
        cardId: targetCard.id,
        originalAmountToman: resolved.originalAmountToman,
        offsetToman: resolved.offsetToman,
        finalAmountToman: resolved.finalAmountToman,
        finalAmountRial: resolved.finalAmountRial,
        status: "PENDING",
        expiresAt: resolved.expiresAt,
        collisionLockUntil: resolved.collisionLockUntil,
        callbackUrl,
        webhookUrl: webhookUrl || null,
        description: description || null,
        customerMobile: customerMobile || null,
      },
      include: {
        card: true,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const paymentUrl = `${baseUrl}/pay/${authority}`;

    return NextResponse.json({
      success: true,
      data: {
        authority: transaction.authority,
        trackingCode: transaction.internalTrackingCode,
        paymentUrl,
        originalAmountToman: Number(transaction.originalAmountToman),
        offsetToman: transaction.offsetToman,
        payableAmountToman: Number(transaction.finalAmountToman),
        payableAmountRial: Number(transaction.finalAmountRial),
        expiresAt: transaction.expiresAt.toISOString(),
        card: {
          ownerName: targetCard.ownerName,
          cardNumber: targetCard.cardNumber,
          accountNumber: targetCard.accountNumber,
          bankTitle: targetCard.bankTitle,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
