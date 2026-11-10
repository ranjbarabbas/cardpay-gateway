import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { dispatchDepositNotifications } from "@/lib/notifications";
import { checkAndProcessPlanUpgradeTransaction } from "@/lib/services/plan-expiration.service";

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { transactionId, smsLogId, ticketId, trackingCode, adminNote } = body;

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: "transactionId is required" },
        { status: 400 }
      );
    }

    const tx = await db.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!tx) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    const now = new Date();

    await db.$transaction(async (prisma) => {
      // Update transaction status
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "MANUALLY_VERIFIED",
          paidAt: now,
          trackingCode: trackingCode || "MANUAL_ADMIN_OVERRIDE",
          ...(smsLogId ? { smsLogId } : {}),
        },
      });

      // Update SMS log if supplied
      if (smsLogId) {
        await prisma.bankSmsLog.update({
          where: { id: smsLogId },
          data: {
            status: "MANUALLY_RESOLVED",
            matchedTransactionId: transactionId,
          },
        });
      }

      // Update or close ticket if supplied
      if (ticketId) {
        await prisma.discrepancyTicket.update({
          where: { id: ticketId },
          data: {
            status: "RESOLVED",
            resolvedBy: "admin",
            resolvedAt: now,
            notes: adminNote || "Resolved manually by admin",
          },
        });
      }
    });

    // Asynchronously dispatch deposit notifications
    dispatchDepositNotifications({
      transactionId: tx.id,
      trackingCode: trackingCode || tx.internalTrackingCode || tx.authority,
      amountToman: tx.finalAmountToman,
      cardId: tx.cardId,
      userId: tx.userId || undefined,
    }).catch((err) => console.error("Manual reconcile deposit notification failed:", err));

    // Auto-process Plan Upgrade if this was an upgrade payment
    checkAndProcessPlanUpgradeTransaction(tx.id).catch((err) =>
      console.error("Manual reconcile plan upgrade processing failed:", err)
    );

    return NextResponse.json({
      success: true,
      message: "Transaction manually verified and reconciled successfully.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
