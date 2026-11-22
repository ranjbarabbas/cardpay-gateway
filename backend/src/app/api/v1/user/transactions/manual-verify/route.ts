import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dispatchDepositNotifications } from "@/lib/notifications";
import { checkAndProcessPlanUpgradeTransaction } from "@/lib/services/plan-expiration.service";
import { updateSandboxStatus } from "@/lib/sandbox";

// POST /api/v1/user/transactions/manual-verify
// Allows a merchant/user to manually verify a pending/unpaid transaction belonging to them.
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user via Cookie or API Key
    let userId = req.cookies.get("honarhub_user_id")?.value;
    if (!userId) {
      const authHeader =
        req.headers.get("x-api-key") ||
        req.headers.get("x-admin-key") ||
        req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.replace("Bearer ", "").trim()
        : authHeader?.trim();

      if (token) {
        const authUser = await db.user.findUnique({ where: { apiKey: token } });
        if (authUser && authUser.isActive) {
          userId = authUser.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "وارد نشده‌اید." }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { cards: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "کاربر یافت نشد." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { transactionId, authority } = body;

    if (!transactionId && !authority) {
      return NextResponse.json(
        { success: false, error: "ارسال شناسه یا شناسه پرداخت (authority) تراکنش الزامی است." },
        { status: 400 }
      );
    }

    // 2. Check Sandbox Transaction
    if (authority?.startsWith("hp_sandbox_") || transactionId?.startsWith("hp_sandbox_")) {
      const authKey = authority || transactionId;
      const updatedSandbox = updateSandboxStatus(authKey, "PAID");
      if (updatedSandbox) {
        updatedSandbox.status = "MANUALLY_VERIFIED" as any;
        return NextResponse.json({
          success: true,
          isSandbox: true,
          message: "تراکنش سندباکس به صورت دستی تایید شد.",
          data: {
            authority: updatedSandbox.authority,
            status: "MANUALLY_VERIFIED",
          },
        });
      }
    }

    // 3. Find Transaction in Database
    const tx = await db.transaction.findFirst({
      where: {
        OR: [
          ...(transactionId ? [{ id: transactionId }] : []),
          ...(authority ? [{ authority }] : []),
          ...(transactionId ? [{ internalTrackingCode: transactionId }] : []),
        ],
      },
      include: { card: true },
    });

    if (!tx) {
      return NextResponse.json(
        { success: false, error: "تراکنش مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    // 4. Verify Ownership: Transaction must belong to this user or their cards
    const userCardIds = user.cards.map((c) => c.id);
    const isOwner =
      tx.userId === user.id ||
      (tx.cardId && userCardIds.includes(tx.cardId)) ||
      user.role === "ADMIN";

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "شما دسترسی به تغییر وضعیت این تراکنش را ندارید." },
        { status: 403 }
      );
    }

    // 5. Check if already paid or manually verified (once paid, cannot be modified)
    if (tx.status === "PAID" || tx.status === "MANUALLY_VERIFIED") {
      return NextResponse.json(
        {
          success: false,
          error: "این تراکنش قبلاً با موفقیت پرداخت یا تایید شده است و امکان تغییر وضعیت آن وجود ندارد.",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const manualTrackingCode =
      tx.trackingCode || `MANUAL-${Date.now().toString().slice(-8)}`;

    // 6. Update transaction to MANUALLY_VERIFIED
    const updatedTx = await db.transaction.update({
      where: { id: tx.id },
      data: {
        status: "MANUALLY_VERIFIED",
        paidAt: now,
        trackingCode: manualTrackingCode,
      },
    });

    // 7. Dispatch notifications & process plan upgrades if applicable
    dispatchDepositNotifications({
      transactionId: tx.id,
      trackingCode: manualTrackingCode,
      amountToman: tx.finalAmountToman,
      cardId: tx.cardId,
      userId: user.id,
    }).catch((err) => console.error("Manual verify deposit notification error:", err));

    checkAndProcessPlanUpgradeTransaction(tx.id).catch((err) =>
      console.error("Manual verify plan upgrade error:", err)
    );

    return NextResponse.json({
      success: true,
      message: "تراکنش با موفقیت به عنوان «تایید دستی» ثبت گردید.",
      data: {
        id: updatedTx.id,
        authority: updatedTx.authority,
        status: updatedTx.status,
        trackingCode: updatedTx.trackingCode,
        paidAt: updatedTx.paidAt,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "خطای داخلی سرور";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
