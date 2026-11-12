import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SmsMatcherService } from "@/lib/services/sms-matcher.service";
import { isSandboxRequest, isSandboxKey } from "@/lib/sandbox";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const deviceHeader = req.headers.get("x-device-key");
    const apiKey = (authHeader?.replace("Bearer ", "") || deviceHeader || "").trim();

    // -------------------------------------------------------------
    // Sandbox Device SMS Reception Simulation
    // -------------------------------------------------------------
    if (isSandboxRequest(req) || isSandboxKey(apiKey)) {
      const body = await req.json().catch(() => ({}));
      return NextResponse.json({
        success: true,
        isSandbox: true,
        message: "پیامک بانکی در محیط سندباکس دریافت و با موفقیت شبیه‌سازی شد.",
        data: {
          matched: true,
          status: "MATCHED",
          sender: body.sender || "B.QMEHRIRAN",
          parsedAmountToman: 50015,
          parsedAccount: "111122223333444455",
          referenceCode: `REF${Date.now().toString().slice(-6)}`,
          receivedAt: new Date().toISOString(),
        },
      });
    }

    const effectiveDeviceKey = (authHeader?.replace("Bearer ", "") || deviceHeader || "").trim();

    if (!effectiveDeviceKey) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid device key (Bearer token or x-device-key required)" },
        { status: 401 }
      );
    }

    // Verify Device
    const device = await db.device.findUnique({
      where: { apiKey: effectiveDeviceKey },
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

    // Intercept connection test / ping pings so they are never recorded as transactions
    const cleanSenderUpper = String(sender).trim().toUpperCase();
    const isPing =
      cleanSenderUpper === "TEST_PING" ||
      cleanSenderUpper === "PING" ||
      cleanSenderUpper === "TEST" ||
      String(rawText).includes("Connection test from HonarHub Pay");

    if (isPing) {
      return NextResponse.json({
        success: true,
        isPing: true,
        message: "تست اتصال و پینگ سرور با موفقیت تایید شد.",
        data: {
          matched: false,
          status: "PING_OK",
          deviceId: device.id,
          deviceName: device.name,
        },
      });
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
