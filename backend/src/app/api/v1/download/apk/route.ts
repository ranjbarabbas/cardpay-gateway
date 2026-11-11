import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GITHUB_RELEASE_APK_URL =
  "https://github.com/ranjbarabbas/cardpay-gateway/releases/download/v1.5.0/honarhub-pay-sync.apk";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "downloads", "honarhub-pay-sync.apk");

    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.android.package-archive",
          "Content-Disposition": 'attachment; filename="honarhub-pay-sync.apk"',
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }

    // Fail-safe: If local file is not present on disk, redirect directly to GitHub Release asset
    return NextResponse.redirect(GITHUB_RELEASE_APK_URL, 302);
  } catch (error) {
    return NextResponse.redirect(GITHUB_RELEASE_APK_URL, 302);
  }
}
