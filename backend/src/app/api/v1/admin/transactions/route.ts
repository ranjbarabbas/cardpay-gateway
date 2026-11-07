import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "transactions"; // "transactions" | "sms_logs" | "tickets"

  if (type === "sms_logs") {
    const logs = await db.bankSmsLog.findMany({
      include: { device: true, transaction: true },
      orderBy: { receivedAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ success: true, data: logs });
  }

  if (type === "tickets") {
    const tickets = await db.discrepancyTicket.findMany({
      include: {
        smsLog: true,
        transaction: { include: { card: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: tickets });
  }

  const transactions = await db.transaction.findMany({
    include: {
      card: true,
      smsLog: true,
      tickets: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ success: true, data: transactions });
}
