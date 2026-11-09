import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/v1/user/device - Setup or get companion device for user
export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get("honarhub_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ success: false, error: "وارد نشده‌اید" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { devices: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "کاربر یافت نشد" }, { status: 404 });
    }

    const body = await req.json();
    const { deviceName = "گوشی همراه پذیرنده" } = body;

    // In Free plan, allow 1 device
    let device = user.devices[0];

    if (!device) {
      const deviceApiKey = `dev_sec_${Math.random().toString(36).substring(2, 10)}`;
      device = await db.device.create({
        data: {
          name: deviceName,
          apiKey: deviceApiKey,
          userId: user.id,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: device,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
