import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, description, bankSlug } = body;

    let autoDesc = description;
    if (!autoDesc) {
      if (status === "NON_BANKING") autoDesc = "سرخط غیربانکی (نادیده‌گیری دائمی آنالیز)";
      if (status === "REJECTED") autoDesc = "سرخط مسدودشده توسط مدیریت (مسدود سراسری)";
      if (status === "APPROVED") autoDesc = "سرخط رسمی تایید شده";
    }

    const updated = await db.trustedSender.update({
      where: { id },
      data: {
        ...(status ? { status, reviewedAt: new Date() } : {}),
        ...(autoDesc ? { description: autoDesc } : {}),
        ...(bankSlug ? { bankSlug } : {}),
      },
    });

    // If marked REJECTED or NON_BANKING, dismiss pending discrepancy tickets and ignore logs
    if (status === "REJECTED" || status === "NON_BANKING") {
      try {
        const relatedLogs = await db.bankSmsLog.findMany({
          where: { sender: updated.senderId },
          select: { id: true },
        });

        if (relatedLogs.length > 0) {
          const logIds = relatedLogs.map((l) => l.id);
          await db.discrepancyTicket.updateMany({
            where: {
              smsLogId: { in: logIds },
              status: "OPEN",
            },
            data: {
              status: "DISMISSED",
              notes: `بسته شده خودکار به دلیل ${status === "NON_BANKING" ? "غیربانکی اعلام شدن سرخط" : "مسدودسازی سراسری سرخط"} (${updated.senderId})`,
            },
          });

          await db.bankSmsLog.updateMany({
            where: { id: { in: logIds }, status: "UNTRUSTED_SENDER" },
            data: { status: "IGNORED" },
          });
        }
      } catch (err) {
        console.warn("[SENDERS_PATCH] Error auto-clearing tickets:", err);
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await db.trustedSender.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Sender deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
