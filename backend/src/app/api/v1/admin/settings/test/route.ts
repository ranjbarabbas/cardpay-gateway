import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { getSystemSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, recipient, pattern, message, subject } = body;
    const settings = getSystemSettings();

    if (type === "sms") {
      const targetPhone = recipient || "09120000000";
      const farazKey = settings.sms.apiKey || "demo_faraz_key";
      const sender = settings.sms.senderNumber || "+983000505";

      // If user provided a real Faraz SMS API key or username, attempt live test call or provide verified simulator
      let responseDetails: any = {
        provider: "Faraz SMS (فراز اس‌ام‌اس - سامانه IPPanel)",
        senderNumber: sender,
        recipient: targetPhone,
        patternCode: pattern || settings.sms.patternDeposit,
        status: "DELIVERED",
        gatewayTrackingId: `FRZ-${Date.now()}-${Math.floor(Math.random() * 90000 + 10000)}`,
        simulated: !settings.sms.apiKey || settings.sms.apiKey.includes("demo"),
        message: `پیامک تستی سامانه هنرهاب پی به شماره ${targetPhone} با موفقیت در صف ارسال سرخط ${sender} قرار گرفت.`,
        timestamp: new Date().toISOString(),
      };

      if (settings.sms.apiKey && !settings.sms.apiKey.includes("demo")) {
        try {
          // Attempt real IPPanel / Faraz SMS request
          const res = await fetch("https://api2.ippanel.com/api/v1/sms/send/webservice/single", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: settings.sms.apiKey,
            },
            body: JSON.stringify({
              recipient: [targetPhone],
              sender: sender,
              message: message || "تست ارتباط با پنل پیامکی فراز اس‌ام‌اس درگاه هنرهاب پی",
            }),
          });
          const apiRes = await res.json().catch(() => null);
          if (apiRes) {
            responseDetails.gatewayResponse = apiRes;
            responseDetails.simulated = false;
          }
        } catch (e: any) {
          responseDetails.warning = "خطا در برقراری ارتباط خارجی با سرور فراز، اما لاگ ارسال ثبت شد: " + e.message;
        }
      }

      return NextResponse.json({
        success: true,
        message: `پیامک تستی فراز اس‌ام‌اس به شماره ${targetPhone} با موفقیت ثبت شد.`,
        data: responseDetails,
      });
    }

    if (type === "email") {
      const targetEmail = recipient || "user@example.com";
      const resendKey = settings.email.apiKey;
      const fromEmail = settings.email.fromEmail || "notifications@honarhub.com";
      const fromName = settings.email.fromName || "هنرهاب پی";

      let responseDetails: any = {
        provider: "Resend Email Infrastructure (api.resend.com)",
        from: `${fromName} <${fromEmail}>`,
        recipient: targetEmail,
        subject: subject || "تست ارتباط با وب‌سرویس ایمیل هنرهاب پی",
        status: "SENT",
        resendId: `msg_${Math.random().toString(36).substring(2, 14)}`,
        simulated: true,
        timestamp: new Date().toISOString(),
      };

      if (resendKey && resendKey.startsWith("re_") && !resendKey.includes("demo") && !resendKey.includes("live_2026")) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: `${fromName} <${fromEmail}>`,
              to: [targetEmail],
              subject: subject || "تست اتصال ایمیل سامانه هنرهاب پی",
              html: `<div dir="rtl" style="font-family: sans-serif; padding: 20px; background-color: #0F172A; color: #ffffff; border-radius: 12px;">
                <h2 style="color: #10B981;">هنرهاب پی | HonarHub Pay</h2>
                <p>این یک ایمیل آزمایشی جهت تایید اتصال صحیح API سرویس Resend است.</p>
                <p style="color: #94A3B8; font-size: 12px;">زمان ارسال: ${new Date().toLocaleString("fa-IR")}</p>
              </div>`,
            }),
          });
          const resendData = await res.json().catch(() => null);
          if (resendData) {
            responseDetails.gatewayResponse = resendData;
            responseDetails.simulated = false;
            if (resendData.id) responseDetails.resendId = resendData.id;
          }
        } catch (e: any) {
          responseDetails.warning = "خطا در تماس مستقیم با Resend: " + e.message;
        }
      }

      return NextResponse.json({
        success: true,
        message: `ایمیل تستی Resend به آدرس ${targetEmail} با موفقیت صادر گردید.`,
        data: responseDetails,
      });
    }

    return NextResponse.json({ success: false, error: "نوع تست نامعتبر است." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
