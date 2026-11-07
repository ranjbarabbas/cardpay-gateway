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
   * Processes an incoming bank SMS from an Android device or API,
   * parses the content, attempts to match it against pending transactions,
   * and creates discrepancy tickets if necessary.
   */
  public static async processIncomingSms(input: SmsIngestInput) {
    const { sender, rawText, deviceId, receivedAt = new Date() } = input;

    // 1. Parse SMS using the bank parser registry
    const parsed = bankParserRegistry.parse(sender, rawText);

    // 2. Persist raw SMS log
    const smsLog = await db.bankSmsLog.create({
      data: {
        deviceId,
        sender,
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
        reason: "Non-deposit or informational bank SMS",
      };
    }

    // 3. Find target card
    // First try by account number (Bank Mehr Iran provides the full account number)
    let targetCard = null;
    if (parsed.accountNumber) {
      targetCard = await db.bankCard.findFirst({
        where: {
          accountNumber: parsed.accountNumber,
          isActive: true,
        },
      });
    }

    // If not found by account, try by device cards
    if (!targetCard && deviceId) {
      const deviceCards = await db.bankCard.findMany({
        where: { deviceId, isActive: true },
      });
      if (deviceCards.length === 1) {
        targetCard = deviceCards[0];
      }
    }

    // 4. Search for matching pending transaction
    const now = new Date();
    let matchedTx = null;

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
    } else {
      // Search across all pending transactions if card was not strictly determined
      matchedTx = await db.transaction.findFirst({
        where: {
          finalAmountRial: parsed.amountRial,
          status: "PENDING",
          collisionLockUntil: { gte: now },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // 5. If matched, update transaction and log
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
          status: "PAID",
          amountToman: matchedTx.finalAmountToman.toString(),
          paidAt: now.toISOString(),
          trackingCode: matchedTx.trackingCode,
        }).catch((err) => console.error("Webhook dispatch failed:", err));
      }

      return {
        matched: true,
        smsLogId: smsLog.id,
        transactionId: matchedTx.id,
        authority: matchedTx.authority,
      };
    }

    // 6. If no match was found for a deposit, create a Discrepancy Ticket for manual review
    await db.discrepancyTicket.create({
      data: {
        smsLogId: smsLog.id,
        reason: `Deposit of ${parsed.amountToman.toString()} Toman (${parsed.amountRial.toString()} Rial) received but could not be matched with any active pending transaction.`,
        status: "OPEN",
      },
    });

    return {
      matched: false,
      smsLogId: smsLog.id,
      reason: "Deposit received with no matching active transaction",
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
