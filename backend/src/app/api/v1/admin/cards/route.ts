import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { isSandboxRequest } from "@/lib/sandbox";
import { isValidIranianCardNumber, isValidIranianIban, getBankByCardNumber, resolveBankDetails } from "@/lib/bank-utils";
import { getPlanLimits } from "@/lib/services/plan-expiration.service";

export async function GET(req: NextRequest) {
  const isAdmin = verifyAdminAuth(req);
  let merchantUserId: string | null = null;

  if (!isAdmin) {
    const authHeader =
      req.headers.get("x-admin-key") ||
      req.headers.get("x-api-key") ||
      req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "").trim()
      : authHeader?.trim();

    if (token) {
      const authUser = await db.user.findUnique({ where: { apiKey: token } });
      if (authUser && authUser.isActive) {
        merchantUserId = authUser.id;
      }
    }

    if (!merchantUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const where: any = {};
  if (merchantUserId) {
    where.userId = merchantUserId;
  } else if (userId) {
    where.userId = userId;
  }

  const cards = await db.bankCard.findMany({
    where,
    include: { device: true, user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: cards });
}

export async function POST(req: NextRequest) {
  // -------------------------------------------------------------
  // Sandbox Card Upsert Simulation (No DB pollution)
  // -------------------------------------------------------------
  if (isSandboxRequest(req)) {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      isSandbox: true,
      message: "کارت بانکی در محیط سندباکس با موفقیت شبیه‌سازی گردید.",
      data: {
        id: `sandbox_card_${Date.now().toString(36)}`,
        ownerName: body.ownerName || "امیر رضایی (سندباکس)",
        cardNumber: body.cardNumber || "6037991987654321",
        accountNumber: body.accountNumber || "987654321012345678",
        bankSlug: body.bankSlug || "mehr_iran",
        bankTitle: body.bankTitle || "بانک قرض‌الحسنه مهر ایران",
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    });
  }

  const isAdmin = verifyAdminAuth(req);
  let authenticatedUserId: string | null = null;
  let authenticatedUser: any = null;

  if (!isAdmin) {
    const authHeader =
      req.headers.get("x-admin-key") ||
      req.headers.get("x-api-key") ||
      req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "").trim()
      : authHeader?.trim();

    if (token) {
      const authUser = await db.user.findUnique({ where: { apiKey: token } });
      if (authUser && authUser.isActive) {
        authenticatedUserId = authUser.id;
        authenticatedUser = authUser;
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const {
      ownerName,
      cardNumber,
      accountNumber,
      iban,
      bankSlug,
      bankTitle,
      deviceId,
      merchantUserId,
      userId,
      archivePrevious = false,
    } = body;

    if (!ownerName || !cardNumber) {
      return NextResponse.json(
        { success: false, error: "ownerName and cardNumber are required" },
        { status: 400 }
      );
    }

    const cleanCard = cardNumber.replace(/[^0-9]/g, "");
    const cardValidation = isValidIranianCardNumber(cleanCard);
    if (!cardValidation.valid) {
      return NextResponse.json(
        { success: false, error: cardValidation.error || "شماره کارت ۱۶ رقمی نامعتبر است." },
        { status: 400 }
      );
    }

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

    const resolved = resolveBankDetails({
      cardNumber: cleanCard,
      iban: cleanIban,
      bankSlug,
      bankTitle,
    });
    const resolvedBankTitle = resolved.nameFa;
    const resolvedBankSlug = resolved.slug;

    // For non-admin merchants, ensure they can only bind cards to their own user ID
    const cleanUserId = (!isAdmin && authenticatedUserId)
      ? authenticatedUserId
      : (authenticatedUserId || merchantUserId || userId
        ? String(authenticatedUserId || merchantUserId || userId).trim()
        : null);

    // -------------------------------------------------------------
    // Plan Card Quotas Enforcement (FREE: 1, PRO: 5, SPECIAL: unlimited)
    // -------------------------------------------------------------
    if (cleanUserId) {
      const targetUser = authenticatedUser || (await db.user.findUnique({ where: { id: cleanUserId } }));
      if (targetUser && !isAdmin) {
        const userPlan = (targetUser.plan || "FREE").toUpperCase().trim();
        const planLimits = getPlanLimits(userPlan);
        const maxAllowedCards = planLimits.maxCards;

        // Query all existing active cards for this user
        const existingActiveCards = await db.bankCard.findMany({
          where: {
            OR: [
              { userId: cleanUserId },
              { merchantUserId: cleanUserId },
            ],
            isArchived: false,
          },
        });

        const isUpdatingExistingCard = existingActiveCards.some((c) => c.cardNumber === cleanCard);

        if (!isUpdatingExistingCard && existingActiveCards.length >= maxAllowedCards) {
          if (!archivePrevious) {
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
            // Archive previous cards to make room for new card
            await db.bankCard.updateMany({
              where: {
                OR: [
                  { userId: cleanUserId },
                  { merchantUserId: cleanUserId },
                ],
                cardNumber: { not: cleanCard },
                isArchived: false,
              },
              data: {
                isArchived: true,
                isActive: false,
                archivedAt: new Date(),
              },
            });
          }
        }
      }
    }

    // If requested explicitly, safely archive previous active cards
    if (archivePrevious && cleanUserId) {
      await db.bankCard.updateMany({
        where: {
          OR: [
            { userId: cleanUserId },
            { merchantUserId: cleanUserId },
          ],
          cardNumber: { not: cleanCard },
          isArchived: false,
        },
        data: {
          isArchived: true,
          isActive: false,
          archivedAt: new Date(),
        },
      });
    }

    const card = await db.bankCard.upsert({
      where: { cardNumber: cleanCard },
      update: {
        ownerName,
        accountNumber: accountNumber ? accountNumber.trim() : null,
        iban: cleanIban,
        bankSlug: resolvedBankSlug,
        bankTitle: resolvedBankTitle,
        ...(cleanUserId ? { merchantUserId: cleanUserId, userId: cleanUserId } : {}),
        ...(deviceId ? { deviceId } : {}),
        isActive: true,
        isArchived: false,
        archivedAt: null,
      },
      create: {
        ownerName,
        cardNumber: cleanCard,
        accountNumber: accountNumber ? accountNumber.trim() : null,
        iban: cleanIban,
        bankSlug: resolvedBankSlug,
        bankTitle: resolvedBankTitle,
        merchantUserId: cleanUserId || null,
        userId: cleanUserId || null,
        deviceId: deviceId || null,
        isActive: true,
        isArchived: false,
      },
    });

    return NextResponse.json({ success: true, data: card });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export { archiveCardHandler as DELETE } from "@/lib/services/card-archiver.service";
