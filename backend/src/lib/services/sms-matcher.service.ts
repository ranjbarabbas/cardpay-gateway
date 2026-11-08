import { db } from "../db";
import { bankParserRegistry } from "./parsers";

export interface SmsIngestInput {
  sender: string;
  rawText: string;
  receivedAt?: Date;
  deviceId?: string;
}

export class SmsMatcherService {
  /**
   * Processes an incoming SMS with two-tier sender verification:
   * 1. If sender is APPROVED: parses and auto-confirms payment.
   * 2. If sender is UNTRUSTED but matches bank format: queues sender into PENDING_REVIEW
   *    and logs as UNTRUSTED_SENDER to prevent SMS spoofing/fraud.
   * 3. If sender is REJECTED: ignores completely.
   */
  public static async processIncomingSms(input: SmsIngestInput) {
    const { sender, rawText, deviceId, receivedAt = new Date() } = input;
    const cleanSender = sender.trim();

    // 1. Check sender reputation in database
    const trustedRecord = await db.trustedSender.findUnique({
      where: { senderId: cleanSender },
    });

    // If sender was explicitly rejected/blocked by admin, drop it
    if (trustedRecord && trustedRecord.status === "REJECTED") {
      const smsLog = await db.bankSmsLog.create({
        data: {
          deviceId,
          sender: cleanSender,
          rawText,
          receivedAt,
          isDeposit: false,
          status: "IGNORED",
        },
      });
      return {
        matched: false,
        smsLogId: smsLog.id,
        reason: `Sender ${cleanSender} has been rejected/blocked by admin`,
      };
    }

    // 2. Parse SMS structure using bank parser registry
    const parsed = bankParserRegistry.parse(cleanSender, rawText);

    // 3. Check if sender is APPROVED
    const isSenderApproved = trustedRecord && trustedRecord.status === "APPROVED";

    // 4. Security Check: If sender is NOT approved
    if (!isSenderApproved) {
      // If it looks like a bank deposit SMS, put it in the PENDING_REVIEW queue
      if (parsed.isDeposit && parsed.amountRial > BigInt(0)) {
        await db.trustedSender.upsert({
          where: { senderId: cleanSender },
          update: {
            sampleMessage: rawText,
            bankSlug: parsed.bankSlug,
          },
          create: {
            senderId: cleanSender,
            bankSlug: parsed.bankSlug,
            status: "PENDING_REVIEW",
            description: "سرخط مشکوک یا جدید شناسایی‌شده با فرمت پیامک بانکی",
            sampleMessage: rawText,
          },
        });
      }

      // Log untrusted SMS
      const smsLog = await db.bankSmsLog.create({
        data: {
          deviceId,
          sender: cleanSender,
          rawText,
          receivedAt,
          isDeposit: parsed.isDeposit,
          parsedAccount: parsed.accountNumber,
          parsedCardLast4: parsed.cardNumberLast4,
          parsedAmountRial: parsed.amountRial > BigInt(0) ? parsed.amountRial : null,
          parsedAmountToman: parsed.amountToman > BigInt(0) ? parsed.amountToman : null,
          parsedRefCode: parsed.trackingCode,
          status: "UNTRUSTED_SENDER",
        },
      });

      // Create security alert ticket for admin
      await db.discrepancyTicket.create({
        data: {
          smsLogId: smsLog.id,
          reason: `پیامک با ساختار بانکی از سرخط تاییدنشده (${cleanSender}) دریافت شد. جهت جلوگیری از جعل پیامک، پرداخت خودکار متوقف و سرخط در صف بررسی قرار گرفت.`,
          status: "OPEN",
        },
      });

      return {
        matched: false,
        smsLogId: smsLog.id,
        reason: `سرخط پیامک (${cleanSender}) هنوز توسط ادمین تایید نشده است و در صف «سرشماره‌های در حال بررسی» قرار گرفت.`,
      };
    }

    // --- SENDER IS APPROVED: PROCEED WITH MATCHING ---

    // 5. Persist raw SMS log for approved sender
    const smsLog = await db.bankSmsLog.create({
      data: {
        deviceId,
        sender: cleanSender,
        rawText,
        receivedAt,
        isDeposit: parsed.isDeposit,
        parsedAccount: parsed.accountNumber,
        parsedCardLast4: parsed.cardNumberLast4,
        parsedAmountRial: parsed.amountRial > BigInt(0) ? parsed.amountRial : null,
        parsedAmountToman: parsed.amountToman > BigInt(0) ? parsed.amountToman : null,
        parsedRefCode: parsed.trackingCode,
        status: parsed.isDeposit ? "UNMATCHED" : "IGNORED",
      },
    });

    if (!parsed.isDeposit || parsed.amountRial <= BigInt(0)) {
      return {
        matched: false,
        smsLogId: smsLog.id,
        reason: "پیامک غیرواریزی یا اطلاع‌رسانی بانکی",
      };
    }

    // 6. Find target card
    let targetCard = null;
    if (parsed.accountNumber) {
      targetCard = await db.bankCard.findFirst({
        where: {
          accountNumber: parsed.accountNumber,
          isActive: true,
        },
      });
    }

    if (!targetCard && deviceId) {
      const deviceCards = await db.bankCard.findMany({
        where: { deviceId, isActive: true },
      });
      if (deviceCards.length === 1) {
        targetCard = deviceCards[0];
      }
    }

    // 7. Search for matching pending transaction
    const now = new Date();
    let matchedTx = null;

    // A) Try exact match on targetCard + exact finalAmountRial
    if (targetCard) {
      matchedTx = await db.transaction.findFirst({
        where: {
          cardId: targetCard.id,
          finalAmountRial: parsed.amountRial,
          status: "PENDING",
          collisionLockUntil: { gte: now },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // B) Global match across any pending transaction (amount is collision-locked)
    if (!matchedTx) {
      matchedTx = await db.transaction.findFirst({
        where: {
          finalAmountRial: parsed.amountRial,
          status: "PENDING",
          collisionLockUntil: { gte: now },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // C) Test Fallback for Toman input in testing
    if (!matchedTx) {
      matchedTx = await db.transaction.findFirst({
        where: {
          finalAmountToman: parsed.amountRial,
          status: "PENDING",
          collisionLockUntil: { gte: now },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // 8. If matched, update transaction and log
    if (matchedTx) {
      await db.$transaction([
        db.transaction.update({
          where: { id: matchedTx.id },
          data: {
            status: "PAID",
            paidAt: now,
            trackingCode: parsed.trackingCode || parsed.accountNumber || "SMS_VERIFIED",
            smsLogId: smsLog.id,
          },
        }),
        db.bankSmsLog.update({
          where: { id: smsLog.id },
          data: {
            status: "MATCHED",
            matchedTransactionId: matchedTx.id,
          },
        }),
      ]);

      // Fire asynchronous webhook if configured
      if (matchedTx.webhookUrl) {
        this.dispatchWebhook(matchedTx.webhookUrl, {
          authority: matchedTx.authority,
          trackingCode: matchedTx.internalTrackingCode,
          status: "PAID",
          amountToman: matchedTx.finalAmountToman.toString(),
          paidAt: now.toISOString(),
        }).catch((err) => console.error("Webhook dispatch failed:", err));
      }

      return {
        matched: true,
        smsLogId: smsLog.id,
        transactionId: matchedTx.id,
        authority: matchedTx.authority,
        trackingCode: matchedTx.internalTrackingCode,
        amountToman: matchedTx.finalAmountToman.toString(),
      };
    }

    // 9. Deposit from approved sender with no matching active transaction -> Discrepancy Ticket
    await db.discrepancyTicket.create({
      data: {
        smsLogId: smsLog.id,
        reason: `واریز به مبلغ ${parsed.amountToman.toString()} تومان (${parsed.amountRial.toString()} ریال) از سرخط معتبر ${cleanSender} دریافت شد اما تراکنش متناظر فعالی یافت نشد.`,
        status: "OPEN",
      },
    });

    return {
      matched: false,
      smsLogId: smsLog.id,
      reason: `واریز از سرخط معتبر دریافت شد اما تراکنش فعالی با این مبلغ وجود ندارد.`,
    };
  }

  private static async dispatchWebhook(url: string, payload: Record<string, unknown>) {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
    } catch (e) {
      console.warn(`Failed to dispatch webhook to ${url}:`, e);
    }
  }
}
