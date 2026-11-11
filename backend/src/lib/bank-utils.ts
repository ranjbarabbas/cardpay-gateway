/**
 * Iranian Banking Utility
 * - Complete Registry of CBI Licensed Banks & Credit Institutions
 * - 16-Digit Card Luhn Mod 10 Checksum Validator
 * - 24-Digit Iranian Sheba (IBAN) ISO 7064 Mod 97-10 Checksum Validator
 * - Automatic Bank Detection by Card BIN Prefix (6 or 8 digits) and Sheba code
 * - Intelligent Bank SMS Regex Extraction for Card-to-Card and POL/PAYA
 */

export interface BankInfo {
  id: string;
  nameFa: string;
  nameEn: string;
  cardPrefixes: string[];
  ibanCode: string[]; // 3-digit Central Bank code inside Sheba
  logo: string;
  color: string;
  sampleSmsCard?: string;
  sampleSmsPol?: string;
}

export const IRANIAN_BANKS: BankInfo[] = [
  {
    id: "mehr-iran",
    nameFa: "بانک قرض‌الحسنه مهر ایران",
    nameEn: "Mehr Iran Bank",
    cardPrefixes: ["606373"],
    ibanCode: ["060"],
    logo: "/images/banks/mehriran.svg",
    color: "#008080",
    sampleSmsCard: "بانک قرض‌الحسنه مهر ایران\nواریز کارت به کارت: ۱,۵۰۰,۰۱۵ ریال\nاز: ۶۰۳۷۹۹**۱۲۳۴\nبه: ۶۰۶۳۷۳**۷۷۶۶\nموجودی: ۲۵,۴۳۰,۵۰۰ ریال\nکد پیگیری: ۹۸۷۶۵۴۳۲۱\n۱۴۰۵/۰۸/۲۰ ۱۲:۳۰",
    sampleSmsPol: "بانک مهر ایران\nواریز انتقال پل: ۲۵۰,۰۰۰,۰۱۵ ریال\nشبا: IR120600000000111122223333\nارجاع: POL-44918237\nموجودی: ۲۷۵,۴۳۰,۵۰۰ ریال\n۱۴۰۵/۰۸/۲۰ ۱۲:۳۵",
  },
  {
    id: "blu",
    nameFa: "بلوبانک سامان",
    nameEn: "Blu Bank",
    cardPrefixes: ["62198618", "62198619"],
    ibanCode: ["056"],
    logo: "/images/banks/blu.svg",
    color: "#007aff",
    sampleSmsCard: "بلو؛ انتقال کارت به کارت\nمبلغ: ۲,۰۰۰,۰۱۱ ریال\nبه کارت: ۱۸**۶۲۱۹۸۶\nپیگیری: ۸۷۲۱۶۵\nمانده: ۱۸,۴۵۰,۰۰۰ ریال",
    sampleSmsPol: "بلو؛ واریز انتقال پل\nمبلغ: ۱۵۰,۰۰۰,۰۱۱ ریال\nشناسه پیگیری: BLU-991203\nبه شبا: IR980560000000123456789012\nمانده: ۱۶۸,۴۵۰,۰۰۰ ریال",
  },
  {
    id: "mellat",
    nameFa: "بانک ملت",
    nameEn: "Bank Mellat",
    cardPrefixes: ["610433", "991975"],
    ibanCode: ["012"],
    logo: "/images/banks/mellat.svg",
    color: "#cb0014",
    sampleSmsCard: "بانک ملت\nواریز: ۵,۰۰۰,۰۱۵ ریال\nحساب: ۱۲۳۴۵۶۷۸۹۰\nکارت: **۴۳۳\nکد پیگیری: ۷۸۲۳۴۵۱۲\nمانده: ۴۵,۲۰۰,۰۰۰ ریال",
    sampleSmsPol: "بانک ملت\nواریز سامانه پل: ۱۲۰,۰۰۰,۰۱۵ ریال\nشبا: IR120120000000123456789012\nشماره ارجاع: 981240182\nمانده: ۱۶۵,۲۰۰,۰۰۰ ریال",
  },
  {
    id: "meli",
    nameFa: "بانک ملی ایران",
    nameEn: "Bank Melli Iran",
    cardPrefixes: ["603799", "636214"],
    ibanCode: ["017", "062"],
    logo: "/images/banks/melli.svg",
    color: "#1d3c78",
    sampleSmsCard: "بانک ملی ایران\nواریز سحاب: ۳,۵۰۰,۰۱۲ ریال\nاز: ۶۱۰۴۳۳**۲۲۳۳\nبه: ۶۰۳۷۹۹**۹۹۸۸\nپیگیری: ۵۵۴۴۳۳۲۲\nموجودی: ۳۲,۱۰۰,۰۰۰ ریال",
    sampleSmsPol: "بانک ملی ایران\nواریز پل: ۱۸۰,۰۰۰,۰۱۲ ریال\nبه شبا: IR550170000000123456789012\nپیگیری: 78912300\nموجودی: ۲۱۲,۱۰۰,۰۰۰ ریال",
  },
  {
    id: "sepah",
    nameFa: "بانک سپه",
    nameEn: "Bank Sepah",
    cardPrefixes: ["589210", "639370", "505801", "636949", "627381", "639599"],
    ibanCode: ["015", "063", "065"],
    logo: "/images/banks/sepah.svg",
    color: "#eebc29",
    sampleSmsCard: "بانک سپه\nواریز شتابی: ۴,۰۰۰,۰۱۴ ریال\nبه کارت: ۵۸۹۲۱۰**۳۴۵۶\nکد ارجاع: ۸۴۷۲۹۱\nمانده: ۲۲,۶۰۰,۰۰۰ ریال",
    sampleSmsPol: "بانک سپه\nواریز سامانه پل: ۲۰۰,۰۰۰,۰۱۴ ریال\nشبا: IR440150000000123456789012\nارجاع: 11223344\nمانده: ۲۲۲,۶۰۰,۰۰۰ ریال",
  },
  {
    id: "tejarat",
    nameFa: "بانک تجارت",
    nameEn: "Bank Tejarat",
    cardPrefixes: ["627353", "585983"],
    ibanCode: ["018"],
    logo: "/images/banks/tejarat.svg",
    color: "#004785",
    sampleSmsCard: "بانک تجارت\nواریز کارت: ۱,۲۰۰,۰۱۳ ریال\nبه: ۶۲۷۳۵۳**۷۸۹۰\nشماره پیگیری: ۳۳۲۲۱۱\nموجودی: ۱۹,۸۰۰,۰۰۰ ریال",
    sampleSmsPol: "بانک تجارت\nواریز انتقال پل: ۹۵,۰۰۰,۰۱۳ ریال\nبه شماره شبا: IR880180000000123456789012\nکد رهگیری: TEJ-847291\nموجودی: ۱۱۴,۸۰۰,۰۰۰ ریال",
  },
  {
    id: "saderat",
    nameFa: "بانک صادرات ایران",
    nameEn: "Bank Saderat Iran",
    cardPrefixes: ["603769"],
    ibanCode: ["019"],
    logo: "/images/banks/saderat.svg",
    color: "#202c5f",
    sampleSmsCard: "بانک صادرات ایران\nواریز: ۶,۵۰۰,۰۱۲ ریال\nکارت: ۶۰۳۷۶۹**۱۱۴۴\nکد پیگیری: ۴۴۵۵۶۶\nمانده: ۵۰,۳۰۰,۰۰۰ ریال",
    sampleSmsPol: "بانک صادرات ایران\nواریز سامانه پل: ۱۳۰,۰۰۰,۰۱۲ ریال\nشبا: IR230190000000123456789012\nکد پیگیری: 55667788\nمانده: ۱۸۰,۳۰۰,۰۰۰ ریال",
  },
  {
    id: "saman",
    nameFa: "بانک سامان",
    nameEn: "Bank Saman",
    cardPrefixes: ["621986"],
    ibanCode: ["056"],
    logo: "/images/banks/saman.svg",
    color: "#0c82c5",
    sampleSmsCard: "بانک سامان\nواریز کارت به کارت: ۲,۸۰۰,۰۱۵ ریال\nکارت: ۶۲۱۹۸۶**۹۰۱۲\nپیگیری: ۷۷۶۶۵۵\nموجودی: ۲۷,۴۰۰,۰۰۰ ریال",
    sampleSmsPol: "بانک سامان\nواریز پل: ۷۰,۰۰۰,۰۱۵ ریال\nشبا: IR770560000000123456789012\nپیگیری: 998811\nموجودی: ۹۷,۴۰۰,۰۰۰ ریال",
  },
  {
    id: "pasargad",
    nameFa: "بانک پاسارگاد",
    nameEn: "Bank Pasargad",
    cardPrefixes: ["502229", "639347"],
    ibanCode: ["057"],
    logo: "/images/banks/pasargad.svg",
    color: "#ffcc00",
    sampleSmsCard: "بانک پاسارگاد\nواریز سحاب: ۳,۱۰۰,۰۱۲ ریال\nبه کارت: ۵۰۲۲۲۹**۶۶۵۵\nشماره مرجع: ۱۲۴۵۷۸\nموجودی: ۳۵,۰۰۰,۰۰۰ ریال",
    sampleSmsPol: "بانک پاسارگاد\nواریز سامانه پل: ۱۶۰,۰۰۰,۰۱۲ ریال\nشبا: IR330570000000123456789012\nکد مرجع: PAS-882319\nموجودی: ۱۹۵,۰۰۰,۰۰۰ ریال",
  },
  {
    id: "parsian",
    nameFa: "بانک پارسیان",
    nameEn: "Bank Parsian",
    cardPrefixes: ["622106", "639194", "627884"],
    ibanCode: ["054"],
    logo: "/images/banks/parsian.svg",
    color: "#862633",
    sampleSmsCard: "بانک پارسیان\nواریز کارت: ۸,۰۰۰,۰۱۱ ریال\nکارت: ۶۲۲۱۰۶**۳۳۲۲\nپیگیری: ۹۹۲۲۱۱\nموجودی: ۴۱,۰۰۰,۰۰۰ ریال",
    sampleSmsPol: "بانک پارسیان\nواریز پل: ۹۰,۰۰۰,۰۱۱ ریال\nشبا: IR450540000000123456789012\nپیگیری: 334455\nموجودی: ۱۳۱,۰۰۰,۰۰۰ ریال",
  },
  {
    id: "keshavarzi",
    nameFa: "بانک کشاورزی",
    nameEn: "Bank Keshavarzi",
    cardPrefixes: ["603770", "639217"],
    ibanCode: ["016"],
    logo: "/images/banks/keshavarzi.svg",
    color: "#106029",
  },
  {
    id: "maskan",
    nameFa: "بانک مسکن",
    nameEn: "Bank Maskan",
    cardPrefixes: ["628023"],
    ibanCode: ["014"],
    logo: "/images/banks/maskan.svg",
    color: "#e5541c",
  },
  {
    id: "refah",
    nameFa: "بانک رفاه کارگران",
    nameEn: "Bank Refah Kargaran",
    cardPrefixes: ["589463"],
    ibanCode: ["013"],
    logo: "/images/banks/refahkargaran.svg",
    color: "#004b93",
  },
  {
    id: "resalat",
    nameFa: "بانک قرض‌الحسنه رسالت",
    nameEn: "Resalat Bank",
    cardPrefixes: ["504172"],
    ibanCode: ["070"],
    logo: "/images/banks/resalat.svg",
    color: "#008b8b",
  },
  {
    id: "shahr",
    nameFa: "بانک شهر",
    nameEn: "Bank Shahr",
    cardPrefixes: ["502806", "504706"],
    ibanCode: ["061"],
    logo: "/images/banks/shahr.svg",
    color: "#db1f26",
  },
  {
    id: "eghtesad",
    nameFa: "بانک اقتصاد نوین",
    nameEn: "Bank Eghtesad Novin",
    cardPrefixes: ["627412"],
    ibanCode: ["055"],
    logo: "/images/banks/eghtesad.svg",
    color: "#5e1675",
  },
  {
    id: "sina",
    nameFa: "بانک سینا",
    nameEn: "Bank Sina",
    cardPrefixes: ["639346"],
    ibanCode: ["059"],
    logo: "/images/banks/sina.svg",
    color: "#154784",
  },
  {
    id: "dey",
    nameFa: "بانک دی",
    nameEn: "Bank Dey",
    cardPrefixes: ["502938"],
    ibanCode: ["066"],
    logo: "/images/banks/day.svg",
    color: "#027eb3",
  },
  {
    id: "karafarin",
    nameFa: "بانک کارآفرین",
    nameEn: "Bank Karafarin",
    cardPrefixes: ["627488", "502910"],
    ibanCode: ["053"],
    logo: "/images/banks/karafarin.svg",
    color: "#005b52",
  },
  {
    id: "gardeshgari",
    nameFa: "بانک گردشگری",
    nameEn: "Tourism Bank",
    cardPrefixes: ["505416", "505428"],
    ibanCode: ["064"],
    logo: "/images/banks/gardeshgari.svg",
    color: "#681414",
  },
  {
    id: "iran-zamin",
    nameFa: "بانک ایران زمین",
    nameEn: "Iran Zamin Bank",
    cardPrefixes: ["505785"],
    ibanCode: ["069"],
    logo: "/images/banks/iranzamin.svg",
    color: "#731846",
  },
  {
    id: "sarmaye",
    nameFa: "بانک سرمایه",
    nameEn: "Sarmayeh Bank",
    cardPrefixes: ["639607"],
    ibanCode: ["058"],
    logo: "/images/banks/sarmaye.svg",
    color: "#005c9e",
  },
  {
    id: "post",
    nameFa: "پست بانک ایران",
    nameEn: "Post Bank of Iran",
    cardPrefixes: ["627760"],
    ibanCode: ["021"],
    logo: "/images/banks/post.svg",
    color: "#1a5e35",
  },
  {
    id: "tosee-taavon",
    nameFa: "بانک توسعه تعاون",
    nameEn: "Tose'e Ta'avon Bank",
    cardPrefixes: ["502908"],
    ibanCode: ["022"],
    logo: "/images/banks/tosetaavon.svg",
    color: "#1d587a",
  },
  {
    id: "tosee-saderat",
    nameFa: "بانک توسعه صادرات",
    nameEn: "Export Development Bank",
    cardPrefixes: ["627648", "207177"],
    ibanCode: ["020"],
    logo: "/images/banks/tosesaderat.svg",
    color: "#1b3b6f",
  },
  {
    id: "sanat-madan",
    nameFa: "بانک صنعت و معدن",
    nameEn: "Bank of Industry and Mine",
    cardPrefixes: ["627961"],
    ibanCode: ["011"],
    logo: "/images/banks/sanatmadan.svg",
    color: "#7d1c1c",
  },
  {
    id: "khavarmianeh",
    nameFa: "بانک خاورمیانه",
    nameEn: "Middle East Bank",
    cardPrefixes: ["585947"],
    ibanCode: ["078"],
    logo: "/images/banks/khavarmianeh.svg",
    color: "#194a82",
  },
  {
    id: "markazi",
    nameFa: "بانک مرکزی جمهوری اسلامی ایران",
    nameEn: "Central Bank of Iran",
    cardPrefixes: ["636795"],
    ibanCode: ["010"],
    logo: "/images/banks/centeral.svg",
    color: "#173d6f",
  },
];

/**
 * Detects an Iranian Bank from a given Card Number (first 6 or 8 digits)
 */
export function getBankByCardNumber(cardNumber: string): BankInfo | null {
  if (!cardNumber) return null;
  const clean = cardNumber.replace(/\D/g, "");
  if (clean.length < 6) return null;

  // Match 8-digit prefixes first (e.g. Blu Bank 62198618), then 6-digit prefixes
  for (const bank of IRANIAN_BANKS) {
    for (const prefix of bank.cardPrefixes) {
      if (prefix.length === 8 && clean.startsWith(prefix)) {
        return bank;
      }
    }
  }

  const prefix6 = clean.slice(0, 6);
  for (const bank of IRANIAN_BANKS) {
    if (bank.cardPrefixes.includes(prefix6)) {
      return bank;
    }
  }

  return null;
}

/**
 * Detects an Iranian Bank from an IBAN / Sheba string
 */
export function getBankByIban(iban: string): BankInfo | null {
  if (!iban) return null;
  const clean = iban.replace(/\s+/g, "").toUpperCase();
  let shebaDigits = clean;
  if (clean.startsWith("IR")) {
    shebaDigits = clean.slice(2);
  }
  if (shebaDigits.length < 5) return null;

  // Sheba structure: IR [2 check digits] [3 bank code digits] [19 account digits]
  const bankCode = shebaDigits.slice(2, 5);
  for (const bank of IRANIAN_BANKS) {
    if (bank.ibanCode.includes(bankCode)) {
      return bank;
    }
  }

  return null;
}

/**
 * Finds a bank by its unique slug/ID
 */
export function getBankById(id: string): BankInfo | null {
  if (!id) return null;
  const clean = id.trim().toLowerCase().replace(/_/g, "-");
  return IRANIAN_BANKS.find((b) => b.id === clean || b.id.replace(/-/g, "_") === id.toLowerCase()) || null;
}

/**
 * Validates a 16-digit Iranian bank card using the standard Luhn Mod 10 algorithm
 */
export function isValidIranianCardNumber(cardNumber: string): {
  valid: boolean;
  error?: string;
  bank?: BankInfo | null;
} {
  if (!cardNumber) {
    return { valid: false, error: "شماره کارت بانکی الزامی است." };
  }

  const clean = cardNumber.replace(/\D/g, "");
  if (clean.length !== 16) {
    return { valid: false, error: "شماره کارت باید دقیقاً ۱۶ رقم باشد." };
  }

  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let digit = parseInt(clean.charAt(i), 10);
    // Double every digit at even index (0, 2, 4, ... from left)
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  if (sum % 10 !== 0) {
    return {
      valid: false,
      error: "شماره کارت بانکی نامعتبر است (کنترل رقم چک‌سام ناهمخوان است). لطفاً شماره کارت را مجدداً بررسی فرمایید.",
    };
  }

  const bank = getBankByCardNumber(clean);
  return { valid: true, bank };
}

/**
 * Validates an Iranian IBAN (Sheba) number using ISO 7064 MOD 97-10 algorithm
 */
export function isValidIranianIban(iban: string): {
  valid: boolean;
  error?: string;
  formatted?: string;
  bank?: BankInfo | null;
} {
  if (!iban) {
    return { valid: false, error: "شماره شبا الزامی است." };
  }

  let clean = iban.replace(/\s+/g, "").toUpperCase();

  // If entered as 24 numeric digits without IR, prepend IR
  if (/^\d{24}$/.test(clean)) {
    clean = "IR" + clean;
  }

  const iranRegex = /^IR\d{24}$/;
  if (!iranRegex.test(clean)) {
    return {
      valid: false,
      error: "فرمت شماره شبا نامعتبر است. شبا باید ۲۴ رقم و با پیشوند اختیاری IR باشد.",
    };
  }

  // ISO 7064 Mod-97-10 checksum validation:
  // Rearrange: move first 4 chars (IR + 2 check digits) to the end
  const rearranged = clean.slice(4) + clean.slice(0, 4);

  // Convert letters to numbers: 'I' = 18, 'R' = 27
  let numericString = "";
  for (let i = 0; i < rearranged.length; i++) {
    const char = rearranged[i];
    if (char >= "A" && char <= "Z") {
      numericString += char.charCodeAt(0) - 55;
    } else {
      numericString += char;
    }
  }

  // Process chunk-by-chunk Mod 97
  let remainder = "";
  for (let i = 0; i < numericString.length; i++) {
    remainder += numericString[i];
    if (remainder.length >= 9) {
      remainder = (parseInt(remainder, 10) % 97).toString();
    }
  }
  const finalRemainder = parseInt(remainder, 10) % 97;

  if (finalRemainder !== 1) {
    return {
      valid: false,
      error: "شماره شبا نامعتبر است (کنترل چک‌سام MOD 97 ناموفق بود). لطفاً شماره شبا را بررسی فرمایید.",
    };
  }

  const bank = getBankByIban(clean);
  return { valid: true, formatted: clean, bank };
}

/**
 * Intelligent Bank SMS Parser
 * Parses incoming raw text for deposit amounts, tracking codes, cards/IBANs, and balances
 */
export function parseBankDepositSms(text: string): {
  isDeposit: boolean;
  type: "CARD_TO_CARD" | "POL" | "PAYA" | "UNKNOWN";
  amountRial?: number;
  amountToman?: number;
  trackingCode?: string;
  cardLast4?: string;
  accountOrIban?: string;
  balanceRial?: number;
  balanceToman?: number;
  detectedBank?: BankInfo | null;
} {
  if (!text) {
    return { isDeposit: false, type: "UNKNOWN" };
  }

  const normalized = text.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) =>
    String(d.charCodeAt(0) >= 0x06f0 ? d.charCodeAt(0) - 0x06f0 : d.charCodeAt(0) - 0x0660)
  );

  // Check deposit indicators
  const isDeposit =
    normalized.includes("واریز") ||
    normalized.includes("بستانکار") ||
    normalized.includes("+") ||
    normalized.includes("افزایش");

  // Determine transfer type
  let type: "CARD_TO_CARD" | "POL" | "PAYA" | "UNKNOWN" = "UNKNOWN";
  if (normalized.includes("پل") || normalized.includes("POL")) {
    type = "POL";
  } else if (normalized.includes("پایا") || normalized.includes("PAYA")) {
    type = "PAYA";
  } else if (normalized.includes("کارت") || normalized.includes("سحاب") || normalized.includes("شتاب")) {
    type = "CARD_TO_CARD";
  }

  // Detect bank from text keywords
  let detectedBank: BankInfo | null = null;
  for (const b of IRANIAN_BANKS) {
    if (normalized.includes(b.nameFa) || normalized.includes(b.nameEn)) {
      detectedBank = b;
      break;
    }
  }

  // Extract amount
  let amountRial: number | undefined;
  let amountToman: number | undefined;

  // Patterns for amounts like: "واریز: ۱,۵۰۰,۰۱۵ ریال" or "مبلغ: 25000000 تومان" or "+1,500,015"
  const amountMatch =
    normalized.match(/(?:واریز|مبلغ|بستانکار|\+)\s*:?\s*([0-9,]+)\s*(ریال|تومان)?/i) ||
    normalized.match(/([0-9,]+)\s*(ریال|تومان)/i);

  if (amountMatch) {
    const rawNum = parseInt(amountMatch[1].replace(/,/g, ""), 10);
    const unit = amountMatch[2];
    if (unit === "تومان") {
      amountToman = rawNum;
      amountRial = rawNum * 10;
    } else {
      // Default to Rial
      amountRial = rawNum;
      amountToman = Math.floor(rawNum / 10);
    }
  }

  // Extract tracking code / reference
  let trackingCode: string | undefined;
  const trackMatch =
    normalized.match(/(?:پیگیری|ارجاع|مرجع|رهگیری|کد|شناسه)\s*:?\s*([A-Za-z0-9-]+)/i) ||
    normalized.match(/(?:ref|trace|track)\s*:?\s*([0-9]+)/i);

  if (trackMatch && trackMatch[1]) {
    trackingCode = trackMatch[1].trim();
  }

  // Extract card last 4 or account/IBAN
  let cardLast4: string | undefined;
  const cardMatch =
    normalized.match(/(?:کارت|card)\s*:?\s*[\*xX]*(\d{4})/i) ||
    normalized.match(/(\d{4})\*+/);
  if (cardMatch) {
    cardLast4 = cardMatch[1];
  }

  let accountOrIban: string | undefined;
  const ibanMatch = normalized.match(/IR\d{24}/i);
  if (ibanMatch) {
    accountOrIban = ibanMatch[0].toUpperCase();
  }

  // Extract balance (مانده / موجودی)
  let balanceRial: number | undefined;
  let balanceToman: number | undefined;
  const balMatch = normalized.match(/(?:مانده|موجودی)\s*:?\s*([0-9,]+)\s*(ریال|تومان)?/i);
  if (balMatch) {
    const rawBal = parseInt(balMatch[1].replace(/,/g, ""), 10);
    if (balMatch[2] === "تومان") {
      balanceToman = rawBal;
      balanceRial = rawBal * 10;
    } else {
      balanceRial = rawBal;
      balanceToman = Math.floor(rawBal / 10);
    }
  }

  return {
    isDeposit,
    type,
    amountRial,
    amountToman,
    trackingCode,
    cardLast4,
    accountOrIban,
    balanceRial,
    balanceToman,
    detectedBank,
  };
}
