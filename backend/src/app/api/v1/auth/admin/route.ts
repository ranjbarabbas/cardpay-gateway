import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminEmails, getGoogleOAuthCredentials } from "@/lib/auth-admin";
import {
  hashPassword,
  verifyPassword,
  sendOtp,
  verifyOtpCode,
} from "@/lib/auth-user";

// Helper to set admin session cookies
function applyAdminCookies(response: NextResponse, email: string) {
  response.cookies.set("honarhub_admin_email", email.toLowerCase().trim(), {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: false,
    sameSite: "lax",
  });

  response.cookies.set("honarhub_admin_session", "active_admin_session", {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: false,
    sameSite: "lax",
  });
}

// POST /api/v1/auth/admin - Fully Operational Admin Auth (Google SSO, Email + Password, OTP Reset)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = "login", email, password, credential, code, newPassword } = body;

    const rawEmail = (email || "").toLowerCase().trim();
    const allowedEmails = getAdminEmails();

    // -------------------------------------------------------------
    // 1. Action: Send OTP to Admin Email for Password Reset / Setup
    // -------------------------------------------------------------
    if (action === "send_otp") {
      if (!rawEmail) {
        return NextResponse.json(
          { success: false, error: "لطفاً آدرس ایمیل مدیریت را وارد فرمایید." },
          { status: 400 }
        );
      }

      if (!allowedEmails.includes(rawEmail)) {
        return NextResponse.json(
          { success: false, error: "این آدرس ایمیل در لیست مدیران مجاز سامانه ثبت نشده است." },
          { status: 403 }
        );
      }

      // Send 5-digit OTP via Email
      const otpRes = await sendOtp({
        target: rawEmail,
        isEmail: true,
        type: "ADMIN_PASSWORD_RESET",
        recipientName: "مدیر گرامی سامانه",
      });

      return NextResponse.json({
        success: true,
        message: `کد تایید یکبار مصرف با موفقیت به ایمیل ${rawEmail} ارسال گردید.`,
        expiresAt: otpRes.expiresAt,
      });
    }

    // -------------------------------------------------------------
    // 2. Action: Verify OTP and Reset / Set Admin Password
    // -------------------------------------------------------------
    if (action === "reset_password") {
      if (!rawEmail || !code || !newPassword) {
        return NextResponse.json(
          { success: false, error: "ایمیل، کد تایید یکبار مصرف و کلمه عبور جدید الزامی هستند." },
          { status: 400 }
        );
      }

      if (!allowedEmails.includes(rawEmail)) {
        return NextResponse.json(
          { success: false, error: "این حساب به عنوان مدیر سیستم مجاز نیست." },
          { status: 403 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "کلمه عبور جدید باید حداقل ۶ کاراکتر باشد." },
          { status: 400 }
        );
      }

      // Verify OTP code
      const isCodeValid = await verifyOtpCode(rawEmail, code.toString().trim());
      if (!isCodeValid) {
        return NextResponse.json(
          { success: false, error: "کد تایید وارد شده نادرست است یا زمان اعتبار آن به پایان رسیده است." },
          { status: 400 }
        );
      }

      // Hash password and upsert Admin user in database
      const hashedPassword = hashPassword(newPassword);
      let adminUser = await db.user.findFirst({
        where: { email: rawEmail },
      });

      if (adminUser) {
        adminUser = await db.user.update({
          where: { id: adminUser.id },
          data: {
            password: hashedPassword,
            role: "ADMIN",
            isEmailVerified: true,
          },
        });
      } else {
        const apiKey = `adm_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
        adminUser = await db.user.create({
          data: {
            email: rawEmail,
            role: "ADMIN",
            password: hashedPassword,
            isEmailVerified: true,
            name: "مدیر سامانه",
            plan: "SPECIAL",
            apiKey,
          },
        });
      }

      const response = NextResponse.json({
        success: true,
        message: "کلمه عبور مدیریت با موفقیت ثبت گردید و وارد پنل شدید.",
        email: rawEmail,
      });

      applyAdminCookies(response, rawEmail);
      return response;
    }

    // -------------------------------------------------------------
    // 3. Action: Google SSO Credential (JWT) Verification
    // -------------------------------------------------------------
    if (credential && typeof credential === "string") {
      let googleEmail = "";
      try {
        const tokenRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
          { cache: "no-store" }
        ).catch(() => null);

        if (tokenRes && tokenRes.ok) {
          const tokenInfo = await tokenRes.json();
          if (tokenInfo?.email) {
            googleEmail = tokenInfo.email.toLowerCase().trim();
          }
        } else {
          // Fallback base64 decode
          const parts = credential.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
            if (payload.email) {
              googleEmail = payload.email.toLowerCase().trim();
            }
          }
        }
      } catch (e: any) {
        console.warn("[GOOGLE_SSO_JWT_PARSE_ERROR]", e.message);
      }

      if (!googleEmail || !allowedEmails.includes(googleEmail)) {
        return NextResponse.json(
          {
            success: false,
            error: `حساب گوگل «${googleEmail || "نامشخص"}» در لیست مدیران مجاز سامانه ثبت نشده است.`,
          },
          { status: 403 }
        );
      }

      const response = NextResponse.json({
        success: true,
        message: `ورود با گوگل با موفقیت انجام شد (${googleEmail}).`,
        email: googleEmail,
      });

      applyAdminCookies(response, googleEmail);
      return response;
    }

    // -------------------------------------------------------------
    // 4. Action: Standard Admin Login via Email and Password
    // -------------------------------------------------------------
    if (!rawEmail) {
      return NextResponse.json(
        { success: false, error: "لطفاً آدرس ایمیل مدیریت را وارد فرمایید." },
        { status: 400 }
      );
    }

    if (!allowedEmails.includes(rawEmail)) {
      return NextResponse.json(
        { success: false, error: "دسترسی مدیریت به این حساب داده نشده است." },
        { status: 403 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "لطفاً رمز عبور مدیریت را وارد فرمایید." },
        { status: 400 }
      );
    }

    // Find admin user in DB
    const adminUser = await db.user.findFirst({
      where: { email: rawEmail },
    });

    if (!adminUser || !adminUser.password) {
      return NextResponse.json(
        {
          success: false,
          error: "برای این حساب مدیر هنوز رمز عبور ثبت نشده است. لطفاً از گزینه «تغییر رمز با کد یکبار مصرف ایمیلی» استفاده نمایید یا از طریق حساب گوگل وارد شوید.",
          needsPasswordSetup: true,
        },
        { status: 400 }
      );
    }

    // Verify password hash
    const isPassValid = verifyPassword(password, adminUser.password);
    if (!isPassValid) {
      return NextResponse.json(
        { success: false, error: "کلمه عبور وارد شده نادرست است." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "ورود به کنترل‌پنل مدیریت با موفقیت انجام شد.",
      email: rawEmail,
    });

    applyAdminCookies(response, rawEmail);
    return response;
  } catch (err: any) {
    console.error("[ADMIN_AUTH_ERROR]", err);
    let errMsg = "خطای غیرمنتظره در پردازش درخواست ورود. لطفاً مجدداً تلاش فرمایید.";
    if (err?.message) {
      if (
        err.message.includes("datasource `db`") ||
        err.message.includes("protocol `file:`") ||
        err.message.includes("Can't reach database server") ||
        err.message.includes("P1001") ||
        err.message.includes("P1000")
      ) {
        errMsg = "خطا در برقراری ارتباط با پایگاه داده. لطفاً از اتصال و تنظیم متغیر DATABASE_URL اطمینان حاصل فرمایید.";
      } else if (!err.message.includes("prisma") && !err.message.includes("invocation")) {
        errMsg = err.message;
      }
    }
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

// GET /api/v1/auth/admin - Check current admin session & Google Client ID
export async function GET(req: NextRequest) {
  const session = req.cookies.get("honarhub_admin_session")?.value;
  const email = req.cookies.get("honarhub_admin_email")?.value;
  const allowedEmails = getAdminEmails();

  const isAuthenticated = Boolean(
    session === "active_admin_session" && email && allowedEmails.includes(email.toLowerCase())
  );

  const { clientId } = getGoogleOAuthCredentials();

  return NextResponse.json({
    success: true,
    authenticated: isAuthenticated,
    email: isAuthenticated ? email : null,
    googleClientId: clientId,
  });
}

// DELETE /api/v1/auth/admin - Logout admin
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "خروج از پنل مدیریت انجام شد." });
  response.cookies.delete("honarhub_admin_session");
  response.cookies.delete("honarhub_admin_email");
  return response;
}
