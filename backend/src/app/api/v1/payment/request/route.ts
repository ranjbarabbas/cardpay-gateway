import { NextRequest, NextResponse } from "next/server";
import { db, formatFriendlyDbError } from "@/lib/db";
import { AmountOffsetService } from "@/lib/services/amount-offset.service";
import { generateInternalTrackingCode } from "@/lib/services/tracking-code.service";
import { isSandboxRequest, createSandboxTransaction } from "@/lib/sandbox";
import { getSystemSettingsAsync } from "@/lib/settings";
import { getBankByCardNumber, getBankByIban, resolveBankDetails } from "@/lib/bank-utils";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const amount = body.amount;
    const callbackUrl = body.callbackUrl || body.callback_url;
    const webhookUrl = body.webhookUrl || body.webhook_url;
    const description = body.description;
    const customerMobile = body.customerMobile || body.customer_mobile || body.mobile;

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

    const settings = await getSystemSettingsAsync();
    const cardTransferLimit = settings.limits?.cardTransferLimitToman || 15000000;
    const polTransferLimit = settings.limits?.polTransferLimitToman || 100000000;
    const amountNum = Number(amount);

    if (amountNum > polTransferLimit) {
      return NextResponse.json(
        {
          success: false,
          error: "POL_TRANSFER_LIMIT_EXCEEDED",
          message: `مبلغ درخواستی (${amountNum.toLocaleString("fa-IR")} تومان) بیش از سقف مجاز سامانه انتقال پل (${(polTransferLimit / 1000000).toLocaleString("fa-IR")} میلیون تومان) است.`,
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------------------
    // Sandbox / Test Mode Handler (Isolated from Production Database)
    // -----------------------------------------------------------------
    if (isSandboxRequest(req)) {
      const sandboxTx = createSandboxTransaction({
        amount: Number(amount),
        callbackUrl,
        webhookUrl,
        customerMobile,
        description,
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
      const paymentUrl = `${baseUrl}/pay/${sandboxTx.authority}?sandbox=true`;

      return NextResponse.json({
        success: true,
        isSandbox: true,
        message:
          "درخواست پرداخت در محیط آزمایشی (سندباکس) با موفقیت ایجاد گردید.",
        data: {
          authority: sandboxTx.authority,
          trackingCode: sandboxTx.internalTrackingCode,
          paymentUrl,
          transferType: sandboxTx.transferType,
          originalAmountToman: sandboxTx.originalAmountToman,
          offsetToman: sandboxTx.offsetToman,
          payableAmountToman: sandboxTx.payableAmountToman,
          payableAmountRial: sandboxTx.payableAmountRial,
          expiresAt: sandboxTx.expiresAt.toISOString(),
          card: {
            ...sandboxTx.card,
            transferType: sandboxTx.transferType,
          },
        },
      });
    }

    // Determine caller API key early
    const authHeader =
      req.headers.get("x-api-key") ||
      req.headers.get("x-admin-key") ||
      req.headers.get("authorization");
    const rawApiKey = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "").trim()
      : authHeader?.trim();

    let authUser: any = null;
    if (rawApiKey) {
      authUser = await db.user.findUnique({ where: { apiKey: rawApiKey } });
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
    } else if (authUser) {
      // If merchant sent request without specifying card:
      // If amount > cardTransferLimit, prioritize card WITH an IBAN for POL transfer.
      // Otherwise, prioritize regular active card for Card-to-Card.
      if (amountNum > cardTransferLimit) {
        targetCard = await db.bankCard.findFirst({
          where: {
            OR: [
              { userId: authUser.id },
              { merchantUserId: authUser.id }
            ],
            isActive: true,
            isArchived: false,
            isFrozen: false,
            iban: { not: null },
          },
          orderBy: { createdAt: "desc" },
        });
      }

      if (!targetCard) {
        targetCard = await db.bankCard.findFirst({
          where: {
            OR: [
              { userId: authUser.id },
              { merchantUserId: authUser.id }
            ],
            isActive: true,
            isArchived: false,
            isFrozen: false,
          },
          orderBy: { createdAt: "desc" },
        });
      }

      if (!targetCard) {
        return NextResponse.json(
          {
            success: false,
            error: "NO_ACTIVE_CARD_FOR_USER",
            message: "هنوز کارت بانکی فعالی برای حساب کاربری شما ثبت نشده است. لطفاً ابتدا از طریق وب‌سرویس یا پنل کاربری، شماره کارت خود را ثبت فرمایید.",
          },
          { status: 400 }
        );
      }
    } else {
      // Default: Pick the first active non-archived non-frozen card (preferring IBAN if isPol)
      if (amountNum > cardTransferLimit) {
        targetCard = await db.bankCard.findFirst({
          where: { isActive: true, isArchived: false, isFrozen: false, iban: { not: null } },
          orderBy: { createdAt: "asc" },
        });
      }

      if (!targetCard) {
        targetCard = await db.bankCard.findFirst({
          where: { isActive: true, isArchived: false, isFrozen: false },
          orderBy: { createdAt: "asc" },
        });
      }

      if (!targetCard) {
        return NextResponse.json(
          { success: false, error: "No active payment cards configured in the gateway." },
          { status: 503 }
        );
      }
    }

    const isPol = amountNum > cardTransferLimit;
    if (isPol && (!targetCard.iban || !targetCard.iban.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: "CARD_TRANSFER_LIMIT_EXCEEDED",
          message: `سقف انتقال کارت به کارت در درگاه ${cardTransferLimit.toLocaleString("fa-IR")} تومان است. برای مبالغ بالاتر، فعال‌سازی سامانه انتقال پل و ثبت شماره شبا در تنظیمات کارت بانکی الزامی است.`,
        },
        { status: 400 }
      );
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

    const transaction = await db.transaction.create({
      data: {
        authority,
        internalTrackingCode,
        userId: targetCard.userId || authUser?.id || null,
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

    const resolvedBank = resolveBankDetails({
      cardNumber: targetCard.cardNumber,
      iban: targetCard.iban,
      bankSlug: targetCard.bankSlug,
      bankTitle: targetCard.bankTitle,
    });

    return NextResponse.json({
      success: true,
      data: {
        authority: transaction.authority,
        trackingCode: transaction.internalTrackingCode,
        paymentUrl,
        transferType: isPol ? "POL" : "CARD_TO_CARD",
        originalAmountToman: Number(transaction.originalAmountToman),
        offsetToman: transaction.offsetToman,
        payableAmountToman: Number(transaction.finalAmountToman),
        payableAmountRial: Number(transaction.finalAmountRial),
        expiresAt: transaction.expiresAt.toISOString(),
        card: {
          ownerName: targetCard.ownerName,
          cardNumber: targetCard.cardNumber,
          iban: targetCard.iban || null,
          accountNumber: targetCard.accountNumber || null,
          bankTitle: resolvedBank.nameFa,
          bankSlug: resolvedBank.slug,
          bankLogo: resolvedBank.logo,
          transferType: isPol ? "POL" : "CARD_TO_CARD",
        },
      },
    });
  } catch (error: unknown) {
    console.error("[PAYMENT_REQUEST_ERROR]", error);
    return NextResponse.json({ success: false, error: formatFriendlyDbError(error) }, { status: 500 });
  }
}
