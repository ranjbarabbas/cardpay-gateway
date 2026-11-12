import { NextRequest, NextResponse } from "next/server";
import { db, formatFriendlyDbError } from "@/lib/db";
import { isValidIranianCardNumber, isValidIranianIban, getBankByCardNumber, resolveBankDetails } from "@/lib/bank-utils";
import { getPlanLimits } from "@/lib/services/plan-expiration.service";

// POST /api/v1/user/card - Register or update card for logged in user
export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json({ success: false, error: "وارد نشده‌اید" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "کاربر یافت نشد" }, { status: 404 });
    }

    const body = await req.json();
    const { ownerName, cardNumber, accountNumber, iban, bankTitle, bankSlug, replace = false } = body;

    if (!ownerName || !cardNumber) {
      return NextResponse.json(
        { success: false, error: "نام صاحب حساب و شماره ۱۶ رقمی کارت الزامی هستند." },
        { status: 400 }
      );
    }

    const cleanCard = String(cardNumber).replace(/[^0-9]/g, "");
    const cardValidation = isValidIranianCardNumber(cleanCard);
    if (!cardValidation.valid) {
      return NextResponse.json(
        { success: false, error: cardValidation.error || "شماره کارت ۱۶ رقمی نامعتبر است." },
        { status: 400 }
      );
    }

    // Validate IBAN if provided
    let cleanIban: string | null = null;
    if (iban && String(iban).trim()) {
      const ibanValidation = isValidIranianIban(String(iban).trim());
      if (!ibanValidation.valid) {
        return NextResponse.json(
          { success: false, error: ibanValidation.error || "شماره شبا نامعتبر است." },
          { status: 400 }
        );
      }
      cleanIban = ibanValidation.formatted || null;
    }

    // Auto-detect and resolve bank details accurately
    const resolved = resolveBankDetails({
      cardNumber: cleanCard,
      iban: cleanIban,
      bankSlug,
      bankTitle,
    });
    const resolvedBankTitle = resolved.nameFa;
    const resolvedBankSlug = resolved.slug;

    // Fetch all active unarchived cards bound to this user (by userId OR merchantUserId)
    const existingActiveCards = await db.bankCard.findMany({
      where: {
        OR: [
          { userId: user.id },
          { merchantUserId: user.id },
        ],
        isArchived: false,
      },
    });

    const isExistingUserCard = existingActiveCards.some((c) => c.cardNumber === cleanCard);

    // Plan Card Quotas:
    // FREE: max 1 active card
    // PRO: max 5 active cards
    // SPECIAL: unlimited (999)
    const userPlan = (user.plan || "FREE").toUpperCase().trim();
    const planLimits = getPlanLimits(userPlan);
    const maxAllowedCards = planLimits.maxCards;

    if (!isExistingUserCard) {
      if (existingActiveCards.length >= maxAllowedCards) {
        if (!replace) {
          const planTitle = planLimits.title;
          const upgradeSuggestion =
            userPlan === "FREE"
              ? "در پلن پایه (رایگان) تنها مجاز به ثبت ۱ کارت فعال هستید. برای تعریف همزمان تا ۵ کارت بانکی به «پلن حرفه‌ای» و برای کارت‌های نامحدود به «پلن ویژه» ارتقا دهید."
              : `در ${planTitle} حداکثر مجاز به ثبت ${maxAllowedCards} کارت فعال هستید. برای افزودن کارت‌های نامحدود، لطفاً به «پلن ویژه» ارتقا دهید.`;

          return NextResponse.json(
            {
              success: false,
              error: "PLAN_UPGRADE_REQUIRED",
              message: `سقف کارت‌های فعال شما در ${planTitle} (${maxAllowedCards} کارت) تکمیل شده است. ${upgradeSuggestion}`,
              currentCount: existingActiveCards.length,
              maxAllowed: maxAllowedCards,
              plan: userPlan,
            },
            { status: 403 }
          );
        } else {
          // If explicitly replacing, archive previous cards safely
          await db.bankCard.updateMany({
            where: {
              OR: [
                { userId: user.id },
                { merchantUserId: user.id },
              ],
              cardNumber: { not: cleanCard },
              isArchived: false,
            },
            data: { isArchived: true, isActive: false, archivedAt: new Date() },
          });
        }
      }
    }

    // Upsert or create new card
    const card = await db.bankCard.upsert({
      where: { cardNumber: cleanCard },
      update: {
        ownerName,
        accountNumber: accountNumber?.trim() || null,
        iban: cleanIban,
        bankTitle: resolvedBankTitle,
        bankSlug: resolvedBankSlug,
        userId: user.id,
        merchantUserId: user.id,
        isArchived: false,
        isActive: true,
        archivedAt: null,
      },
      create: {
        ownerName,
        cardNumber: cleanCard,
        accountNumber: accountNumber?.trim() || null,
        iban: cleanIban,
        bankTitle: resolvedBankTitle,
        bankSlug: resolvedBankSlug,
        userId: user.id,
        merchantUserId: user.id,
        isActive: true,
        isArchived: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "کارت بانکی با موفقیت ثبت و به حساب شما متصل گردید.",
      data: card,
    });
  } catch (err: any) {
    console.error("[USER_CARD_ERROR]", err);
    return NextResponse.json({ success: false, error: formatFriendlyDbError(err) }, { status: 500 });
  }
}
