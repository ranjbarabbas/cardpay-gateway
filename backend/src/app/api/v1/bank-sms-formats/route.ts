import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { IRANIAN_BANKS, BankSmsTemplate } from "@/lib/bank-utils";

const SMS_FORMATS_KEY = "bank_sms_formats";

export async function GET(req: NextRequest) {
  try {
    const record = await db.systemSetting.findUnique({
      where: { key: SMS_FORMATS_KEY },
    });

    let savedFormats: Record<string, any> = {};
    if (record && record.value) {
      try {
        savedFormats = JSON.parse(record.value);
      } catch (err) {
        // ignore
      }
    }

    const approvedSenders = await db.trustedSender.findMany({
      where: { status: "APPROVED" },
    });

    const data = IRANIAN_BANKS.map((b) => {
      const custom = savedFormats[b.id] || {};

      const defaultTemplates: BankSmsTemplate[] = b.templates || [];
      const activeTemplates: BankSmsTemplate[] = custom.templates && custom.templates.length > 0
        ? custom.templates
        : defaultTemplates;

      // Filter only confirmed templates for mobile app consumption
      const confirmedTemplates = activeTemplates.filter((t) => t.status === "CONFIRMED");

      // Filter approved senders for this bank
      const bankSenders = approvedSenders
        .filter((s) => {
          const norm = s.bankSlug?.replace(/_/g, "-") || "";
          return norm === b.id || norm === b.id.replace(/-/g, "_");
        })
        .map((s) => s.senderId);

      return {
        id: b.id,
        nameFa: b.nameFa,
        nameEn: b.nameEn,
        cardPrefixes: b.cardPrefixes,
        ibanCode: b.ibanCode,
        logo: b.logo,
        sampleSmsCard: custom.sampleSmsCard || b.sampleSmsCard || "",
        sampleSmsPol: custom.sampleSmsPol || b.sampleSmsPol || "",
        senders: bankSenders,
        confirmedTemplates: confirmedTemplates.map((t) => ({
          id: t.id,
          title: t.title,
          type: t.type,
          patternType: t.patternType,
          sampleText: t.sampleText,
          extractedPreview: t.extractedPreview,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
