import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { isSandboxRequest } from "@/lib/sandbox";

/**
 * Universal Card Soft-Delete / Archival Service
 * Accepts either cardNumber or cardId (via body or query params)
 * Preserves 100% of financial records and transaction references.
 */
export async function archiveCardHandler(req: NextRequest) {
  try {
    // 1. Extract params from JSON body or URL Query
    let body: any = {};
    if (req.method !== "GET") {
      body = await req.json().catch(() => ({}));
    }

    const { searchParams } = new URL(req.url);
    const rawCardNumber =
      body.cardNumber ||
      body.card_number ||
      searchParams.get("cardNumber") ||
      searchParams.get("card_number");
    const rawCardId =
      body.cardId ||
      body.id ||
      body.card_id ||
      searchParams.get("cardId") ||
      searchParams.get("id");

    if (!rawCardNumber && !rawCardId) {
      return NextResponse.json(
        {
          success: false,
          error: "Either cardNumber or cardId is required to delete/archive a card.",
          message: "ارسال شماره کارت (cardNumber) یا شناسه کارت (cardId) جهت حذف نرم الزامی است.",
          code: -40,
        },
        { status: 400 }
      );
    }

    // 2. Authentication Check (Merchant API Key, Admin Key, or Active Session)
    let authenticatedUserId: string | null = null;
    let isAdmin = verifyAdminAuth(req);

    if (!isAdmin) {
      // Check Merchant or User API Key
      const authHeader =
        req.headers.get("x-api-key") ||
        req.headers.get("x-admin-key") ||
        req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.replace("Bearer ", "").trim()
        : authHeader?.trim();

      if (token) {
        const user = await db.user.findUnique({ where: { apiKey: token } });
        if (user && user.isActive) {
          authenticatedUserId = user.id;
          if (user.role === "ADMIN") isAdmin = true;
        }
      }

      // Check User Cookie Session
      if (!authenticatedUserId) {
        const cookieUserId = req.cookies.get("honarhub_user_id")?.value;
        if (cookieUserId) {
          const user = await db.user.findUnique({ where: { id: cookieUserId } });
          if (user && user.isActive) {
            authenticatedUserId = user.id;
            if (user.role === "ADMIN") isAdmin = true;
          }
        }
      }
    }

    // 3. Sandbox Mode Simulation
    if (
      isSandboxRequest(req) ||
      rawCardId?.includes("sandbox") ||
      rawCardNumber?.includes("sandbox")
    ) {
      return NextResponse.json({
        success: true,
        isSandbox: true,
        message: "کارت بانکی در محیط سندباکس با موفقیت حذف نرم (آرشیو) گردید.",
        data: {
          id: rawCardId || "sandbox_card_archived",
          cardNumber: rawCardNumber || "6037991987654321",
          ownerName: "حساب آزمایشی سندباکس",
          bankTitle: "بانک قرض‌الحسنه مهر ایران",
          isArchived: true,
          isActive: false,
          archivedAt: new Date().toISOString(),
        },
      });
    }

    // Allow local development without strict auth if on localhost/dev
    const host = req.headers.get("host") || "";
    const isLocal =
      host.includes("localhost") ||
      host.includes("127.0.0.1") ||
      process.env.NODE_ENV !== "production";

    if (!isAdmin && !authenticatedUserId && !isLocal) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "برای حذف کارت باید کلید دسترسی (x-api-key یا x-admin-key) ارسال فرمایید.",
          code: -401,
        },
        { status: 401 }
      );
    }

    // 4. Locate Card in Database
    const cleanCard = rawCardNumber ? String(rawCardNumber).replace(/[^0-9]/g, "") : null;

    const card = await db.bankCard.findFirst({
      where: {
        OR: [
          ...(rawCardId ? [{ id: String(rawCardId).trim() }] : []),
          ...(cleanCard ? [{ cardNumber: cleanCard }] : []),
        ],
      },
    });

    if (!card) {
      return NextResponse.json(
        {
          success: false,
          error: "Card not found",
          message: "کارت بانکی با مشخصات ارسالی یافت نشد.",
          code: -44,
        },
        { status: 404 }
      );
    }

    // Ownership Verification (Non-admin merchants can only delete their own cards)
    if (
      !isAdmin &&
      !isLocal &&
      card.userId &&
      card.userId !== authenticatedUserId &&
      card.merchantUserId !== authenticatedUserId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You cannot archive a card belonging to another account.",
          message: "شما مجاز به حذف کارتی که متعلق به حساب کاربری شما نیست نمی‌باشید.",
          code: -403,
        },
        { status: 403 }
      );
    }

    // 5. Execute Soft Delete (Archival)
    const archived = await db.bankCard.update({
      where: { id: card.id },
      data: {
        isArchived: true,
        isActive: false,
        archivedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "کارت بانکی با موفقیت حذف نرم (آرشیو) گردید و کلیه سوابق مالی و تراکنش‌های آن حفظ شد.",
      data: {
        id: archived.id,
        cardNumber: archived.cardNumber,
        ownerName: archived.ownerName,
        bankTitle: archived.bankTitle,
        bankSlug: archived.bankSlug,
        isArchived: archived.isArchived,
        isActive: archived.isActive,
        archivedAt: archived.archivedAt?.toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
