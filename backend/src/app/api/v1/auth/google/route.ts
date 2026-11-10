import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthCredentials, getGoogleRedirectUri } from "@/lib/auth-admin";

// GET /api/v1/auth/google - Initiate Google OAuth2 Consent Flow
export async function GET(req: NextRequest) {
  const { clientId } = getGoogleOAuthCredentials();
  const redirectUri = getGoogleRedirectUri(req);

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "online");
  googleAuthUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(googleAuthUrl.toString());
}
