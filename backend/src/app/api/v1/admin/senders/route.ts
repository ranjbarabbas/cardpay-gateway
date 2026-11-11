import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { analyzeBankSmsStructure, IRANIAN_BANKS } from "@/lib/bank-utils";

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // APPROVED | PENDING_REVIEW | REJECTED

  const whereClause = status ? { status } : {};

  let senders = await db.trustedSender.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  // Auto-seed default official bank senders if table is completely empty
  if (senders.length === 0 && !status) {
    try {
      await Promise.all([
        db.trustedSender.upsert({
          where: { senderId: "B.QMEHRIRAN" },
          update: {},
          create: {
            senderId: "B.QMEHRIRAN",
            bankSlug: "mehr_iran",
            description: "سرخط رسمی پیامک‌های بانک قرض‌الحسنه مهر ایران",
            status: "APPROVED",
          },
        }),
        db.trustedSender.upsert({
          where: { senderId: "BANK MEHR" },
          update: {},
          create: {
            senderId: "BANK MEHR",
            bankSlug: "mehr_iran",
            description: "سرشماره جایگزین بانک قرض‌الحسنه مهر ایران",
            status: "APPROVED",
          },
        }),
      ]);

      senders = await db.trustedSender.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      });
    } catch {
      // Non-fatal if concurrent write occurs
    }
  }

  // Calculate smart similarity suggestions for unapproved/pending senders
  const enrichedSenders = senders.map((s) => {
    let suggestion: any = null;
    if (s.sampleMessage) {
      try {
        const analysis = analyzeBankSmsStructure(s.sampleMessage);
        suggestion = {
          patternType: analysis.patternType,
          isDeposit: analysis.isDeposit,
          amountToman: analysis.amountToman,
          suggestedBank: analysis.suggestedBank,
          similarityScores: analysis.similarityScores,
        };
      } catch (err) {
        // ignore
      }
    }

    const matchedBank = IRANIAN_BANKS.find(
      (b) => b.id === s.bankSlug || b.id.replace(/-/g, "_") === s.bankSlug
    );

    return {
      ...s,
      bankNameFa: matchedBank?.nameFa || s.bankSlug,
      bankLogo: matchedBank?.logo,
      smartSuggestion: suggestion,
    };
  });

  return NextResponse.json({ success: true, data: enrichedSenders });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { senderId, bankSlug = "mehr_iran", description, status = "APPROVED" } = body;

    if (!senderId) {
      return NextResponse.json(
        { success: false, error: "senderId is required" },
        { status: 400 }
      );
    }

    const sender = await db.trustedSender.upsert({
      where: { senderId: senderId.trim() },
      create: {
        senderId: senderId.trim(),
        bankSlug,
        description,
        status,
        reviewedAt: status === "APPROVED" ? new Date() : null,
      },
      update: {
        bankSlug,
        description,
        status,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: sender });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
