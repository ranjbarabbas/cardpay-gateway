import { IBankSMSParser, ParsedBankSMS, normalizeDigits, parseCleanBigInt } from "./base.parser";

export class MehrIranBankParser implements IBankSMSParser {
  bankSlug = "mehr_iran";

  /**
   * Checks whether this parser is applicable based on sender alias or SMS structure
   */
  canParse(sender: string, rawText: string): boolean {
    const normSender = sender.toUpperCase().trim();
    if (normSender.includes("MEHRIRAN") || normSender.includes("MEHR_IRAN") || normSender === "B.QMEHRIRAN") {
      return true;
    }

    // Secondary check: Pattern of Mehr Iran SMS even if sent from a different number/alias
    const normalized = normalizeDigits(rawText);
    const hasAccountPattern = /^[0-9]{10,25}/m.test(normalized);
    const hasDepositPlus = /[0-9,]+(\+|\s*\+)/.test(normalized);
    const hasBalance = normalized.includes("مانده");

    return hasAccountPattern && hasDepositPlus && hasBalance;
  }

  parse(rawText: string, sender: string): ParsedBankSMS {
    try {
      const normalized = normalizeDigits(rawText.trim());
      const lines = normalized.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

      let accountNumber: string | undefined;
      let amountRial = BigInt(0);
      let isDeposit = false;
      let dateTimeStr: string | undefined;
      let balanceRial: bigint | undefined;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 1. Account number: Usually the first line or line with pure 10-25 digits
        if (!accountNumber && /^[0-9]{10,25}$/.test(line)) {
          accountNumber = line;
          continue;
        }

        // 2. Deposit or Withdrawal amount with + or -
        // Format: "1,000,000+" or "+1,000,000" or "1000000+"
        const depositMatch = line.match(/^([0-9,]+)\s*\+/);
        const altDepositMatch = line.match(/^\+\s*([0-9,]+)/);
        const withdrawMatch = line.match(/^([0-9,]+)\s*-/);

        if (depositMatch || altDepositMatch) {
          isDeposit = true;
          const amtStr = depositMatch ? depositMatch[1] : altDepositMatch![1];
          amountRial = parseCleanBigInt(amtStr);
          continue;
        } else if (withdrawMatch) {
          isDeposit = false;
          amountRial = parseCleanBigInt(withdrawMatch[1]);
          continue;
        }

        // 3. Date & Time e.g. "1405/8/16-15:46"
        if (/[0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2}-[0-9]{1,2}:[0-9]{1,2}/.test(line)) {
          dateTimeStr = line;
          continue;
        }

        // 4. Balance e.g. "مانده:1,420,000"
        if (line.includes("مانده")) {
          const balanceMatch = line.match(/مانده\s*:\s*([0-9,]+)/);
          if (balanceMatch) {
            balanceRial = parseCleanBigInt(balanceMatch[1]);
          }
        }
      }

      if (amountRial === BigInt(0)) {
        return {
          success: false,
          bankSlug: this.bankSlug,
          isDeposit,
          amountRial: BigInt(0),
          amountToman: BigInt(0),
          rawText,
          error: "Could not extract valid deposit amount from SMS",
        };
      }

      const amountToman = amountRial / BigInt(10);

      return {
        success: true,
        bankSlug: this.bankSlug,
        isDeposit,
        accountNumber,
        amountRial,
        amountToman,
        dateTimeStr,
        balanceRial,
        rawText,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        bankSlug: this.bankSlug,
        isDeposit: false,
        amountRial: BigInt(0),
        amountToman: BigInt(0),
        rawText,
        error: errorMsg,
      };
    }
  }
}
