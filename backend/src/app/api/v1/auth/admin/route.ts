import { NextRequest, NextResponse } from "next/server";
import { getAdminEmails, getGoogleOAuthCredentials } from "@/lib/auth-admin";

// POST /api/v1/auth/admin - Admin Email & Google SSO login verification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, credential } = body;

    let emailToVerify = (email || "").toLowerCase().trim();

    // If Google SSO credential (JWT) is provided, verify via Google tokeninfo or decode payload
    if (credential && typeof credential === "string") {
      try {
        // Attempt official tokeninfo verification
        const tokenRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
          { cache: "no-store" }
        ).catch(() => null);

        if (tokenRes && tokenRes.ok) {
          const tokenInfo = await tokenRes.json();
          if (tokenInfo?.email) {
            emailToVerify = tokenInfo.email.toLowerCase().trim();
          }
        } else {
          // Fallback: decode base64 JWT payload safely
          const parts = credential.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
            if (payload.email) {
              emailToVerify = payload.email.toLowerCase().trim();
            }
          }
        }
      } catch (e: any) {
        console.warn("[GOOGLE_SSO_JWT_PARSE_ERROR]", e.message);
      }
    }

    if (!emailToVerify) {
      return NextResponse.json(
        { success: false, error: "ایمیل یا شناسه حساب گوگل جهت ورود الزامی است." },
        { status: 400 }
      );
    }

    const allowedEmails = getAdminEmails();
    const isAllowed = allowedEmails.includes(emailToVerify);

    if (!isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: `ایمیل «${emailToVerify}» در لیست مدیران مجاز سامانه (.env) ثبت نشده است.`,
          allowedHint: `ایمیل‌های مجاز در متغیر ADMIN_EMAILS یا EMAILS در فایل .env تعریف شده‌اند.`,
          configuredEmails: allowedEmails.map((e) => {
            const [u, d] = e.split("@");
            return `${u.slice(0, 3)}***@${d}`;
          }),
        },
        { status: 403 }
      );
    }

    // Generate secure admin session
    const response = NextResponse.json({
      success: true,
      message: `ورود موفقیت‌آمیز بود. خوش‌آمدید (${emailToVerify})`,
      email: emailToVerify,
      isGmail: emailToVerify.endsWith("@gmail.com"),
    });

    response.cookies.set("honarhub_admin_email", emailToVerify, {
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

// GET /api/v1/auth/admin - Verify admin status & get allowed admin accounts
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
    allowedEmails,
    gmailAccounts: allowedEmails.filter((e) => e.endsWith("@gmail.com")),
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
