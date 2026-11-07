import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const senders = await db.trustedSender.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: senders });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { senderId, bankSlug = "mehr_iran", description, isTrusted = true } = body;

    if (!senderId) {
      return NextResponse.json(
        { success: false, error: "senderId is required" },
        { status: 400 }
      );
    }

    const sender = await db.trustedSender.upsert({
      where: { senderId: senderId.trim() },
      create: {
        senderId: senderId.trim(),
        bankSlug,
        description,
        isTrusted: Boolean(isTrusted),
      },
      update: {
        bankSlug,
        description,
        isTrusted: Boolean(isTrusted),
      },
    });

    return NextResponse.json({ success: true, data: sender });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
