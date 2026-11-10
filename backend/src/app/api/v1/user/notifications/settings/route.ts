import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, emailNotifyDeposit } = body;

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

    // Check if user is on PRO or SPECIAL plan
    const isProOrSpecial = user.plan === "PRO" || user.plan === "SPECIAL";
    if (!isProOrSpecial && emailNotifyDeposit === true) {
      return NextResponse.json(
        {
          success: false,
          error: "قابلیت اطلاع‌رسانی ایمیل واریزها اختصاصی کاربران پلن حرفه‌ای و ویژه می‌باشد. لطفاً ابتدا پلن خود را ارتقا دهید.",
        },
        { status: 403 }
      );
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        emailNotifyDeposit: Boolean(emailNotifyDeposit),
      },
    });

    return NextResponse.json({
      success: true,
      message: "تنظیمات اطلاع‌رسانی با موفقیت بروزرسانی شد.",
      emailNotifyDeposit: updated.emailNotifyDeposit,
    });
  } catch (error: any) {
    console.error("[USER_NOTIF_SETTINGS_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "خطا در ذخیره تنظیمات" },
      { status: 500 }
    );
  }
}
