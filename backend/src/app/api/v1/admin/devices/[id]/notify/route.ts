import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: deviceId } = await params;
    const body = await req.json();
    const { title, message } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: "Title and message are required" },
        { status: 400 }
      );
    }

    const device = await db.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      return NextResponse.json(
        { success: false, error: "Device not found" },
        { status: 404 }
      );
    }

    const notification = await db.deviceNotification.create({
      data: {
        deviceId,
        title,
        message,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: `نوتیفیکیشن برای دستگاه ${device.name} با موفقیت صف‌بندی شد.`,
      data: notification,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
