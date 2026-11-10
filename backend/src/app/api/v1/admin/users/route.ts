import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { checkAndEnforcePlanExpirations } from "@/lib/services/plan-expiration.service";

// GET /api/v1/admin/users - List all registered users
export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Automatically check and enforce any expired plans
    await checkAndEnforcePlanExpirations();

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        cards: { where: { isArchived: false } },
        devices: true,
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        phone: u.phone,
        email: u.email,
        name: u.name,
        role: u.role,
        plan: u.plan,
        planExpiresAt: u.planExpiresAt,
        planDurationMonths: u.planDurationMonths,
        apiKey: u.apiKey,
        isActive: u.isActive,
        createdAt: u.createdAt,
        activeCardsCount: u.cards.filter((c) => c.isActive && !c.isFrozen).length,
        frozenCardsCount: u.cards.filter((c) => c.isFrozen).length,
        devicesCount: u.devices.length,
        transactionsCount: u._count.transactions,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/v1/admin/users - Admin create user
export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { phone, email, name, plan = "FREE", role = "USER" } = body;

    if (!phone && !email) {
      return NextResponse.json(
        { success: false, error: "حداقل شماره تماس یا ایمیل باید مشخص شود." },
        { status: 400 }
      );
    }

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, "").trim() : null;
    const cleanEmail = email ? email.toLowerCase().trim() : null;
    const userApiKey = `hp_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;

    const user = await db.user.create({
      data: {
        phone: cleanPhone,
        email: cleanEmail,
        name: name || (cleanPhone ? `کاربر ${cleanPhone.slice(-4)}` : "کاربر جدید"),
        plan,
        role,
        apiKey: userApiKey,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
