import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();
    const device = await db.device.findUnique({
      where: { apiKey },
    });

    if (!device || !device.isActive) {
      return NextResponse.json({ success: false, error: "Invalid device" }, { status: 403 });
    }

    // Fetch unread notifications
    const unreadNotifications = await db.deviceNotification.findMany({
      where: {
        deviceId: device.id,
        isRead: false,
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark as read
    if (unreadNotifications.length > 0) {
      await db.deviceNotification.updateMany({
        where: {
          id: { in: unreadNotifications.map((n) => n.id) },
        },
        data: { isRead: true },
      });
    }

    return NextResponse.json({
      success: true,
      data: unreadNotifications,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
