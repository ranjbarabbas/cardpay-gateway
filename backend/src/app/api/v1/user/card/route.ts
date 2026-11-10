import { NextRequest, NextResponse } from "next/server";
import { db, formatFriendlyDbError } from "@/lib/db";

// POST /api/v1/user/card - Register or update card for logged in user
export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get("honarhub_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ success: false, error: "وارد نشده‌اید" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { cards: { where: { isArchived: false } } },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "کاربر یافت نشد" }, { status: 404 });
    }

    const body = await req.json();
    const { ownerName, cardNumber, accountNumber, iban, bankTitle, bankSlug = "mehr_iran", replace = false } = body;

    if (!ownerName || !cardNumber) {
      return NextResponse.json(
        { success: false, error: "نام صاحب حساب و شماره ۱۶ رقمی کارت الزامی هستند." },
        { status: 400 }
      );
    }

    const cleanCard = cardNumber.replace(/[^0-9]/g, "");
    if (cleanCard.length !== 16) {
      return NextResponse.json(
        { success: false, error: "شماره کارت باید دقیقاً ۱۶ رقم باشد." },
        { status: 400 }
      );
    }

    const cleanIban = iban?.trim()
      ? (iban.trim().toUpperCase().startsWith("IR") ? iban.trim().toUpperCase() : `IR${iban.trim().replace(/[^0-9]/g, "")}`)
      : null;

    const resolvedBankTitle = bankTitle?.trim() || "بانک قرض‌الحسنه مهر ایران";

    const isExistingUserCard = user.cards.some((c) => c.cardNumber === cleanCard);

    // Plan Card Quotas:
    // FREE: max 1 active card
    // PRO: max 5 active cards
    // SPECIAL: unlimited
    if (!isExistingUserCard) {
      if (user.plan === "FREE" && user.cards.length >= 1) {
        if (!replace) {
          return NextResponse.json(
            {
              success: false,
              error: "PLAN_UPGRADE_REQUIRED",
              message: "در پلن رایگان تنها مجاز به ثبت ۱ کارت فعال هستید. برای تعریف همزمان تا ۵ کارت بانکی به «پلن حرفه‌ای» و برای کارت‌های نامحدود به «پلن ویژه» ارتقا دهید.",
            },
            { status: 403 }
          );
        } else {
          // If explicitly replacing, archive previous cards safely
          await db.bankCard.updateMany({
            where: { userId: user.id, isArchived: false },
            data: { isArchived: true, isActive: false, archivedAt: new Date() },
          });
        }
      } else if (user.plan === "PRO" && user.cards.length >= 5) {
        return NextResponse.json(
          {
            success: false,
            error: "PLAN_UPGRADE_REQUIRED",
            message: "در پلن حرفه‌ای حداکثر مجاز به ثبت ۵ کارت فعال هستید. برای افزودن کارت‌های نامحدود، لطفاً به «پلن ویژه» ارتقا دهید.",
          },
          { status: 403 }
        );
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
        bankSlug,
        userId: user.id,
        isArchived: false,
        isActive: true,
      },
      create: {
        ownerName,
        cardNumber: cleanCard,
        accountNumber: accountNumber?.trim() || null,
        iban: cleanIban,
        bankTitle: resolvedBankTitle,
        bankSlug,
        userId: user.id,
        isActive: true,
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
