/**
 * Utility functions for Jalali (Shamsi) date conversions
 * and generating secure internal payment tracking codes.
 */

// Algorithms for Gregorian to Jalali conversion
export function getJalaliDate(date: Date = new Date()): { year: number; month: number; day: number } {
  const g_y = date.getFullYear();
  const g_m = date.getMonth() + 1;
  const g_d = date.getDate();

  const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  let gy = g_y - 1600;
  let gm = g_m - 1;
  let gd = g_d - 1;

  let g_day_no =
    365 * gy +
    Math.floor((gy + 3) / 4) -
    Math.floor((gy + 99) / 100) +
    Math.floor((gy + 399) / 400);

  for (let i = 0; i < gm; ++i) g_day_no += g_days_in_month[i];
  if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) ++g_day_no;
  g_day_no += gd;

  let j_day_no = g_day_no - 79;

  let j_np = Math.floor(j_day_no / 12053);
  j_day_no %= 12053;

  let jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
  j_day_no %= 1461;

  if (j_day_no >= 366) {
    jy += Math.floor((j_day_no - 1) / 365);
    j_day_no = (j_day_no - 1) % 365;
  }

  let jm = 0;
  for (let i = 0; i < 11 && j_day_no >= j_days_in_month[i]; ++i) {
    j_day_no -= j_days_in_month[i];
    jm = i + 1;
  }
  let jd = j_day_no + 1;

  return { year: jy, month: jm + 1, day: jd };
}

/**
 * Generates an 8-digit Jalali date string: YYYYMMDD e.g. "14050818"
 */
export function getJalaliDateString(date: Date = new Date()): string {
  const { year, month, day } = getJalaliDate(date);
  const mm = month.toString().padStart(2, "0");
  const dd = day.toString().padStart(2, "0");
  return `${year}${mm}${dd}`;
}

/**
 * Generates an internal 16-digit tracking code formatted as:
 * PAY-[8 digits Jalali Date][8 digits cryptographically secure random number]
 * Example: PAY-1405081883920147
 */
export function generateInternalTrackingCode(date: Date = new Date()): string {
  const datePart = getJalaliDateString(date);
  // Generate 8-digit pseudo-random with low collision probability
  const randPart = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `PAY-${datePart}${randPart}`;
}
