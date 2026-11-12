import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSandboxTransaction } from "@/lib/sandbox";
import { getSystemSettingsAsync } from "@/lib/settings";
import { getBankByCardNumber, getBankByIban, resolveBankDetails } from "@/lib/bank-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ authority: string }> }
) {
  try {
    const { authority } = await params;

    // Check Sandbox In-Memory Store
    const sandboxTx = getSandboxTransaction(authority);
    if (sandboxTx) {
      const now = new Date();
      const remainingSeconds = Math.max(
        0,
        Math.floor((sandboxTx.expiresAt.getTime() - now.getTime()) / 1000)
      );

      return NextResponse.json({
        success: true,
        isSandbox: true,
        data: {
          authority: sandboxTx.authority,
          status: sandboxTx.status,
          remainingSeconds,
          originalAmountToman: sandboxTx.originalAmountToman,
          offsetToman: sandboxTx.offsetToman,
          payableAmountToman: sandboxTx.payableAmountToman,
          payableAmountRial: sandboxTx.payableAmountRial,
          expiresAt: sandboxTx.expiresAt.toISOString(),
          paidAt: sandboxTx.paidAt ? sandboxTx.paidAt.toISOString() : null,
          trackingCode: sandboxTx.internalTrackingCode,
          callbackUrl: sandboxTx.callbackUrl,
          card: sandboxTx.card,
        },
      });
    }

    const tx = await db.transaction.findFirst({
      where: {
        OR: [
          { authority },
          { internalTrackingCode: authority },
        ],
      },
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

    const settings = await getSystemSettingsAsync();
    const cardLimit = settings.limits?.cardTransferLimitToman || 15000000;
    const isPol = Number(tx.finalAmountToman) > cardLimit;

    const resolved = resolveBankDetails({
      cardNumber: tx.card.cardNumber,
      iban: tx.card.iban,
      bankSlug: tx.card.bankSlug,
      bankTitle: tx.card.bankTitle,
    });

    return NextResponse.json({
      success: true,
      data: {
        authority: tx.authority,
        status: currentStatus,
        transferType: isPol ? "POL" : "CARD_TO_CARD",
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
          iban: tx.card.iban || null,
          accountNumber: tx.card.accountNumber || null,
          bankTitle: resolved.nameFa,
          bankSlug: resolved.slug,
          bankLogo: resolved.logo,
          transferType: isPol ? "POL" : "CARD_TO_CARD",
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
