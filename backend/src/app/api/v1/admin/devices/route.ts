import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const devices = await db.device.findMany({
    include: {
      cards: true,
      _count: { select: { smsLogs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: devices });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phoneModel } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Device name is required" },
        { status: 400 }
      );
    }

    // Generate secure random API key for the Android device
    const apiKey = `dev_${crypto.randomBytes(24).toString("hex")}`;

    const device = await db.device.create({
      data: {
        name,
        apiKey,
        phoneModel: phoneModel || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: device });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
