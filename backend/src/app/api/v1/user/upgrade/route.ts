import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSystemSettings } from "@/lib/settings";
import { AmountOffsetService } from "@/lib/services/amount-offset.service";
import { generateInternalTrackingCode } from "@/lib/services/tracking-code.service";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get("honarhub_user_id")?.value;
    const body = await req.json().catch(() => ({}));
    const targetUserId = userId || body.userId;

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "وارد نشده‌اید" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "کاربر یافت نشد" }, { status: 404 });
    }

    const { targetPlan = "PRO", durationMonths = 1 } = body;

    if (!["PRO", "SPECIAL"].includes(targetPlan)) {
      return NextResponse.json(
        { success: false, error: "پلن انتخابی نامعتبر است. گزینه‌ها: PRO یا SPECIAL" },
        { status: 400 }
      );
    }

    const cleanDuration = [1, 3, 6].includes(Number(durationMonths)) ? Number(durationMonths) : 1;
    const settings = getSystemSettings();

    // Determine plan price in Toman
    let priceToman = 199000;
    if (targetPlan === "PRO") {
      if (cleanDuration === 1) priceToman = settings.pricing?.pro1MonthToman || 199000;
      else if (cleanDuration === 3) priceToman = settings.pricing?.pro3MonthsToman || 499000;
      else if (cleanDuration === 6) priceToman = settings.pricing?.pro6MonthsToman || 899000;
    } else {
      // SPECIAL (VIP)
      if (cleanDuration === 1) priceToman = settings.pricing?.special1MonthToman || 399000;
      else if (cleanDuration === 3) priceToman = settings.pricing?.special3MonthsToman || 999000;
      else if (cleanDuration === 6) priceToman = settings.pricing?.special6MonthsToman || 1799000;
    }

    // Ensure Admin Card exists in bank_cards table for payment processing
    const cleanAdminCard = (settings.adminCard?.cardNumber || "6063731099887766").replace(/[^0-9]/g, "");
    let adminBankCard = await db.bankCard.findFirst({
      where: { cardNumber: cleanAdminCard, isArchived: false },
    });

    if (!adminBankCard) {
      adminBankCard = await db.bankCard.create({
        data: {
          cardNumber: cleanAdminCard,
          ownerName: settings.adminCard?.ownerName || "هنرهاب پی (حساب رسمی مدیریت)",
          bankTitle: settings.adminCard?.bankTitle || "بانک قرض‌الحسنه مهر ایران",
          iban: settings.adminCard?.iban || "IR000000000000000000000000",
          isActive: true,
          isArchived: false,
          isFrozen: false,
        },
      });
    }

    // Resolve unique amount with dynamic offset (+11, +12, ...)
    const resolved = await AmountOffsetService.resolveUniqueAmount(adminBankCard.id, priceToman);

    const authority = crypto.randomBytes(16).toString("hex");
    const internalTrackingCode = generateInternalTrackingCode();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    const planTitle = targetPlan === "SPECIAL" ? "ویژه (VIP)" : "حرفه‌ای";
    const description = `UPGRADE_PLAN:${targetPlan}:${cleanDuration}:${user.id} | ارتقای اشتراک پلن ${planTitle} (${cleanDuration} ماهه) - خریدار: ${user.name || user.phone || user.email || "کاربر"}`;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
    const collisionLockUntil = new Date(now.getTime() + 20 * 60 * 1000); // 20 minutes

    // Create payment transaction for Admin card
    const transaction = await db.transaction.create({
      data: {
        authority,
        internalTrackingCode,
        cardId: adminBankCard.id,
        userId: user.id,
        originalAmountToman: BigInt(priceToman),
        offsetToman: resolved.offsetToman,
        finalAmountToman: resolved.finalAmountToman,
        finalAmountRial: resolved.finalAmountRial,
        status: "PENDING",
        expiresAt,
        collisionLockUntil,
        callbackUrl: `${baseUrl}/portal?upgraded=true&auth=${authority}`,
        description,
        customerMobile: user.phone || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      authority,
      paymentUrl: `/pay/${authority}`,
      amountToman: Number(resolved.finalAmountToman),
      originalAmountToman: priceToman,
      offsetToman: resolved.offsetToman,
      targetPlan,
      durationMonths: cleanDuration,
      expiresAt: expiresAt.toISOString(),
      message: `درگاه پرداخت کارت‌به‌کارت با موفقیت صادر گردید. شما ۱۰ دقیقه مهلت دارید مبلغ فاکتور را واریز فرمایید.`,
    });
  } catch (err: any) {
    console.error("[USER_UPGRADE_PAYMENT_ERROR]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
