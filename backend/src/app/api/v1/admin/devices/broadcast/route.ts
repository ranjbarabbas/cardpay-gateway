import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, message } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: "عنوان و متن اعلان الزامی است." },
        { status: 400 }
      );
    }

    const devices = await db.device.findMany({
      where: { isActive: true },
    });

    if (devices.length === 0) {
      return NextResponse.json(
        { success: false, error: "هیچ دستگاه فعالی در سامانه ثبت نشده است." },
        { status: 404 }
      );
    }

    const notifications = await db.deviceNotification.createMany({
      data: devices.map((device) => ({
        deviceId: device.id,
        title: title.trim(),
        message: message.trim(),
        isRead: false,
      })),
    });

    return NextResponse.json({
      success: true,
      message: `اعلان همگانی با موفقیت برای تمامی ${devices.length} دستگاه فعال ارسال گردید.`,
      count: devices.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
