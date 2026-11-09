// Utility functions for Persian digits and formatting

export function toPersianDigits(input: string | number | bigint | null | undefined): string {
  if (input === null || input === undefined) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(/[0-9]/g, (char) => persianDigits[Number(char)] || char);
}

export function formatPersianNumber(num: number | bigint | string | null | undefined): string {
  if (num === null || num === undefined) return "";
  const n = typeof num === "bigint" || typeof num === "number" ? num : Number(num);
  if (isNaN(Number(n))) return toPersianDigits(num);
  return toPersianDigits(n.toLocaleString("en-US"));
}
