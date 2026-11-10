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
      callbackUrl,
      webhookUrl,
      description,
      customerMobile,
    } = body;

    const targetCardId = body.cardId || body.cartId || body.card_id || body.cart_id;
    const rawCardNumber = body.cardNumber || body.cartNumber || body.card_number || body.cart_number;
    const targetBankSlug = body.bankSlug || body.bank_slug;

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

    // Determine target card: Supports cardId/cartId, cardNumber/cartNumber, bankSlug, or auto-select default
    let targetCard = null;
    if (targetCardId) {
      targetCard = await db.bankCard.findFirst({
        where: { id: targetCardId, isActive: true, isArchived: false },
      });
      if (!targetCard) {
        return NextResponse.json(
          { success: false, error: "Specified card was not found, is inactive, or has been archived." },
          { status: 404 }
        );
      }
      if (targetCard.isFrozen) {
        return NextResponse.json(
          {
            success: false,
            error: "CARD_FROZEN",
            message: "این کارت بانکی به دلیل محدودیت یا انقضای پلن کاربری در حالت فریز قرار دارد و صدور فاکتور برای آن مقدور نیست. لطفاً اشتراک خود را تمدید فرمایید.",
          },
          { status: 403 }
        );
      }
    } else if (rawCardNumber) {
      const cleanCard = String(rawCardNumber).replace(/[^0-9]/g, "");
      targetCard = await db.bankCard.findFirst({
        where: { cardNumber: cleanCard, isActive: true, isArchived: false, isFrozen: false },
      });
      if (!targetCard) {
        return NextResponse.json(
          { success: false, error: `Card with number ${cleanCard} was not found, is inactive, archived, or frozen.` },
          { status: 404 }
        );
      }
    } else if (targetBankSlug) {
      targetCard = await db.bankCard.findFirst({
        where: { bankSlug: targetBankSlug, isActive: true, isArchived: false, isFrozen: false },
        orderBy: { createdAt: "asc" },
      });
      if (!targetCard) {
        return NextResponse.json(
          { success: false, error: `No active card found for bank slug: ${targetBankSlug}` },
          { status: 404 }
        );
      }
    } else {
      // Default: Pick the first active non-archived non-frozen card
      targetCard = await db.bankCard.findFirst({
        where: { isActive: true, isArchived: false, isFrozen: false },
        orderBy: { createdAt: "asc" },
      });
      if (!targetCard) {
        return NextResponse.json(
          { success: false, error: "No active payment cards configured in the gateway." },
          { status: 503 }
        );
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    // Check Plan Limits based on SUCCESSFUL transactions (50 monthly for FREE, 500 monthly for PRO)
    if (targetCard.userId) {
      const cardOwnerUser = await db.user.findUnique({
        where: { id: targetCard.userId },
        include: { cards: { where: { isArchived: false } } },
      });

      if (cardOwnerUser) {
        const plan = cardOwnerUser.plan || "FREE";
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const cardIds = (cardOwnerUser.cards || []).map((c) => c.id);

        if (plan === "FREE") {
          const monthlySuccessCount = await db.transaction.count({
            where: {
              OR: [
                { userId: cardOwnerUser.id },
                { cardId: targetCard.id },
                ...(cardIds.length > 0 ? [{ cardId: { in: cardIds } }] : []),
              ],
              status: { in: ["PAID", "MANUALLY_VERIFIED"] },
              createdAt: { gte: monthStart },
            },
          });

          if (monthlySuccessCount >= 50) {
            return NextResponse.json(
              {
                success: false,
                error: "MONTHLY_SUCCESSFUL_TRANSACTION_LIMIT_REACHED",
                message: "سقف ۵۰ تراکنش موفق ماهانه برای پلن پایه (همیشه رایگان) تکمیل شده است. لطفاً جهت افزایش ظرفیت و ثبت تراکنش‌های بیشتر، پلن خود را به پلن حرفه‌ای یا ویژه ارتقا دهید.",
                upgradeUrl: `${baseUrl}/portal#upgrade`,
              },
              { status: 429 }
            );
          }
        } else if (plan === "PRO") {
          const monthlySuccessCount = await db.transaction.count({
            where: {
              OR: [
                { userId: cardOwnerUser.id },
                { cardId: targetCard.id },
                ...(cardIds.length > 0 ? [{ cardId: { in: cardIds } }] : []),
              ],
              status: { in: ["PAID", "MANUALLY_VERIFIED"] },
              createdAt: { gte: monthStart },
            },
          });

          if (monthlySuccessCount >= 500) {
            return NextResponse.json(
              {
                success: false,
                error: "MONTHLY_SUCCESSFUL_TRANSACTION_LIMIT_REACHED",
                message: "سقف ۵۰۰ تراکنش موفق ماهانه برای پلن حرفه‌ای تکمیل شده است. لطفاً جهت رفع کلیه محدودیت‌ها به پلن ویژه (VIP) ارتقا دهید.",
                upgradeUrl: `${baseUrl}/portal#upgrade`,
              },
              { status: 429 }
            );
          }
        }
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

    const apiKey = req.headers.get("x-api-key");
    let apiKeyUserId = null;
    if (apiKey) {
      const authUser = await db.user.findUnique({ where: { apiKey } });
      if (authUser) apiKeyUserId = authUser.id;
    }

    const transaction = await db.transaction.create({
      data: {
        authority,
        internalTrackingCode,
        userId: targetCard.userId || apiKeyUserId || null,
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
