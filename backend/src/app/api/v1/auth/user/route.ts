import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/v1/auth/user - Login or Register with Phone or Email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email, name } = body;

    if (!phone && !email) {
      return NextResponse.json(
        { success: false, error: "لطفاً شماره موبایل یا ایمیل خود را وارد نمایید." },
        { status: 400 }
      );
    }

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, "").trim() : null;
    const cleanEmail = email ? email.toLowerCase().trim() : null;

    // Find existing user by phone or email
    let user = await db.user.findFirst({
      where: {
        OR: [
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
      include: {
        cards: { where: { isArchived: false } },
        devices: true,
      },
    });

    if (!user) {
      // Create new user in FREE plan
      const userApiKey = `hp_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
      user = await db.user.create({
        data: {
          phone: cleanPhone,
          email: cleanEmail,
          name: name || (cleanPhone ? `کاربر ${cleanPhone.slice(-4)}` : "کاربر هنرهاب"),
          plan: "FREE",
          role: "USER",
          apiKey: userApiKey,
        },
        include: {
          cards: true,
          devices: true,
        },
      });
    }

    // Ensure companion sync device is automatically provisioned for the user
    let userDevices = user.devices || [];
    if (userDevices.length === 0) {
      const deviceApiKey = `dev_sec_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36).substring(4)}`;
      const newDevice = await db.device.create({
        data: {
          name: `گوشی همراه ${user.name || "کاربر"}`,
          apiKey: deviceApiKey,
          userId: user.id,
          isActive: true,
        },
      });
      userDevices = [newDevice];
    }

    const response = NextResponse.json({
      success: true,
      message: "ورود موفقیت‌آمیز بود.",
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        plan: user.plan,
        role: user.role,
        apiKey: user.apiKey,
        activeCardsCount: user.cards?.length || 0,
        activeDevicesCount: userDevices.length,
      },
    });

    // Set cookie for session persistence
    response.cookies.set("honarhub_user_id", user.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false, // Accessible to client portal UI
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    console.error("Auth user error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET /api/v1/auth/user - Get current logged in user details
export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get("honarhub_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ success: false, error: "وارد نشده‌اید" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        cards: { where: { isArchived: false } },
        devices: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { card: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Automatically provision companion device if user has none
    let userDevices = user.devices || [];
    if (userDevices.length === 0) {
      const deviceApiKey = `dev_sec_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36).substring(4)}`;
      const newDevice = await db.device.create({
        data: {
          name: `گوشی همراه ${user.name || "کاربر"}`,
          apiKey: deviceApiKey,
          userId: user.id,
          isActive: true,
        },
      });
      userDevices = [newDevice];
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const cardIds = user.cards.map((c) => c.id);

    // Count only SUCCESSFUL transactions (PAID or MANUALLY_VERIFIED) for quota
    const monthlySuccessfulTxCount = await db.transaction.count({
      where: {
        OR: [
          { userId: user.id },
          ...(cardIds.length > 0 ? [{ cardId: { in: cardIds } }] : []),
        ],
        status: { in: ["PAID", "MANUALLY_VERIFIED"] },
        createdAt: { gte: monthStart },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        plan: user.plan,
        role: user.role,
        apiKey: user.apiKey,
        dailyTxCount: 0,
        monthlyTxCount: monthlySuccessfulTxCount,
        monthlySuccessfulTxCount,
        cards: user.cards,
        devices: userDevices,
        transactions: user.transactions.map((tx) => ({
          ...tx,
          originalAmountToman: Number(tx.originalAmountToman),
          finalAmountToman: Number(tx.finalAmountToman),
          finalAmountRial: Number(tx.finalAmountRial),
        })),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
