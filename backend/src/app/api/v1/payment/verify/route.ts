import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { authority, amount } = body;

    if (!authority) {
      return NextResponse.json(
        { success: false, error: "Authority is required" },
        { status: 400 }
      );
    }

    const tx = await db.transaction.findUnique({
      where: { authority },
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

    return NextResponse.json({
      success: true,
      status: tx.status,
      data: {
        authority: tx.authority,
        trackingCode: tx.trackingCode,
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
