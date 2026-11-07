import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "downloads", "cardpay-sync.apk");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "APK file not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": 'attachment; filename="cardpay-sync.apk"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to download APK" }, { status: 500 });
  }
}
