import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import {
  expireOverduePendingTransactions,
  checkAndEnforcePlanExpirations,
  checkAndProcessPlanUpgradeTransaction,
} from "@/lib/services/plan-expiration.service";
import { getSystemSettings } from "@/lib/settings";
import {
  parseIdentifier,
  sendOtp,
  verifyOtpCode,
  hashPassword,
  verifyPassword,
} from "@/lib/auth-user";

async function buildUserAuthResponse(user: any, message: string = "ورود موفقیت‌آمیز بود.") {
  let userDevices = user.devices || [];
  if (userDevices.length === 0) {
    const deviceApiKey = `hp_sync_${crypto.randomBytes(16).toString("hex")}`;
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
    message,
    data: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      emailNotifyDeposit: user.emailNotifyDeposit,
      smsNotifyDeposit: Boolean(user.smsNotifyDeposit),
      hasPassword: Boolean(user.password),
      plan: user.plan,
      role: user.role,
      apiKey: user.apiKey,
      activeCardsCount: user.cards?.length || 0,
      activeDevicesCount: userDevices.length,
    },
  });

  // Set cookie for session persistence (30 days)
  response.cookies.set("honarhub_user_id", user.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: false,
    sameSite: "lax",
  });

  return response;
}

// POST /api/v1/auth/user - Unified HonarHub Login, Register, OTP & Password Flow
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, phone, email, name, identifier, password, code, newPassword } = body;

    // 1. Action: Check if user exists and has a password
    if (action === "check") {
      const rawId = identifier || phone || email;
      if (!rawId) {
        return NextResponse.json({ success: false, error: "لطفاً شماره موبایل یا ایمیل را وارد فرمایید." }, { status: 400 });
      }
      const parsed = parseIdentifier(rawId);
      const existingUser = await db.user.findFirst({
        where: {
          OR: [
            ...(parsed.phone ? [{ phone: parsed.phone }] : []),
            ...(parsed.email ? [{ email: parsed.email }] : []),
          ],
        },
      });
      return NextResponse.json({
        success: true,
        exists: Boolean(existingUser),
        hasPassword: Boolean(existingUser?.password),
        target: parsed.clean,
        isEmail: parsed.isEmail,
        name: existingUser?.name || null,
      });
    }

    // 2. Action: Send OTP to Phone (via Faraz SMS) or Email (via Resend)
    if (action === "send_otp") {
      const rawId = identifier || phone || email;
      if (!rawId) {
        return NextResponse.json({ success: false, error: "شماره موبایل یا ایمیل الزامی است." }, { status: 400 });
      }
      const parsed = parseIdentifier(rawId);
      const existingUser = await db.user.findFirst({
        where: {
          OR: [
            ...(parsed.phone ? [{ phone: parsed.phone }] : []),
            ...(parsed.email ? [{ email: parsed.email }] : []),
          ],
        },
      });
      const otpRes = await sendOtp({
        target: parsed.clean,
        isEmail: parsed.isEmail,
        type: body.type || "LOGIN_OTP",
        recipientName: existingUser?.name || "کاربر گرامی",
      });
      return NextResponse.json({
        success: true,
        message: otpRes.message,
        expiresAt: otpRes.expiresAt.toISOString(),
      });
    }

    // Action: Verify OTP Code (Validates without marking as used)
    if (action === "verify_otp") {
      const rawId = identifier || phone || email;
      if (!rawId || !code) {
        return NextResponse.json({ success: false, error: "شناسه کاربری و کد تایید الزامی است." }, { status: 400 });
      }
      const parsed = parseIdentifier(rawId);
      const isValid = await verifyOtpCode(parsed.clean, code, false);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "کد تایید وارد شده نادرست است یا منقضی شده است." }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "کد تایید معتبر است.",
      });
    }

    // 3. Action: Login with Password
    if (action === "login_password") {
      const rawId = identifier || phone || email;
      if (!rawId || !password) {
        return NextResponse.json({ success: false, error: "شناسه کاربری و کلمه عبور الزامی هستند." }, { status: 400 });
      }
      const parsed = parseIdentifier(rawId);
      const user = await db.user.findFirst({
        where: {
          OR: [
            ...(parsed.phone ? [{ phone: parsed.phone }] : []),
            ...(parsed.email ? [{ email: parsed.email }] : []),
          ],
        },
        include: {
          cards: { where: { isArchived: false } },
          devices: true,
        },
      });
      if (!user) {
        return NextResponse.json({ success: false, error: "کاربری با این مشخصات یافت نشد." }, { status: 404 });
      }
      if (!user.password || !verifyPassword(password, user.password)) {
        return NextResponse.json({ success: false, error: "کلمه عبور وارد شده نادرست است." }, { status: 401 });
      }
      return await buildUserAuthResponse(user, "ورود با کلمه عبور موفقیت‌آمیز بود.");
    }

    // 4. Action: Login with OTP (One-Time Password)
    if (action === "login_otp") {
      const rawId = identifier || phone || email;
      if (!rawId || !code) {
        return NextResponse.json({ success: false, error: "شناسه کاربری و کد تایید الزامی است." }, { status: 400 });
      }
      const parsed = parseIdentifier(rawId);
      const isValid = await verifyOtpCode(parsed.clean, code);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "کد تایید وارد شده نادرست است یا منقضی شده است." }, { status: 400 });
      }
      let user = await db.user.findFirst({
        where: {
          OR: [
            ...(parsed.phone ? [{ phone: parsed.phone }] : []),
            ...(parsed.email ? [{ email: parsed.email }] : []),
          ],
        },
        include: {
          cards: { where: { isArchived: false } },
          devices: true,
        },
      });
      if (!user) {
        const userApiKey = `hp_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
        user = await db.user.create({
          data: {
            phone: parsed.phone,
            email: parsed.email,
            name: name || (parsed.phone ? `کاربر ${parsed.phone.slice(-4)}` : "کاربر هنرهاب"),
            isEmailVerified: parsed.isEmail,
            plan: "FREE",
            role: "USER",
            apiKey: userApiKey,
          },
          include: { cards: true, devices: true },
        });
      } else if (parsed.isEmail && !user.isEmailVerified) {
        user = await db.user.update({
          where: { id: user.id },
          data: { isEmailVerified: true },
          include: { cards: true, devices: true },
        });
      }
      return await buildUserAuthResponse(user, "ورود با رمز یکبار مصرف با موفقیت انجام شد.");
    }

    // 5. Action: Register New User with OTP & Set Password for future logins
    if (action === "register") {
      const rawId = identifier || phone || email;
      if (!rawId || !code || !password) {
        return NextResponse.json({ success: false, error: "کد تایید و کلمه عبور الزامی است." }, { status: 400 });
      }
      if (password.length < 6) {
        return NextResponse.json({ success: false, error: "کلمه عبور باید حداقل ۶ کاراکتر باشد." }, { status: 400 });
      }
      const parsed = parseIdentifier(rawId);
      const isValid = await verifyOtpCode(parsed.clean, code);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "کد تایید وارد شده نامعتبر یا منقضی شده است." }, { status: 400 });
      }

      let existingUser = await db.user.findFirst({
        where: {
          OR: [
            ...(parsed.phone ? [{ phone: parsed.phone }] : []),
            ...(parsed.email ? [{ email: parsed.email }] : []),
          ],
        },
        include: { cards: true, devices: true },
      });

      if (existingUser) {
        existingUser = await db.user.update({
          where: { id: existingUser.id },
          data: {
            password: hashPassword(password),
            name: name?.trim() || existingUser.name,
            isEmailVerified: parsed.isEmail ? true : existingUser.isEmailVerified,
          },
          include: { cards: true, devices: true },
        });
        return await buildUserAuthResponse(existingUser, "کلمه عبور با موفقیت ثبت گردید و وارد پنل شدید.");
      }

      const userApiKey = `hp_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
      const newUser = await db.user.create({
        data: {
          phone: parsed.phone,
          email: parsed.email,
          password: hashPassword(password),
          name: name?.trim() || (parsed.phone ? `کاربر ${parsed.phone.slice(-4)}` : "کاربر هنرهاب"),
          isEmailVerified: parsed.isEmail,
          plan: "FREE",
          role: "USER",
          apiKey: userApiKey,
        },
        include: { cards: true, devices: true },
      });
      return await buildUserAuthResponse(newUser, "ثبت‌نام شما با موفقیت تکمیل شد و به پنل خوش‌آمدید.");
    }

    // 6. Action: Reset or Change Password
    if (action === "reset_password") {
      const rawId = identifier || phone || email;
      const targetPass = newPassword || password;
      if (!rawId || !code || !targetPass) {
        return NextResponse.json({ success: false, error: "شناسه، کد تایید و کلمه عبور جدید الزامی است." }, { status: 400 });
      }
      if (targetPass.length < 6) {
        return NextResponse.json({ success: false, error: "کلمه عبور جدید باید حداقل ۶ کاراکتر باشد." }, { status: 400 });
      }
      const parsed = parseIdentifier(rawId);
      const isValid = await verifyOtpCode(parsed.clean, code);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "کد تایید وارد شده نادرست است یا منقضی شده است." }, { status: 400 });
      }
      const user = await db.user.findFirst({
        where: {
          OR: [
            ...(parsed.phone ? [{ phone: parsed.phone }] : []),
            ...(parsed.email ? [{ email: parsed.email }] : []),
          ],
        },
        include: { cards: true, devices: true },
      });
      if (!user) {
        return NextResponse.json({ success: false, error: "کاربر یافت نشد." }, { status: 404 });
      }
      const updated = await db.user.update({
        where: { id: user.id },
        data: {
          password: hashPassword(targetPass),
          isEmailVerified: parsed.isEmail ? true : user.isEmailVerified,
        },
        include: { cards: true, devices: true },
      });
      return await buildUserAuthResponse(updated, "کلمه عبور با موفقیت به‌روزرسانی شد.");
    }

    // 7. Fallback: Legacy Direct Login (if no action supplied)
    if (!phone && !email && !identifier) {
      return NextResponse.json(
        { success: false, error: "لطفاً شماره موبایل یا ایمیل خود را وارد نمایید." },
        { status: 400 }
      );
    }

    const rawLegacyId = identifier || phone || email;
    const parsedLegacy = parseIdentifier(rawLegacyId);

    let legacyUser = await db.user.findFirst({
      where: {
        OR: [
          ...(parsedLegacy.phone ? [{ phone: parsedLegacy.phone }] : []),
          ...(parsedLegacy.email ? [{ email: parsedLegacy.email }] : []),
        ],
      },
      include: {
        cards: { where: { isArchived: false } },
        devices: true,
      },
    });

    if (!legacyUser) {
      const userApiKey = `hp_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
      legacyUser = await db.user.create({
        data: {
          phone: parsedLegacy.phone,
          email: parsedLegacy.email,
          name: name || (parsedLegacy.phone ? `کاربر ${parsedLegacy.phone.slice(-4)}` : "کاربر هنرهاب"),
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

    return await buildUserAuthResponse(legacyUser, "ورود موفقیت‌آمیز بود.");
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

    // 1. Automatically expire any pending transactions past the 10-minute payment grace period
    await expireOverduePendingTransactions();

    // 2. Automatically check and enforce subscription plan expirations & freeze extra cards
    await checkAndEnforcePlanExpirations();

    // 3. If returning from an upgrade checkout, ensure the plan upgrade is immediately processed
    const authParam = req.nextUrl.searchParams.get("auth");
    if (authParam) {
      const upgradeTx = await db.transaction.findFirst({
        where: {
          authority: authParam,
          userId,
          status: { in: ["PAID", "MANUALLY_VERIFIED"] },
        },
      });
      if (upgradeTx) {
        await checkAndProcessPlanUpgradeTransaction(upgradeTx.id);
      }
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        cards: {
          where: { isArchived: false },
          orderBy: { createdAt: "asc" },
        },
        devices: true,
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
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
      const deviceApiKey = `hp_sync_${crypto.randomBytes(16).toString("hex")}`;
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

    const settings = getSystemSettings();

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        emailNotifyDeposit: user.emailNotifyDeposit,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        planDurationMonths: user.planDurationMonths,
        role: user.role,
        apiKey: user.apiKey,
        dailyTxCount: 0,
        monthlyTxCount: monthlySuccessfulTxCount,
        monthlySuccessfulTxCount,
        cards: user.cards,
        devices: userDevices,
        notifications: user.notifications,
        adminCard: settings.adminCard,
        pricing: settings.pricing,
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
