import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ authority: string }> }
) {
  try {
    const { authority } = await params;

    const tx = await db.transaction.findUnique({
      where: { authority },
      include: {
        card: true,
      },
    });

    if (!tx) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    let currentStatus = tx.status;

    // Check expiration
    if (currentStatus === "PENDING" && now > tx.expiresAt) {
      await db.transaction.update({
        where: { id: tx.id },
        data: { status: "EXPIRED" },
      });
      currentStatus = "EXPIRED";
    }

    const remainingSeconds = Math.max(
      0,
      Math.floor((tx.expiresAt.getTime() - now.getTime()) / 1000)
    );

    return NextResponse.json({
      success: true,
      data: {
        authority: tx.authority,
        status: currentStatus,
        remainingSeconds,
        originalAmountToman: Number(tx.originalAmountToman),
        offsetToman: tx.offsetToman,
        payableAmountToman: Number(tx.finalAmountToman),
        payableAmountRial: Number(tx.finalAmountRial),
        expiresAt: tx.expiresAt.toISOString(),
        paidAt: tx.paidAt ? tx.paidAt.toISOString() : null,
        trackingCode: tx.internalTrackingCode || tx.trackingCode,
        callbackUrl: tx.callbackUrl,
        card: {
          ownerName: tx.card.ownerName,
          cardNumber: tx.card.cardNumber,
          bankTitle: tx.card.bankTitle,
          bankSlug: tx.card.bankSlug,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
