import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { getSystemSettings } from "@/lib/settings";
import { sendFarazPatternSms, sendFarazSms } from "@/lib/faraz-sms";
import { sendResendEmail } from "@/lib/resend-email";

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, recipient, pattern, subject } = body;
    const settings = getSystemSettings();

    // -------------------------------------------------------------
    // 1. LIVE SMS TEST VIA FARAZ SMS
    // -------------------------------------------------------------
    if (type === "sms") {
      const targetPhone = recipient || "";
      const farazKey = (settings.sms.apiKey || "").trim();

      if (!targetPhone || targetPhone.length < 10) {
        return NextResponse.json(
          {
            success: false,
            error: "شماره موبایل گیرنده تست نامعتبر است. لطفاً یک شماره موبایل معتبر ۱۱ رقمی وارد نمایید.",
          },
          { status: 400 }
        );
      }

      if (!farazKey || farazKey.includes("demo") || farazKey === "your-faraz-sms-api-key") {
        return NextResponse.json(
          {
            success: false,
            error: "کلید API وب‌سرویس فراز اس‌ام‌اس تنظیم نشده است. لطفاً ابتدا کلید معتبر را در فیلد مربوطه وارد و دکمه «ذخیره تنظیمات» را بزنید.",
          },
          { status: 400 }
        );
      }

      if (!settings.sms.enabled) {
        return NextResponse.json(
          {
            success: false,
            error: "ارسال پیامک در تنظیمات سامانه غیرفعال است. لطفاً تیک «فعال‌سازی سامانه پیامک» را بزنید و ذخیره نمایید.",
          },
          { status: 400 }
        );
      }

      const patternCode = pattern || settings.sms.patternOtp || "hnr_otp_v1";

      const result = await sendFarazPatternSms({
        recipient: targetPhone,
        patternCode: patternCode,
        variables: {
          code: "12345",
          amount: "50,000",
          track: "TEST-LIVE",
        },
      });

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || "خطا در ارسال پیامک از طریق درگاه فراز اس‌ام‌اس",
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `پیامک تستی فراز اس‌ام‌اس با موفقیت به سرور مخابراتی تحویل داده شد (شناسه پیام: ${result.messageId}).`,
        data: {
          provider: "فراز اس‌ام‌اس (IPPanel / IranPayamak)",
          recipient: targetPhone,
          patternCode: patternCode,
          gatewayTrackingId: result.messageId,
          status: "DELIVERED_TO_GATEWAY",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // -------------------------------------------------------------
    // 2. LIVE EMAIL TEST VIA RESEND
    // -------------------------------------------------------------
    if (type === "email") {
      const targetEmail = recipient || "";
      const resendKey = (settings.email.apiKey || "").trim();

      if (!targetEmail || !targetEmail.includes("@")) {
        return NextResponse.json(
          {
            success: false,
            error: "آدرس ایمیل گیرنده نامعتبر است. لطفاً یک ایمیل معتبر وارد نمایید.",
          },
          { status: 400 }
        );
      }

      if (!resendKey || resendKey.includes("demo") || !resendKey.startsWith("re_")) {
        return NextResponse.json(
          {
            success: false,
            error: "کلید API سرویس Resend تنظیم نشده یا نامعتبر است (کلید باید با re_ شروع شود). لطفاً ابتدا کلید معتبر را در فیلد مربوطه وارد و ذخیره فرمایید.",
          },
          { status: 400 }
        );
      }

      if (!settings.email.enabled) {
        return NextResponse.json(
          {
            success: false,
            error: "ارسال ایمیل در تنظیمات سامانه غیرفعال است. لطفاً تیک «فعال‌سازی ارسال ایمیل» را بزنید و ذخیره نمایید.",
          },
          { status: 400 }
        );
      }

      const result = await sendResendEmail({
        to: targetEmail,
        subject: subject || "تست اتصال ایمیل سامانه هنرهاب پی",
        html: `<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; background-color: #0F172A; color: #ffffff; border-radius: 12px; border: 1px solid #1E293B;">
          <h2 style="color: #10B981; margin-top: 0; font-size: 20px;">هنرهاب پی | HonarHub Pay</h2>
          <p style="font-size: 14px; line-height: 1.8; color: #E2E8F0;">این یک ایمیل آزمایشی زنده است که مستقیماً از طریق وب‌سرویس Resend ارسال گردیده است تا از اتصال صحیح کلید API و سرور ایمیل در محیط عملیاتی اطمینان حاصل شود.</p>
          <div style="background-color: #1E293B; padding: 12px 16px; border-radius: 8px; margin: 16px 0; font-family: monospace; font-size: 12px; color: #38BDF8;">
            وضعیت: اتصال تایید شده (Live Verified)
          </div>
          <p style="color: #94A3B8; font-size: 11px; margin-bottom: 0;">زمان ارسال: ${new Date().toLocaleString("fa-IR")}</p>
        </div>`,
      });

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || "خطا در تحویل ایمیل به وب‌سرویس Resend",
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `ایمیل آزمایشی با موفقیت به سرور Resend تحویل داده شد (شناسه پیام: ${result.id}).`,
        data: {
          provider: "Resend Email Infrastructure (api.resend.com)",
          recipient: targetEmail,
          resendId: result.id,
          status: "ACCEPTED_BY_RESEND",
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ success: false, error: "نوع تست نامعتبر است." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
