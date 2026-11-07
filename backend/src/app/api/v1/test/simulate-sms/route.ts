import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SmsMatcherService } from "@/lib/services/sms-matcher.service";
import { verifyAdminAuth } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sender, rawText, deviceId } = body;

    if (!sender || !rawText) {
      return NextResponse.json(
        { success: false, error: "sender and rawText are required" },
        { status: 400 }
      );
    }

    // Auto-pick first active device if not provided
    let activeDeviceId = deviceId;
    if (!activeDeviceId) {
      const dev = await db.device.findFirst({ where: { isActive: true } });
      activeDeviceId = dev?.id;
    }

    const result = await SmsMatcherService.processIncomingSms({
      sender,
      rawText,
      deviceId: activeDeviceId,
      receivedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
