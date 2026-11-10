import { NextRequest, NextResponse } from "next/server";
import { getAdminEmails, getGoogleOAuthCredentials } from "@/lib/auth-admin";

// GET /api/v1/auth/google/callback - Handle Google OAuth2 Code Exchange
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const redirectUri = `${origin}/api/v1/auth/google/callback`;

  if (error || !code) {
    const errorMsg = error === "access_denied" ? "انصراف از ورود با گوگل" : (error || "کد احراز هویت گوگل دریافت نشد");
    return NextResponse.redirect(`${origin}/admin/login?error=${encodeURIComponent(errorMsg)}`);
  }

  const { clientId, clientSecret } = getGoogleOAuthCredentials();

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("[GOOGLE_OAUTH_TOKEN_ERROR]", errBody);
      return NextResponse.redirect(
        `${origin}/admin/login?error=${encodeURIComponent("خطا در تبادل کلید احراز هویت با سرور گوگل")}`
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const idToken = tokenData.id_token;

    // 2. Fetch verified Google user info
    let email = "";
    if (accessToken) {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const userInfo = await userRes.json();
        email = (userInfo.email || "").toLowerCase().trim();
      }
    }

    // Fallback: parse ID token payload if userinfo was not retrieved
    if (!email && idToken) {
      const parts = idToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        email = (payload.email || "").toLowerCase().trim();
      }
    }

    if (!email) {
      return NextResponse.redirect(
        `${origin}/admin/login?error=${encodeURIComponent("امکان خواندن ایمیل از حساب گوگل میسر نشد")}`
      );
    }

    // 3. Verify email is in allowed admin emails list
    const allowedEmails = getAdminEmails();
    if (!allowedEmails.includes(email)) {
      return NextResponse.redirect(
        `${origin}/admin/login?error=${encodeURIComponent(
          `حساب جیمیل «${email}» دسترسی مدیریت ندارد. ایمیل شما باید در .env ثبت شده باشد.`
        )}`
      );
    }

    // 4. Set admin session cookies and redirect to /admin
    const response = NextResponse.redirect(`${origin}/admin`);
    response.cookies.set("honarhub_admin_email", email, {
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
    console.error("[GOOGLE_OAUTH_CALLBACK_EXCEPTION]", err);
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent("خطای سیستمی در فرآیند احراز هویت گوگل")}`
    );
  }
}
