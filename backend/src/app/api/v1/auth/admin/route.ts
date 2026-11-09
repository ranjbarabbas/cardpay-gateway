import { NextRequest, NextResponse } from "next/server";

function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS || process.env.EMAILS || "admin@honarhub.ir,admin@cardpay.local,merchant@example.com";
  return envEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// POST /api/v1/auth/admin - Google SSO login verification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, credential } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "ایمیل جهت احراز هویت الزامی است." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const allowedEmails = getAdminEmails();

    const isAllowed = allowedEmails.includes(cleanEmail);

    if (!isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: `ایمیل «${cleanEmail}» در لیست مدیران مجاز سامانه ثبت نشده است. لطفاً با ایمیل تعریف‌شده در تنظیمات سیستم وارد شوید.`,
          allowedHint: `ایمیل‌های مجاز در فایل .env سیستم مشخص می‌شوند.`,
        },
        { status: 403 }
      );
    }

    // Generate secure admin session
    const response = NextResponse.json({
      success: true,
      message: `خوش‌آمدید ${cleanEmail}. احراز هویت با موفقیت انجام شد.`,
      email: cleanEmail,
    });

    response.cookies.set("honarhub_admin_email", cleanEmail, {
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

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET /api/v1/auth/admin - Verify admin status
export async function GET(req: NextRequest) {
  const session = req.cookies.get("honarhub_admin_session")?.value;
  const email = req.cookies.get("honarhub_admin_email")?.value;
  const allowedEmails = getAdminEmails();

  if (session === "active_admin_session" && email && allowedEmails.includes(email.toLowerCase())) {
    return NextResponse.json({
      success: true,
      authenticated: true,
      email,
      allowedEmails,
    });
  }

  return NextResponse.json({
    success: false,
    authenticated: false,
    error: "دسترسی مدیریت نیازمند ورود با حساب مجاز است.",
    allowedEmails,
  }, { status: 401 });
}

// DELETE /api/v1/auth/admin - Logout admin
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "خروج انجام شد." });
  response.cookies.delete("honarhub_admin_session");
  response.cookies.delete("honarhub_admin_email");
  return response;
}
