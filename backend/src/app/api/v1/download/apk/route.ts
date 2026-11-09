import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const honarHubPath = path.join(process.cwd(), "public", "downloads", "honarhub-pay-sync.apk");
    const legacyPath = path.join(process.cwd(), "public", "downloads", "cardpay-sync.apk");
    const filePath = fs.existsSync(honarHubPath) ? honarHubPath : legacyPath;

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "APK file not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": 'attachment; filename="honarhub-pay-sync.apk"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to download APK" }, { status: 500 });
  }
}
