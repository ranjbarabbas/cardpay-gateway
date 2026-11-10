import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, emailNotifyDeposit, smsNotifyDeposit } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "شناسه کاربر الزامی است." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "کاربر یافت نشد." },
        { status: 404 }
      );
    }

    const isProOrSpecial = user.plan === "PRO" || user.plan === "SPECIAL";
    const isSpecial = user.plan === "SPECIAL";

    // Validate email deposit notifications (PRO or SPECIAL)
    if (emailNotifyDeposit !== undefined && emailNotifyDeposit === true && !isProOrSpecial) {
      return NextResponse.json(
        {
          success: false,
          error: "قابلیت اطلاع‌رسانی ایمیل واریزها اختصاصی کاربران پلن حرفه‌ای و ویژه می‌باشد. لطفاً ابتدا پلن خود را ارتقا دهید.",
        },
        { status: 403 }
      );
    }

    // Validate SMS deposit notifications (SPECIAL / VIP only)
    if (smsNotifyDeposit !== undefined && smsNotifyDeposit === true && !isSpecial) {
      return NextResponse.json(
        {
          success: false,
          error: "قابلیت اطلاع‌رسانی پیامکی واریزها مختص پلن ویژه (VIP) می‌باشد. لطفاً ابتدا به پلن ویژه ارتقا دهید.",
        },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (emailNotifyDeposit !== undefined) {
      updateData.emailNotifyDeposit = Boolean(emailNotifyDeposit);
    }
    if (smsNotifyDeposit !== undefined) {
      updateData.smsNotifyDeposit = Boolean(smsNotifyDeposit);
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "تنظیمات اطلاع‌رسانی با موفقیت بروزرسانی شد.",
      emailNotifyDeposit: updated.emailNotifyDeposit,
      smsNotifyDeposit: updated.smsNotifyDeposit,
    });
  } catch (error: any) {
    console.error("[USER_NOTIF_SETTINGS_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "خطا در ذخیره تنظیمات" },
      { status: 500 }
    );
  }
}
