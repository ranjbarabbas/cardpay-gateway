import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAndProcessPlanUpgradeTransaction } from "@/lib/services/plan-expiration.service";
import { isSandboxRequest, getSandboxTransaction, sandboxStore } from "@/lib/sandbox";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawAuthority = body.authority;
    const rawTrackingCode = body.trackingCode || body.internalTrackingCode || body.tracking_code;
    const { amount } = body;

    if (!rawAuthority && !rawTrackingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Either authority or trackingCode is required for verification.",
          message: "ارسال شناسه پرداخت (authority) یا کد پیگیری الزامی است.",
          code: -10,
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------
    // Sandbox Verification Handler
    // -------------------------------------------------------------
    if (
      isSandboxRequest(req) ||
      rawAuthority?.includes("sandbox") ||
      rawTrackingCode?.includes("SANDBOX") ||
      (rawAuthority && sandboxStore.has(rawAuthority)) ||
      (rawTrackingCode && sandboxStore.has(rawTrackingCode))
    ) {
      const sandboxTx = getSandboxTransaction(rawAuthority || rawTrackingCode || "test");

      if (sandboxTx) {
        const now = new Date();
        const isSandboxExpired =
          sandboxTx.status === "EXPIRED" ||
          (sandboxTx.status === "PENDING" && now > sandboxTx.expiresAt);

        if (isSandboxExpired) {
          sandboxTx.status = "EXPIRED";
          return NextResponse.json(
            {
              success: false,
              isSandbox: true,
              status: "EXPIRED",
              error: "Payment window has expired",
              message: "مهلت پرداخت آزمایشی به پایان رسیده و این فاکتور منقضی شده است.",
              code: -31,
              data: {
                authority: sandboxTx.authority,
                status: "EXPIRED",
                isExpired: true,
              },
            },
            { status: 400 }
          );
        }

        if (sandboxTx.status === "CANCELLED") {
          return NextResponse.json(
            {
              success: false,
              isSandbox: true,
              status: "CANCELLED",
              error: "Payment was cancelled",
              message: "تراکنش آزمایشی توسط کاربر لغو گردیده است.",
              code: -32,
              data: {
                authority: sandboxTx.authority,
                status: "CANCELLED",
                isCancelled: true,
              },
            },
            { status: 400 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        isSandbox: true,
        status: "PAID",
        message: "تراکنش با موفقیت تایید گردید (محیط آزمایشی سندباکس).",
        data: {
          authority: sandboxTx?.authority || rawAuthority || "hp_sandbox_mock",
          trackingCode: sandboxTx?.internalTrackingCode || rawTrackingCode || "PAY-SANDBOX-14050817",
          amountToman: sandboxTx?.payableAmountToman || (Number(amount) || 50015),
          paidAt: new Date().toISOString(),
          cardLast4: "7766",
          bankTitle: "بانک قرض‌الحسنه مهر ایران",
        },
      });
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
        {
          success: false,
          error: "Transaction not found",
          message: "تراکنش مورد نظر یافت نشد.",
          code: -11,
        },
        { status: 404 }
      );
    }

    // Auto-update expiration if pending and time has passed
    const now = new Date();
    if (tx.status === "PENDING" && now > tx.expiresAt) {
      await db.transaction.update({
        where: { id: tx.id },
        data: { status: "EXPIRED" },
      });
      tx.status = "EXPIRED";
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
            message: "مبلغ ارسالی با مبلغ ثبت‌شده فاکتور تطابق ندارد.",
            expectedOriginal,
            expectedFinal,
            provided,
            code: -12,
          },
          { status: 400 }
        );
      }
    }

    const isPaid = tx.status === "PAID" || tx.status === "MANUALLY_VERIFIED";

    if (!isPaid) {
      const isExpired = tx.status === "EXPIRED";
      const isCancelled = tx.status === "CANCELLED";

      return NextResponse.json(
        {
          success: false,
          status: tx.status,
          error: isExpired
            ? "Payment window has expired"
            : isCancelled
            ? "Payment was cancelled"
            : "Payment has not been completed or verified yet",
          message: isExpired
            ? "مهلت پرداخت به پایان رسیده و این تراکنش منقضی شده است."
            : isCancelled
            ? "تراکنش توسط خریدار لغو گردیده است."
            : "پرداخت هنوز انجام یا تایید نشده است.",
          code: isExpired ? -31 : isCancelled ? -32 : -1,
          data: {
            authority: tx.authority,
            trackingCode: tx.internalTrackingCode || tx.trackingCode,
            status: tx.status,
            isExpired,
            isCancelled,
          },
        },
        { status: 400 }
      );
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
