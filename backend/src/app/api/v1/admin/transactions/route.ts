import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { expireOverduePendingTransactions } from "@/lib/services/plan-expiration.service";

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Auto-expire any pending transactions past the 10-minute window
  await expireOverduePendingTransactions();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "transactions"; // "transactions" | "sms_logs" | "tickets"
  const userId = searchParams.get("userId");

  if (type === "sms_logs") {
    const logs = await db.bankSmsLog.findMany({
      include: { device: { include: { user: true } }, transaction: true },
      orderBy: { receivedAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ success: true, data: logs });
  }

  if (type === "tickets") {
    const where: any = {};
    if (userId) {
      where.transaction = {
        OR: [
          { userId },
          { card: { userId } },
        ],
      };
    }

    const tickets = await db.discrepancyTicket.findMany({
      where,
      include: {
        smsLog: true,
        transaction: {
          include: {
            card: { include: { user: true } },
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: tickets });
  }

  const where: any = {};
  if (userId) {
    where.OR = [
      { userId },
      { card: { userId } },
    ];
  }

  const transactions = await db.transaction.findMany({
    where,
    include: {
      card: { include: { user: true } },
      user: true,
      smsLog: true,
      tickets: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ success: true, data: transactions });
}
