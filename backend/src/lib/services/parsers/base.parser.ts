export interface ParsedBankSMS {
  success: boolean;
  bankSlug: string;
  isDeposit: boolean;
  accountNumber?: string;
  cardNumberLast4?: string;
  amountRial: bigint;
  amountToman: bigint;
  trackingCode?: string;
  dateTimeStr?: string;
  balanceRial?: bigint;
  rawText: string;
  error?: string;
}

export interface IBankSMSParser {
  bankSlug: string;
  canParse(sender: string, rawText: string): boolean;
  parse(rawText: string, sender: string): ParsedBankSMS;
}

/**
 * Normalizes Persian and Arabic numerals to ASCII Latin digits
 */
export function normalizeDigits(input: string): string {
  if (!input) return "";
  return input
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584));
}

/**
 * Strips commas, dots and non-numeric chars from an amount string
 */
export function parseCleanBigInt(val: string): bigint {
  const clean = val.replace(/[^0-9]/g, "");
  return clean ? BigInt(clean) : BigInt(0);
}
