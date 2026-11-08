import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // APPROVED | PENDING_REVIEW | REJECTED

  const whereClause = status ? { status } : {};

  const senders = await db.trustedSender.findMany({
    where: whereClause,
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
    const { senderId, bankSlug = "mehr_iran", description, status = "APPROVED" } = body;

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
        status,
        reviewedAt: status === "APPROVED" ? new Date() : null,
      },
      update: {
        bankSlug,
        description,
        status,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: sender });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
