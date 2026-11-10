import { NextRequest, NextResponse } from "next/server";
import { updateSandboxStatus, getSandboxTransaction } from "@/lib/sandbox";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { authority, action = "PAID" } = body;

    if (!authority) {
      return NextResponse.json(
        { success: false, error: "Authority is required for sandbox simulation." },
        { status: 400 }
      );
    }

    const targetStatus = action === "CANCELLED" ? "CANCELLED" : "PAID";
    const updated = updateSandboxStatus(authority, targetStatus);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Sandbox transaction not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      isSandbox: true,
      message:
        targetStatus === "PAID"
          ? "تراکنش سندباکس با موفقیت به عنوان پرداخت‌شده (PAID) علامت‌گذاری گردید."
          : "تراکنش سندباکس به عنوان لغوشده (CANCELLED) علامت‌گذاری گردید.",
      data: {
        authority: updated.authority,
        status: updated.status,
        trackingCode: updated.internalTrackingCode,
        paidAt: updated.paidAt ? updated.paidAt.toISOString() : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Sandbox simulation error" },
      { status: 500 }
    );
  }
}
