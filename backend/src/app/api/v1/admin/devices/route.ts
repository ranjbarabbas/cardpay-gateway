import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const where: any = {};
  if (userId) {
    where.userId = userId;
  }

  const devices = await db.device.findMany({
    where,
    include: {
      user: true,
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
    const { name, phoneModel, userId } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Device name is required" },
        { status: 400 }
      );
    }

    // Generate secure operational sync key for the Android companion app
    const apiKey = `hp_sync_${crypto.randomBytes(24).toString("hex")}`;

    const device = await db.device.create({
      data: {
        name,
        apiKey,
        phoneModel: phoneModel || null,
        userId: userId || null,
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ success: true, data: device });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
