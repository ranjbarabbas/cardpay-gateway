import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { setUserPlanAndDuration } from "@/lib/services/plan-expiration.service";

// PATCH /api/v1/admin/users/[id] - Update user details, plan, active status
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
    const { name, phone, email, plan, durationMonths = 1, isActive, role, notes } = body;

    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ success: false, error: "کاربر یافت نشد." }, { status: 404 });
    }

    // If plan is being modified, use the dedicated plan engine that handles expiration, card freezing/unfreezing and notifications
    if (typeof plan === "string" && (plan !== existingUser.plan || durationMonths)) {
      await setUserPlanAndDuration(
        id,
        plan,
        Number(durationMonths) || 1,
        notes || "تغییر و مدیریت پلن توسط مدیر سامانه"
      );
    }

    const updateData: any = {};
    if (typeof name === "string") updateData.name = name.trim();
    if (typeof phone === "string") updateData.phone = phone.replace(/[^0-9]/g, "").trim();
    if (typeof email === "string") updateData.email = email.toLowerCase().trim();
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (typeof role === "string") updateData.role = role;

    let updatedUser;
    if (Object.keys(updateData).length > 0) {
      updatedUser = await db.user.update({
        where: { id },
        data: updateData,
      });
    } else {
      updatedUser = await db.user.findUnique({ where: { id } });
    }

    return NextResponse.json({
      success: true,
      message: "اطلاعات کاربر با موفقیت به‌روزرسانی شد.",
      data: updatedUser,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/v1/admin/users/[id] - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "کاربر یافت نشد." }, { status: 404 });
    }

    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "کاربر با موفقیت حذف شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
