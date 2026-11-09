import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
    const { ownerName, cardNumber, accountNumber, iban, bankTitle = "بانک قرض‌الحسنه مهر ایران", bankSlug = "mehr_iran" } = body;

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

    // Free plan quota check (1 active card max)
    if (user.plan === "FREE" && user.cards.length >= 1) {
      // Automatically archive previous card so user safely replaces without losing history
      await db.bankCard.updateMany({
        where: { userId: user.id, isArchived: false },
        data: { isArchived: true, isActive: false, archivedAt: new Date() },
      });
    }

    // Upsert or create new card
    const card = await db.bankCard.upsert({
      where: { cardNumber: cleanCard },
      update: {
        ownerName,
        accountNumber: accountNumber?.trim() || null,
        iban: iban?.trim() || null,
        bankTitle,
        bankSlug,
        userId: user.id,
        isArchived: false,
        isActive: true,
      },
      create: {
        ownerName,
        cardNumber: cleanCard,
        accountNumber: accountNumber?.trim() || null,
        iban: iban?.trim() || null,
        bankTitle,
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
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
