import { NextRequest, NextResponse } from "next/server";
import { updateSandboxStatus } from "@/lib/sandbox";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { checkAndProcessPlanUpgradeTransaction } from "@/lib/services/plan-expiration.service";
import { dispatchDepositNotifications } from "@/lib/notifications";
import { SmsMatcherService } from "@/lib/services/sms-matcher.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { authority, action = "PAID" } = body;

    if (!authority) {
      return NextResponse.json(
        { success: false, error: "Authority is required for simulation." },
        { status: 400 }
      );
    }

    const targetStatus = action === "CANCELLED" ? "CANCELLED" : "PAID";

    // 1. Check Sandbox In-Memory Store (Always allowed for Sandbox transactions)
    const updatedSandbox = updateSandboxStatus(authority, targetStatus);
    if (updatedSandbox) {
      return NextResponse.json({
        success: true,
        isSandbox: true,
        message:
          targetStatus === "PAID"
            ? "تراکنش سندباکس با موفقیت به عنوان پرداخت‌شده (PAID) علامت‌گذاری گردید."
            : "تراکنش سندباکس به عنوان لغوشده (CANCELLED) علامت‌گذاری گردید.",
        data: {
          authority: updatedSandbox.authority,
          status: updatedSandbox.status,
          trackingCode: updatedSandbox.internalTrackingCode,
          paidAt: updatedSandbox.paidAt ? updatedSandbox.paidAt.toISOString() : null,
        },
      });
    }

    // 2. If NOT a sandbox transaction:
    // Non-sandbox (real) transactions can NEVER be simulated on production by public users.
    // Allowed ONLY for authenticated Admin or local development machine.
    const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").toLowerCase();
    const isLocal =
      host.includes("localhost") ||
      host.includes("127.0.0.1") ||
      host.includes("[::1]");
    const isAdmin = verifyAdminAuth(req);

    if (!isLocal && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "امکان شبیه‌سازی تنها برای تراکنش‌های محیط سندباکس وجود دارد و برای تراکنش‌های واقعی مجاز نمی‌باشد.",
        },
        { status: 403 }
      );
    }

    // 3. Check Database Transaction (Supported in local or admin environments)
    const tx = await db.transaction.findFirst({
      where: {
        OR: [{ authority }, { internalTrackingCode: authority }],
      },
      include: { card: true },
    });

    if (!tx) {
      return NextResponse.json(
        { success: false, error: "تراکنش مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    if (!isLocal && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "شبیه‌سازی واریز تنها در محیط توسعه محلی یا با دسترسی مدیر مجاز است." },
        { status: 403 }
      );
    }

    if (targetStatus === "CANCELLED") {
      const cancelledTx = await db.transaction.update({
        where: { id: tx.id },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json({
        success: true,
        message: "تراکنش با موفقیت لغو گردید.",
        data: {
          authority: cancelledTx.authority,
          status: cancelledTx.status,
          trackingCode: cancelledTx.internalTrackingCode,
        },
      });
    }

    const now = new Date();
    const paidTx = await db.transaction.update({
      where: { id: tx.id },
      data: {
        status: "PAID",
        paidAt: now,
      },
    });

    // Record simulated bank SMS log for auditing & admin dashboard display
    await db.bankSmsLog
      .create({
        data: {
          sender: tx.card?.bankTitle || "شبیه‌ساز پرداخت",
          rawText: `شبیه‌سازی واریز موفق: مبلغ ${Number(tx.finalAmountRial).toLocaleString()} ریال به حساب ${tx.card?.accountNumber || tx.card?.cardNumber}`,
          receivedAt: now,
          isDeposit: true,
          matchedTransactionId: tx.id,
          status: "MATCHED",
        },
      })
      .catch(() => {});

    // If this transaction was for plan upgrade, process it
    checkAndProcessPlanUpgradeTransaction(tx.id).catch((err) =>
      console.error("[SIMULATE_PLAN_UPGRADE_ERROR]", err)
    );

    // Fire webhook if configured
    if (tx.webhookUrl) {
      SmsMatcherService.dispatchWebhook(tx.webhookUrl, {
        authority: tx.authority,
        trackingCode: tx.internalTrackingCode,
        status: "PAID",
        amountToman: tx.finalAmountToman.toString(),
        paidAt: now.toISOString(),
      }).catch(() => {});
    }

    // Fire alerts/notifications
    dispatchDepositNotifications({
      transactionId: paidTx.id,
      trackingCode: paidTx.internalTrackingCode || undefined,
      amountToman: Number(paidTx.finalAmountToman),
      cardId: paidTx.cardId,
      userId: paidTx.userId || undefined,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "واریز شبیه‌سازی شد! تراکنش با موفقیت تایید و به وضعیت پرداخت‌شده تغییر یافت.",
      data: {
        authority: paidTx.authority,
        status: paidTx.status,
        trackingCode: paidTx.internalTrackingCode,
        paidAt: paidTx.paidAt ? paidTx.paidAt.toISOString() : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Simulation error" },
      { status: 500 }
    );
  }
}
