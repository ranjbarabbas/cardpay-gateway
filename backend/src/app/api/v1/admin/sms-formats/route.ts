import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth-admin";
import { IRANIAN_BANKS, BankInfo, BankSmsTemplate, analyzeBankSmsStructure } from "@/lib/bank-utils";

const SMS_FORMATS_KEY = "bank_sms_formats";

interface SavedBankConfig {
  sampleSmsCard?: string;
  sampleSmsPol?: string;
  templates?: BankSmsTemplate[];
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const record = await db.systemSetting.findUnique({
      where: { key: SMS_FORMATS_KEY },
    });

    let savedFormats: Record<string, SavedBankConfig> = {};
    if (record && record.value) {
      try {
        savedFormats = JSON.parse(record.value);
      } catch (err) {
        console.warn("[SMS_FORMATS] Error parsing saved formats:", err);
      }
    }

    // Fetch all trusted senders to link with banks
    const senders = await db.trustedSender.findMany({
      orderBy: { createdAt: "desc" },
    });

    const mergedBanks = IRANIAN_BANKS.map((b) => {
      const custom = savedFormats[b.id] || {};

      // Build templates: merge default bank templates with saved custom templates
      const defaultTemplates: BankSmsTemplate[] = b.templates || [
        ...(b.sampleSmsCard
          ? [
              {
                id: `tpl_${b.id}_c2c_default`,
                title: "قالب متنی کارت‌به‌کارت",
                type: "CARD_TO_CARD" as const,
                patternType: "KEYWORD_BASED" as const,
                sampleText: b.sampleSmsCard,
                status: "PENDING" as const,
              },
            ]
          : []),
        ...(b.sampleSmsPol
          ? [
              {
                id: `tpl_${b.id}_pol_default`,
                title: "قالب متنی انتقال پل",
                type: "POL" as const,
                patternType: "KEYWORD_BASED" as const,
                sampleText: b.sampleSmsPol,
                status: "PENDING" as const,
              },
            ]
          : []),
      ];

      const activeTemplates = custom.templates && custom.templates.length > 0
        ? custom.templates
        : defaultTemplates;

      // Filter senders for this bank (handling both slug with dash or underscore)
      const bankSenders = senders.filter((s) => {
        const norm = s.bankSlug?.replace(/_/g, "-") || "";
        return norm === b.id || norm === b.id.replace(/-/g, "_");
      });

      return {
        ...b,
        sampleSmsCard: custom.sampleSmsCard || b.sampleSmsCard || "",
        sampleSmsPol: custom.sampleSmsPol || b.sampleSmsPol || "",
        templates: activeTemplates,
        senders: bankSenders,
        confirmedCount: activeTemplates.filter((t) => t.status === "CONFIRMED").length,
        totalTemplates: activeTemplates.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: mergedBanks,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action = "SAVE_TEMPLATE", bankId, template, templateId, newStatus, sampleSmsCard, sampleSmsPol } = body;

    if (!bankId) {
      return NextResponse.json({ success: false, error: "bankId is required" }, { status: 400 });
    }

    const record = await db.systemSetting.findUnique({
      where: { key: SMS_FORMATS_KEY },
    });

    let currentMap: Record<string, SavedBankConfig> = {};
    if (record && record.value) {
      try {
        currentMap = JSON.parse(record.value);
      } catch (e) {
        // ignore
      }
    }

    if (!currentMap[bankId]) {
      // Initialize with default templates
      const bankDef = IRANIAN_BANKS.find((b) => b.id === bankId);
      currentMap[bankId] = {
        sampleSmsCard: bankDef?.sampleSmsCard || "",
        sampleSmsPol: bankDef?.sampleSmsPol || "",
        templates: bankDef?.templates ? [...bankDef.templates] : [],
      };
    }

    const bankConfig = currentMap[bankId];
    if (!bankConfig.templates) {
      bankConfig.templates = [];
    }

    if (action === "SAVE_TEMPLATE" && template) {
      // Analyze structure if not analyzed
      const analysis = analyzeBankSmsStructure(template.sampleText);
      const newTpl: BankSmsTemplate = {
        id: template.id || `tpl_${bankId}_${Date.now().toString(36)}`,
        title: template.title || "الگوی ساختاری جدید",
        type: template.type || (analysis.patternType === "SIGN_BASED" ? "SIGN_BASED" : "CARD_TO_CARD"),
        patternType: analysis.patternType,
        sampleText: template.sampleText.trim(),
        status: template.status || "CONFIRMED",
        confirmedAt: template.status === "CONFIRMED" ? new Date().toISOString() : undefined,
        extractedPreview: {
          isDeposit: analysis.isDeposit,
          amountToman: analysis.amountToman > 0 ? analysis.amountToman : undefined,
          amountRial: analysis.amountRial > 0 ? analysis.amountRial : undefined,
          balanceToman: analysis.balanceToman,
          balanceRial: analysis.balanceRial,
          accountOrCard: analysis.accountOrCard,
          trackingCode: analysis.trackingCode,
          date: analysis.date,
          time: analysis.time,
        },
      };

      const existingIdx = bankConfig.templates.findIndex((t) => t.id === newTpl.id);
      if (existingIdx >= 0) {
        bankConfig.templates[existingIdx] = newTpl;
      } else {
        bankConfig.templates.unshift(newTpl);
      }
    } else if (action === "UPDATE_STATUS" && templateId && newStatus) {
      const target = bankConfig.templates.find((t) => t.id === templateId);
      if (target) {
        target.status = newStatus;
        if (newStatus === "CONFIRMED") {
          target.confirmedAt = new Date().toISOString();
        }
      }
    } else if (action === "DELETE_TEMPLATE" && templateId) {
      bankConfig.templates = bankConfig.templates.filter((t) => t.id !== templateId);
    } else if (action === "SAVE_LEGACY") {
      bankConfig.sampleSmsCard = sampleSmsCard || "";
      bankConfig.sampleSmsPol = sampleSmsPol || "";
    }

    await db.systemSetting.upsert({
      where: { key: SMS_FORMATS_KEY },
      update: { value: JSON.stringify(currentMap) },
      create: { key: SMS_FORMATS_KEY, value: JSON.stringify(currentMap) },
    });

    return NextResponse.json({
      success: true,
      message: "تنظیمات الگوهای پیامک بانک با موفقیت ذخیره شد.",
      data: bankConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
