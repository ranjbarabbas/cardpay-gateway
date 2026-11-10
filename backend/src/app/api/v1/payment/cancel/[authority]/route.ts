import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isSandboxRequest, updateSandboxStatus, sandboxStore } from "@/lib/sandbox";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ authority: string }> }
) {
  try {
    const { authority } = await params;

    // Check Sandbox Cancel
    if (
      isSandboxRequest(req) ||
      authority.includes("sandbox") ||
      sandboxStore.has(authority)
    ) {
      updateSandboxStatus(authority, "CANCELLED");
      return NextResponse.json({
        success: true,
        isSandbox: true,
        message: "تراکنش در محیط سندباکس لغو گردید.",
        status: "CANCELLED",
      });
    }

    const tx = await db.transaction.findFirst({
      where: {
        OR: [
          { authority },
          { internalTrackingCode: authority },
        ],
      },
    });

    if (!tx) {
      return NextResponse.json({ success: false, error: "تراکنش یافت نشد." }, { status: 404 });
    }

    if (tx.status === "PAID" || tx.status === "MANUALLY_VERIFIED") {
      return NextResponse.json({ success: false, error: "تراکنش قبلاً پرداخت شده و قابل لغو نیست." }, { status: 400 });
    }

    const updated = await db.transaction.update({
      where: { id: tx.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      success: true,
      message: "تراکنش توسط کاربر لغو گردید.",
      status: updated.status,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
