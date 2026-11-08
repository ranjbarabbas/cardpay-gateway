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
        ...(body.isArchived !== undefined
          ? {
              isArchived: Boolean(body.isArchived),
              archivedAt: body.isArchived ? new Date() : null,
              isActive: body.isArchived ? false : (body.isActive !== undefined ? Boolean(body.isActive) : true),
            }
          : {}),
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

    // Soft delete / Archival: Preserves 100% of financial records, transaction history, and tracking codes
    const archived = await db.bankCard.update({
      where: { id },
      data: {
        isArchived: true,
        isActive: false,
        archivedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "کارت با موفقیت و با حفظ کامل کلیه سوابق مالی به آرشیو منتقل شد.",
      data: archived,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
