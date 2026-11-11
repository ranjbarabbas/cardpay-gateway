import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isSandboxRequest, isSandboxKey } from "@/lib/sandbox";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const deviceHeader = req.headers.get("x-device-key");
    const apiKey = (authHeader?.replace("Bearer ", "") || deviceHeader || "").trim();

    // 1. Sandbox Mock Transactions
    if (isSandboxRequest(req) || isSandboxKey(apiKey)) {
      const now = Date.now();
      const mockItems = [
        {
          id: "sandbox_sms_1",
          sender: "B.QMEHRIRAN",
          messageSnippet: "واریز به حساب: 111122223333444455 به مبلغ 500,150 ریال - مانده 1,250,000 ریال",
          amountToman: 50015,
          trackingCode: `REF${now.toString().slice(-6)}`,
          status: "تایید شده",
          statusCode: "MATCHED",
          timestamp: now - 2 * 60 * 1000,
        },
        {
          id: "sandbox_sms_2",
          sender: "BankMellat",
          messageSnippet: "واریز: 1,500,000 ریال به حساب 88776655 پیگیری 982134",
          amountToman: 150000,
          trackingCode: "982134",
          status: "تایید شده",
          statusCode: "MATCHED",
          timestamp: now - 35 * 60 * 1000,
        },
        {
          id: "sandbox_sms_3",
          sender: "+9898210001",
          messageSnippet: "واریز 200,000 ریال سرخط در حال اعتبارسنجی سیستم",
          amountToman: 20000,
          trackingCode: "882319",
          status: "در حال بررسی (سرخط)",
          statusCode: "PENDING",
          timestamp: now - 120 * 60 * 1000,
        },
      ];

      return NextResponse.json({
        success: true,
        data: mockItems,
      });
    }

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate Device
    const device = await db.device.findUnique({
      where: { apiKey },
    });

    if (!device || !device.isActive) {
      return NextResponse.json({ success: false, error: "Invalid or inactive device" }, { status: 403 });
    }

    // 3. Fetch latest 10 bank SMS logs for this device
    const logs = await db.bankSmsLog.findMany({
      where: {
        OR: [
          { deviceId: device.id },
          { isDeposit: true },
        ],
      },
      orderBy: { receivedAt: "desc" },
      take: 10,
    });

    const items = logs.map((log) => {
      let statusLabel = "در حال بررسی";
      let statusCode = "PENDING";

      if (log.status === "MATCHED" || log.status === "MANUALLY_RESOLVED") {
        statusLabel = "تایید شده";
        statusCode = "MATCHED";
      } else if (log.status === "UNTRUSTED_SENDER") {
        statusLabel = "در حال بررسی (سرخط)";
        statusCode = "PENDING";
      } else if (log.status === "IGNORED") {
        statusLabel = "رد شده";
        statusCode = "ERROR";
      }

      return {
        id: log.id,
        sender: log.sender,
        messageSnippet: log.rawText.length > 150 ? log.rawText.slice(0, 150) + "..." : log.rawText,
        amountToman: log.parsedAmountToman ? Number(log.parsedAmountToman) : null,
        trackingCode: log.parsedRefCode || null,
        status: statusLabel,
        statusCode,
        timestamp: new Date(log.receivedAt).getTime(),
      };
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
