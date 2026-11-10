import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAndProcessPlanUpgradeTransaction } from "@/lib/services/plan-expiration.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawAuthority = body.authority;
    const rawTrackingCode = body.trackingCode || body.internalTrackingCode || body.tracking_code;
    const { amount } = body;

    if (!rawAuthority && !rawTrackingCode) {
      return NextResponse.json(
        { success: false, error: "Either authority or trackingCode is required for verification." },
        { status: 400 }
      );
    }

    const tx = await db.transaction.findFirst({
      where: {
        OR: [
          ...(rawAuthority ? [{ authority: rawAuthority }] : []),
          ...(rawTrackingCode ? [{ internalTrackingCode: rawTrackingCode }] : []),
        ],
      },
      include: { card: true },
    });

    if (!tx) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Optional amount consistency check (in Toman)
    if (amount !== undefined) {
      const expectedOriginal = Number(tx.originalAmountToman);
      const expectedFinal = Number(tx.finalAmountToman);
      const provided = Number(amount);

      if (provided !== expectedOriginal && provided !== expectedFinal) {
        return NextResponse.json(
          {
            success: false,
            error: "Amount mismatch with transaction record",
            expectedOriginal,
            expectedFinal,
            provided,
          },
          { status: 400 }
        );
      }
    }

    const isPaid = tx.status === "PAID" || tx.status === "MANUALLY_VERIFIED";

    if (!isPaid) {
      return NextResponse.json({
        success: false,
        status: tx.status,
        message:
          tx.status === "EXPIRED"
            ? "Payment window has expired"
            : "Payment has not been completed or verified yet",
      });
    }

    // If this transaction was for plan upgrade, ensure it is processed immediately
    checkAndProcessPlanUpgradeTransaction(tx.id).catch((err) =>
      console.error("[PAYMENT_VERIFY_PLAN_UPGRADE_ERROR]", err)
    );

    return NextResponse.json({
      success: true,
      status: tx.status,
      data: {
        authority: tx.authority,
        trackingCode: tx.internalTrackingCode || tx.trackingCode,
        amountToman: Number(tx.finalAmountToman),
        originalAmountToman: Number(tx.originalAmountToman),
        offsetToman: tx.offsetToman,
        paidAt: tx.paidAt ? tx.paidAt.toISOString() : tx.createdAt.toISOString(),
        card: {
          ownerName: tx.card.ownerName,
          cardNumber: tx.card.cardNumber,
          bankTitle: tx.card.bankTitle,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
