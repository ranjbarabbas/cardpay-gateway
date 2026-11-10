import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendFarazSms } from "@/lib/faraz-sms";
import { sendResendEmail } from "@/lib/resend-email";
import { setUserPlanAndDuration, getPlanLimits } from "@/lib/services/plan-expiration.service";

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
    const { targetPlan, durationMonths = 1, trackingCode, amountToman } = body; // "PRO" or "SPECIAL"

    if (!["PRO", "SPECIAL"].includes(targetPlan)) {
      return NextResponse.json(
        { success: false, error: "پلن انتخابی معتبر نیست. گزینه‌ها: PRO یا SPECIAL" },
        { status: 400 }
      );
    }

    const cleanDuration = [1, 3, 12].includes(Number(durationMonths)) ? Number(durationMonths) : 1;
    const planLimits = getPlanLimits(targetPlan);
    const planTitle = `${planLimits.title} (${cleanDuration} ماهه)`;

    // Record lead / upgrade request in DB
    const lead = await db.leadRequest.create({
      data: {
        phone: user.phone || user.email || "بدون شماره تماس",
        name: user.name || "کاربر پنل",
        plan: targetPlan,
        durationMonths: cleanDuration,
        amountToman: amountToman ? Number(amountToman) : null,
        trackingCode: trackingCode ? String(trackingCode).trim() : null,
        status: targetPlan === "PRO" ? "UPGRADED" : "PENDING",
        notes: `درخواست ارتقای پلن به ${planTitle} توسط کاربر. کد رهگیری: ${trackingCode || "ثبت نشده"}`,
      },
    });

    // If upgrading to PRO, directly activate PRO plan with selected duration
    let updatedUser = user;
    if (targetPlan === "PRO") {
      updatedUser = await setUserPlanAndDuration(
        user.id,
        "PRO",
        cleanDuration,
        `ارتقا به پلن حرفه‌ای ${cleanDuration} ماهه با کد رهگیری ${trackingCode || "مستقیم"}`
      );
    }

    // Trigger Admin Notification alerts via Faraz SMS & Resend
    const adminMobile = process.env.ADMIN_MOBILE_ALERT;
    const adminEmail = process.env.ADMIN_EMAIL_ALERT || process.env.ADMIN_EMAILS?.split(",")[0] || "ranjbar.abbas1988@gmail.com";

    const alertMessage = `درخواست ارتقای پلن هنرهاب پی!\nکاربر: ${user.name || "کاربر"} (${user.phone || user.email || "کاربر"})\nپلن انتخابی: ${planTitle}\nمدت: ${cleanDuration} ماهه\nکد رهگیری فیش: ${trackingCode || "—"}\nزمان: ${new Date().toLocaleTimeString("fa-IR")}`;

    if (adminMobile) {
      sendFarazSms({
        recipient: adminMobile,
        message: alertMessage,
      }).catch((e) => console.error("Admin SMS alert failed:", e));
    }

    if (adminEmail) {
      sendResendEmail({
        to: adminEmail,
        subject: `[هنرهاب پی] درخواست ارتقای پلن: ${planTitle}`,
        html: `
          <div dir="rtl" style="font-family: Tahoma, sans-serif; padding: 20px; background-color: #0F172A; color: #fff; border-radius: 12px; line-height: 1.8;">
            <h2 style="color: #10b981;">درخواست ارتقای پلن در هنرهاب پی</h2>
            <p><strong>کاربر:</strong> ${user.name || "نامشخص"}</p>
            <p><strong>شماره تماس / ایمیل:</strong> ${user.phone || user.email || "ثبت نشده"}</p>
            <p><strong>پلن انتخابی:</strong> <span style="color: #38bdf8;">${planTitle}</span></p>
            <p><strong>مدت زمان:</strong> ${cleanDuration} ماهه</p>
            <p><strong>کد رهگیری فیش واریز:</strong> ${trackingCode || "ثبت نشده"}</p>
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
          ? `پلن حساب شما با موفقیت به «پلن حرفه‌ای» (${cleanDuration} ماهه) ارتقا یافت.`
          : `درخواست ارتقای ${cleanDuration} ماهه به «پلن ویژه» با موفقیت ثبت شد. مدیریت پس از تایید فیش واریزی آن را فعال خواهد کرد.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
