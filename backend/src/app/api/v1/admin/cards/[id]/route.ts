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

    const updated = await db.bankCard.update({
      where: { id },
      data: {
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
        ...(body.ownerName ? { ownerName: body.ownerName } : {}),
        ...(body.accountNumber !== undefined ? { accountNumber: body.accountNumber } : {}),
        ...(body.iban !== undefined ? { iban: body.iban } : {}),
        ...(body.deviceId !== undefined ? { deviceId: body.deviceId } : {}),
      },
    });

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

    const existing = await db.bankCard.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "کارت مورد نظر یافت نشد" }, { status: 404 });
    }

    // Cascade delete any transactions and discrepancy tickets linked to this card
    const txs = await db.transaction.findMany({
      where: { cardId: id },
      select: { id: true },
    });
    const txIds = txs.map((t) => t.id);

    if (txIds.length > 0) {
      await db.discrepancyTicket.deleteMany({
        where: { transactionId: { in: txIds } },
      });
      await db.transaction.deleteMany({
        where: { cardId: id },
      });
    }

    await db.bankCard.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "کارت با موفقیت حذف شد" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
