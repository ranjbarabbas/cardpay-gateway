import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendFarazSms } from "@/lib/faraz-sms";
import { sendResendEmail } from "@/lib/resend-email";

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get("honarhub_user_id")?.value;
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
    const { targetPlan } = body; // "PRO" or "SPECIAL"

    if (!["PRO", "SPECIAL"].includes(targetPlan)) {
      return NextResponse.json(
        { success: false, error: "پلن انتخابی معتبر نیست. گزینه‌ها: PRO یا SPECIAL" },
        { status: 400 }
      );
    }

    const planTitle = targetPlan === "PRO" ? "پلن حرفه‌ای (۲۹۹ هزار تومان)" : "پلن ویژه (VIP)";

    // Record lead / upgrade request in DB
    const lead = await db.leadRequest.create({
      data: {
        phone: user.phone || user.email || "بدون شماره تماس",
        name: user.name || "کاربر پنل",
        plan: targetPlan,
        status: targetPlan === "PRO" ? "UPGRADED" : "PENDING",
        notes: `درخواست ارتقای پلن از ${user.plan} به ${targetPlan} توسط کاربر (شناسه: ${user.id})`,
      },
    });

    // If upgrading to PRO, directly activate PRO plan
    let updatedUser = user;
    if (targetPlan === "PRO") {
      updatedUser = await db.user.update({
        where: { id: user.id },
        data: { plan: "PRO" },
      });
    }

    // Trigger Admin Notification alerts via Faraz SMS & Resend
    const adminMobile = process.env.ADMIN_MOBILE_ALERT;
    const adminEmail = process.env.ADMIN_EMAIL_ALERT || process.env.ADMIN_EMAILS?.split(",")[0] || "ranjbar.abbas1988@gmail.com";

    const alertMessage = `ارتقای پلن جدید هنرهاب پی!\nکاربر: ${user.name || "کاربر"} (${user.phone || user.email || "کاربر"})\nپلن جدید: ${planTitle}\nزمان: ${new Date().toLocaleTimeString("fa-IR")}`;

    if (adminMobile) {
      sendFarazSms({
        recipient: adminMobile,
        message: alertMessage,
      }).catch((e) => console.error("Admin SMS alert failed:", e));
    }

    if (adminEmail) {
      sendResendEmail({
        to: adminEmail,
        subject: `[هنرهاب پی] ارتقای پلن: ${planTitle}`,
        html: `
          <div dir="rtl" style="font-family: Tahoma, sans-serif; padding: 20px; background-color: #0F172A; color: #fff; border-radius: 12px;">
            <h2 style="color: #10b981;">درخواست ارتقای پلن کاربر در هنرهاب پی</h2>
            <p><strong>کاربر:</strong> ${user.name || "نامشخص"}</p>
            <p><strong>شماره تماس / ایمیل:</strong> ${user.phone || user.email || "ثبت نشده"}</p>
            <p><strong>پلن انتخابی:</strong> <span style="color: #38bdf8;">${planTitle}</span></p>
            <p><strong>شناسه کاربر:</strong> ${user.id}</p>
            <p><strong>تاریخ ثبت:</strong> ${new Date().toLocaleString("fa-IR")}</p>
          </div>
        `,
      }).catch((e) => console.error("Admin Email alert failed:", e));
    }

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        leadId: lead.id,
      },
      message:
        targetPlan === "PRO"
          ? "پلن حساب شما با موفقیت به «پلن حرفه‌ای» (تا ۵ کارت بانکی و ۵۰۰ تراکنش ماهانه) ارتقا یافت."
          : "درخواست ارتقا به «پلن ویژه» با موفقیت ثبت گردید. کارشناسان ما به زودی با شما تماس خواهند گرفت.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
