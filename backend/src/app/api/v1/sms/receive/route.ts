import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SmsMatcherService } from "@/lib/services/sms-matcher.service";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();

    // Verify Device
    const device = await db.device.findUnique({
      where: { apiKey },
    });

    if (!device || !device.isActive) {
      return NextResponse.json(
        { success: false, error: "Unauthorized or disabled sync device" },
        { status: 403 }
      );
    }

    // Update last seen
    await db.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    const body = await req.json();
    const { sender, rawText, receivedAt } = body;

    if (!sender || !rawText) {
      return NextResponse.json(
        { success: false, error: "Sender and rawText are required fields" },
        { status: 400 }
      );
    }

    const result = await SmsMatcherService.processIncomingSms({
      sender,
      rawText,
      deviceId: device.id,
      receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
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
