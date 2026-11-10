import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendResendEmail } from "@/lib/resend-email";
import { getEmailOtpTemplate, getPasswordResetTemplate } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, userId, type = "EMAIL_VERIFICATION", recipientName } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "لطفاً یک آدرس ایمیل معتبر وارد نمایید." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Generate secure 5-digit OTP
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Invalidate previous active codes for this target
    await db.verificationCode.updateMany({
      where: {
        target: cleanEmail,
        type: type,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Save new code
    await db.verificationCode.create({
      data: {
        target: cleanEmail,
        code,
        type,
        expiresAt,
      },
    });

    // If userId provided, retrieve user details for personalized greeting
    let name = recipientName;
    if (!name && userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user?.name) name = user.name;
    }

    // Render HTML template based on request type
    let htmlContent: string;
    let emailSubject: string;

    if (type === "PASSWORD_RESET") {
      emailSubject = "درخواست تغییر و بازیابی رمز عبور - هنرهاب پی";
      htmlContent = getPasswordResetTemplate({
        recipientName: name || "کاربر گرامی",
        code,
        userEmail: cleanEmail,
        expiresMinutes: 5,
      });
    } else {
      // Default: OTP / Verification
      emailSubject = "کد تایید یکبار مصرف (OTP) - هنرهاب پی";
      htmlContent = getEmailOtpTemplate({
        recipientName: name || "کاربر گرامی",
        code,
        expiresMinutes: 5,
      });
    }

    // Send via Resend
    const sendResult = await sendResendEmail({
      to: cleanEmail,
      subject: emailSubject,
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      message: `کد تایید با موفقیت به ایمیل ${cleanEmail} ارسال گردید.`,
      expiresAt: expiresAt.toISOString(),
      emailDelivery: sendResult,
    });
  } catch (error: any) {
    console.error("[EMAIL_SEND_OTP_ERROR]", error);
    let errMsg = "خطا در ارسال کد تایید به ایمیل. لطفاً مجدداً تلاش نمایید.";
    if (error?.message) {
      if (
        error.message.includes("datasource `db`") ||
        error.message.includes("protocol `file:`") ||
        error.message.includes("Can't reach database server")
      ) {
        errMsg = "خطا در برقراری ارتباط با پایگاه داده. لطفاً از اتصال و تنظیم متغیر DATABASE_URL اطمینان حاصل فرمایید.";
      } else if (!error.message.includes("prisma") && !error.message.includes("invocation")) {
        errMsg = error.message;
      }
    }
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
