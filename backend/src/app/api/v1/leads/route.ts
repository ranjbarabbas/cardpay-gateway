import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendFarazSms } from "@/lib/faraz-sms";
import { sendResendEmail } from "@/lib/resend-email";
import { verifyAdminAuth } from "@/lib/auth-admin";

// POST /api/v1/leads - Register interest in Premium Plan
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name, notes } = body;

    if (!phone || phone.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "لطفاً شماره تماس معتبر (مثلاً ۰۹۱۲۳۴۵۶۷۸۹) وارد فرمایید." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "").trim();

    // 1. Save lead to DB
    const lead = await db.leadRequest.create({
      data: {
        phone: cleanPhone,
        name: name?.trim() || null,
        plan: "PREMIUM",
        status: "PENDING",
        notes: notes || "درخواست مشاوره و فعال‌سازی پلن پرمیوم هنرهاب پی",
      },
    });

    // 2. Alert Admin via Faraz SMS
    const adminPhone = process.env.ADMIN_ALERT_PHONE || "09120000000";
    const smsMessage = `هنرهاب پی: درخواست جدید پلن پرمیوم ثبت شد.\nشماره تماس: ${cleanPhone}\nتاریخ: ${new Date().toLocaleDateString("fa-IR")}`;
    await sendFarazSms({
      recipient: adminPhone,
      message: smsMessage,
    });

    // 3. Alert Admin via Resend Email
    const adminEmails = (process.env.ADMIN_EMAILS || process.env.EMAILS || "admin@honarhub.ir").split(",").map((e) => e.trim());
    await sendResendEmail({
      to: adminEmails,
      subject: `🔥 لید جدید پلن پرمیوم هنرهاب پی: ${cleanPhone}`,
      html: `
        <div dir="rtl" style="font-family: Tahoma, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #059669;">درخواست فعال‌سازی پلن پرمیوم (نامحدود)</h2>
          <p>یک متقاضی جدید شماره تماس خود را در صفحه اصلی هنرهاب پی ثبت کرده است:</p>
          <ul>
            <li><strong>شماره تماس:</strong> <span style="font-size: 16px; color: #1e293b;">${cleanPhone}</span></li>
            <li><strong>نام / عنوان:</strong> ${name || "مشخص نشده"}</li>
            <li><strong>زمان ثبت:</strong> ${new Date().toLocaleString("fa-IR")}</li>
          </ul>
          <p>لطفاً در اسرع وقت جهت ارائه دسترسی نامحدود با ایشان تماس حاصل فرمایید.</p>
        </div>
      `,
    });

    // 4. Create in-app notification for all active admin devices
    const devices = await db.device.findMany({ where: { isActive: true } });
    if (devices.length > 0) {
      await db.deviceNotification.createMany({
        data: devices.map((d) => ({
          deviceId: d.id,
          title: "🔥 درخواست پلن پرمیوم جدید",
          message: `مشتری با شماره ${cleanPhone} منتظر تماس برای فعال‌سازی پلن پرمیوم است.`,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: "شماره شما با موفقیت ثبت شد. کارشناسان ما به زودی با شما تماس خواهند گرفت.",
      data: { id: lead.id, phone: lead.phone },
    });
  } catch (err: any) {
    console.error("Lead creation error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET /api/v1/leads - Fetch all leads for Admin Panel
export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const leads = await db.leadRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: leads });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
