/**
 * Iranian Banking Utility
 * - Complete Registry of CBI Licensed Banks & Credit Institutions
 * - 16-Digit Card Luhn Mod 10 Checksum Validator
 * - 24-Digit Iranian Sheba (IBAN) ISO 7064 Mod 97-10 Checksum Validator
 * - Automatic Bank Detection by Card BIN Prefix (6 or 8 digits) and Sheba code
 * - Intelligent Bank SMS Regex Extraction for Card-to-Card and POL/PAYA
 */

export interface BankSmsTemplate {
  id: string;
  title: string;
  type: "CARD_TO_CARD" | "POL" | "PAYA" | "SIGN_BASED" | "GENERAL";
  patternType: "SIGN_BASED" | "KEYWORD_BASED" | "HYBRID";
  sampleText: string;
  status: "CONFIRMED" | "PENDING";
  confirmedAt?: string;
  extractedPreview?: {
    isDeposit: boolean;
    amountToman?: number;
    amountRial?: number;
    balanceToman?: number;
    balanceRial?: number;
    accountOrCard?: string;
    trackingCode?: string;
    date?: string;
    time?: string;
  };
}

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
  templates?: BankSmsTemplate[];
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
    templates: [
      {
        id: "tpl_mehr_sign_real",
        title: "الگوی واریز علامتی (+) بانک مهر ایران (واقعی)",
        type: "SIGN_BASED",
        patternType: "SIGN_BASED",
        sampleText: "662179818703777001 \n1,000,000+\n1405/8/16-15:46\nمانده:1,420,000",
        status: "CONFIRMED",
        confirmedAt: "2026-11-11T15:40:00Z",
        extractedPreview: {
          isDeposit: true,
          amountRial: 1000000,
          amountToman: 100000,
          balanceRial: 1420000,
          balanceToman: 142000,
          accountOrCard: "662179818703777001",
          date: "1405/8/16",
          time: "15:46",
        },
      },
      {
        id: "tpl_mehr_c2c_default",
        title: "قالب متنی سنتی کارت‌به‌کارت مهر ایران",
        type: "CARD_TO_CARD",
        patternType: "KEYWORD_BASED",
        sampleText: "بانک قرض‌الحسنه مهر ایران\nواریز کارت به کارت: ۱,۵۰۰,۰۱۵ ریال\nاز: ۶۰۳۷۹۹**۱۲۳۴\nبه: ۶۰۶۳۷۳**۷۷۶۶\nموجودی: ۲۵,۴۳۰,۵۰۰ ریال\nکد پیگیری: ۹۸۷۶۵۴۳۲۱\n۱۴۰۵/۰۸/۲۰ ۱۲:۳۰",
        status: "PENDING",
      },
      {
        id: "tpl_mehr_pol_default",
        title: "قالب متنی انتقال پل مهر ایران",
        type: "POL",
        patternType: "KEYWORD_BASED",
        sampleText: "بانک مهر ایران\nواریز انتقال پل: ۲۵۰,۰۰۰,۰۱۵ ریال\nشبا: IR120600000000111122223333\nارجاع: POL-44918237\nموجودی: ۲۷۵,۴۳۰,۵۰۰ ریال\n۱۴۰۵/۰۸/۲۰ ۱۲:۳۵",
        status: "PENDING",
      },
    ],
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
 * Resolves accurate bank details, ensuring specific bank names (e.g. بانک خاورمیانه)
 * are always prioritized over generic strings like "کارت عضو شبکه شتاب" or "بانک شتاب".
 */
export function resolveBankDetails(params: {
  cardNumber?: string | null;
  iban?: string | null;
  bankSlug?: string | null;
  bankTitle?: string | null;
}): {
  nameFa: string;
  nameEn?: string;
  slug: string;
  logo: string;
  isGenericFallback: boolean;
} {
  const { cardNumber, iban, bankSlug, bankTitle } = params;

  // 1. Try card number first
  let detected: BankInfo | null = cardNumber ? getBankByCardNumber(cardNumber) : null;

  // 2. Try IBAN
  if (!detected && iban) {
    detected = getBankByIban(iban);
  }

  // 3. Try bank slug
  if (!detected && bankSlug && bankSlug !== "shetab") {
    detected = getBankById(bankSlug);
  }

  // If detected from BIN/IBAN/slug, prioritize its official name
  if (detected) {
    return {
      nameFa: detected.nameFa,
      nameEn: detected.nameEn,
      slug: detected.id.replace(/-/g, "_"),
      logo: detected.logo,
      isGenericFallback: false,
    };
  }

  // Check if bankTitle is already a valid non-generic name
  const isGeneric =
    !bankTitle ||
    bankTitle.trim() === "" ||
    bankTitle.includes("عضو") ||
    bankTitle === "بانک شتاب" ||
    bankTitle === "کارت عضو شبکه شتاب" ||
    bankTitle === "شبکه عضو شتاب";

  if (!isGeneric && bankTitle) {
    return {
      nameFa: bankTitle.trim(),
      slug: bankSlug || "shetab",
      logo: "/images/banks/centeral.svg",
      isGenericFallback: false,
    };
  }

  // Final fallback
  return {
    nameFa: iban ? "حساب بانکی (شبا)" : "بانک عضو شتاب",
    slug: bankSlug || "shetab",
    logo: "/images/banks/centeral.svg",
    isGenericFallback: true,
  };
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

export interface SmsAnalysisResult {
  patternType: "SIGN_BASED" | "KEYWORD_BASED" | "HYBRID";
  isDeposit: boolean;
  type: "CARD_TO_CARD" | "POL" | "PAYA" | "GENERAL" | "UNKNOWN";
  amountRial: number;
  amountToman: number;
  balanceRial?: number;
  balanceToman?: number;
  accountOrCard?: string;
  cardLast4?: string;
  accountOrIban?: string;
  trackingCode?: string;
  date?: string;
  time?: string;
  confidenceScore: number;
  detectedBank: BankInfo | null;
  suggestedBank: {
    bankId: string;
    bankName: string;
    similarityScore: number;
    reason: string;
  } | null;
  similarityScores: Array<{
    bankId: string;
    bankName: string;
    similarityScore: number;
    reason: string;
  }>;
  generatedRules: {
    amountPattern: string;
    balancePattern?: string;
    accountPattern?: string;
  };
}

/**
 * Intelligent Structural Inference Engine for Bank SMS (100% Offline, No External AI / No Internet Required)
 * - Identifies mathematical sign-based (+/-) layouts (e.g. Mehr Iran, Resalat)
 * - Identifies keyword-based multi-line layouts (e.g. Mellat, Melli, Saman, Blu)
 * - Detects currency (Rial standard vs Toman)
 * - Matches structural similarities across all Iranian bank templates
 */
export function analyzeBankSmsStructure(rawText: string): SmsAnalysisResult {
  if (!rawText || !rawText.trim()) {
    return {
      patternType: "KEYWORD_BASED",
      isDeposit: false,
      type: "UNKNOWN",
      amountRial: 0,
      amountToman: 0,
      confidenceScore: 0,
      detectedBank: null,
      suggestedBank: null,
      similarityScores: [],
      generatedRules: { amountPattern: "" },
    };
  }

  // Normalize Persian / Arabic digits to English
  const normalized = rawText
    .replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) =>
      String(d.charCodeAt(0) >= 0x06f0 ? d.charCodeAt(0) - 0x06f0 : d.charCodeAt(0) - 0x0660)
    )
    .trim();

  const lines = normalized.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let patternType: "SIGN_BASED" | "KEYWORD_BASED" | "HYBRID" = "KEYWORD_BASED";
  let isDeposit = false;
  let type: "CARD_TO_CARD" | "POL" | "PAYA" | "GENERAL" | "UNKNOWN" = "UNKNOWN";
  let amountRial = 0;
  let amountToman = 0;
  let balanceRial: number | undefined;
  let balanceToman: number | undefined;
  let accountOrCard: string | undefined;
  let cardLast4: string | undefined;
  let accountOrIban: string | undefined;
  let trackingCode: string | undefined;
  let date: string | undefined;
  let time: string | undefined;
  let amountRegexUsed = "";

  // 1. Check for Sign-based pattern (+ or -)
  // Format: "1,000,000+" or "+1,000,000" or "1000000+"
  const plusSignMatch = normalized.match(/([0-9,]{3,})\s*\+/m) || normalized.match(/\+\s*([0-9,]{3,})/m);
  const minusSignMatch = normalized.match(/([0-9,]{3,})\s*-/m) || normalized.match(/-\s*([0-9,]{3,})/m);

  if (plusSignMatch) {
    patternType = "SIGN_BASED";
    isDeposit = true;
    const rawNum = parseInt(plusSignMatch[1].replace(/,/g, ""), 10);
    // Standard Core banking without unit is Rial
    amountRial = rawNum;
    amountToman = Math.floor(rawNum / 10);
    amountRegexUsed = plusSignMatch[0];
  } else if (minusSignMatch && !normalized.match(/[0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2}-[0-9]{1,2}:[0-9]{1,2}/)) {
    patternType = "SIGN_BASED";
    isDeposit = false;
    const rawNum = parseInt(minusSignMatch[1].replace(/,/g, ""), 10);
    amountRial = rawNum;
    amountToman = Math.floor(rawNum / 10);
    amountRegexUsed = minusSignMatch[0];
  }

  // 2. Keyword-based pattern if amount not extracted via sign
  if (amountRial === 0) {
    const isKeywordDeposit = /واریز|بستانکار|افزایش موجودی|شارژ/i.test(normalized);
    if (isKeywordDeposit) isDeposit = true;

    const amtMatch =
      normalized.match(/(?:واریز|مبلغ|بستانکار)\s*:?\s*([0-9,]+)\s*(ریال|تومان)?/i) ||
      normalized.match(/([0-9,]+)\s*(ریال|تومان)/i);

    if (amtMatch) {
      const rawNum = parseInt(amtMatch[1].replace(/,/g, ""), 10);
      amountRegexUsed = amtMatch[0];
      if (amtMatch[2] === "تومان") {
        amountToman = rawNum;
        amountRial = rawNum * 10;
      } else {
        amountRial = rawNum;
        amountToman = Math.floor(rawNum / 10);
      }
    }
  }

  // 3. Balance extraction (مانده / موجودی)
  const balMatch = normalized.match(/(?:مانده|موجودی|موجود|balance)\s*:?\s*([0-9,]+)\s*(ریال|تومان)?/i);
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

  // 4. Account or Card / IBAN Extraction
  const ibanMatch = normalized.match(/IR\d{24}/i);
  if (ibanMatch) {
    accountOrIban = ibanMatch[0].toUpperCase();
    accountOrCard = accountOrIban;
    type = "POL";
  }

  if (!accountOrCard) {
    for (const line of lines) {
      // Core account number (e.g. 10 to 24 digits pure, like 662179818703777001)
      if (/^[0-9]{10,24}$/.test(line)) {
        accountOrCard = line;
        accountOrIban = line;
        break;
      }
      // Masked card e.g. "۶۰۳۷۹۹**۱۲۳۴" or "606373****7766"
      const cardMasked = line.match(/(?:[0-9]{4,6}[\*xX]+[0-9]{4}|[\*xX]{4,}[0-9]{4})/);
      if (cardMasked) {
        accountOrCard = cardMasked[0];
        const lastDigits = line.match(/([0-9]{4})$/);
        if (lastDigits) cardLast4 = lastDigits[1];
        break;
      }
    }
  }

  if (!cardLast4) {
    const cardMatch = normalized.match(/(?:کارت|card)\s*:?\s*[\*xX]*(\d{4})/i) || normalized.match(/(\d{4})\*+/);
    if (cardMatch) cardLast4 = cardMatch[1];
  }

  // 5. Date and Time
  // Format: "1405/8/16-15:46" or "1405/08/20 12:30"
  const dtMatch = normalized.match(/([0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2})(?:\s*[-:]\s*|\s+)([0-9]{1,2}:[0-9]{1,2})/);
  if (dtMatch) {
    date = dtMatch[1];
    time = dtMatch[2];
  }

  // 6. Tracking / Reference Code
  const trackMatch =
    normalized.match(/(?:پیگیری|ارجاع|مرجع|رهگیری|شناسه|کد)\s*:?\s*([A-Za-z0-9-]+)/i) ||
    normalized.match(/(?:ref|trace|track)\s*:?\s*([0-9]+)/i);
  if (trackMatch && trackMatch[1]) {
    trackingCode = trackMatch[1].trim();
  }

  // 7. Determine Transfer Type
  if (type === "UNKNOWN") {
    if (normalized.includes("پل") || normalized.includes("POL")) {
      type = "POL";
    } else if (normalized.includes("پایا") || normalized.includes("PAYA")) {
      type = "PAYA";
    } else if (normalized.includes("کارت") || normalized.includes("سحاب") || normalized.includes("شتاب") || cardLast4) {
      type = "CARD_TO_CARD";
    } else if (patternType === "SIGN_BASED") {
      type = "GENERAL";
    }
  }

  // 8. Detect Bank
  let detectedBank: BankInfo | null = null;
  for (const b of IRANIAN_BANKS) {
    if (normalized.includes(b.nameFa) || normalized.includes(b.nameEn)) {
      detectedBank = b;
      break;
    }
  }

  // 9. Calculate Bank Similarities & Suggestions
  const similarityScores: Array<{
    bankId: string;
    bankName: string;
    similarityScore: number;
    reason: string;
  }> = [];

  for (const bank of IRANIAN_BANKS) {
    let score = 0;
    let reasons: string[] = [];

    // Direct name match
    if (normalized.includes(bank.nameFa) || normalized.includes(bank.nameEn)) {
      score += 90;
      reasons.push("تطابق صریح نام بانک در متن");
    }

    // Card prefix match
    if (accountOrCard) {
      const cleanAcc = accountOrCard.replace(/[^0-9]/g, "");
      for (const prefix of bank.cardPrefixes) {
        if (cleanAcc.startsWith(prefix)) {
          score += 85;
          reasons.push(`تطابق پیش‌شماره کارت (${prefix})`);
          break;
        }
      }
    }

    // Pattern structure match
    if (patternType === "SIGN_BASED") {
      if (bank.id === "mehr-iran") {
        score += 95;
        reasons.push("الگوی نشانه‌محور علامتی (+) با شناسه حساب متمرکز ۱۸ رقمی (فرمت اختصاصی بانک مهر ایران)");
      } else if (bank.id === "resalat") {
        score += 80;
        reasons.push("الگوی نشانه‌محور علامتی متداول در قرض‌الحسنه رسالت");
      }
    } else {
      // Keyword matching
      if (normalized.includes("واریز کارت به کارت") || normalized.includes("سحاب")) {
        score += 40;
        reasons.push("قالب متنی انتقال کارت به کارت شتاب");
      }
      if (normalized.includes("انتقال پل") || normalized.includes("شبا")) {
        score += 40;
        reasons.push("قالب متنی واریز سامانه پل");
      }
    }

    if (score > 0) {
      similarityScores.push({
        bankId: bank.id,
        bankName: bank.nameFa,
        similarityScore: Math.min(score, 99),
        reason: reasons.join(" + "),
      });
    }
  }

  // Sort similarity scores descending
  similarityScores.sort((a, b) => b.similarityScore - a.similarityScore);

  const suggestedBank = similarityScores.length > 0 ? similarityScores[0] : null;
  if (!detectedBank && suggestedBank && suggestedBank.similarityScore >= 80) {
    detectedBank = IRANIAN_BANKS.find((b) => b.id === suggestedBank.bankId) || null;
  }

  // Confidence score calculation
  let confidenceScore = 60;
  if (isDeposit) confidenceScore += 15;
  if (amountRial > 0) confidenceScore += 15;
  if (accountOrCard) confidenceScore += 5;
  if (balanceRial) confidenceScore += 5;

  return {
    patternType,
    isDeposit,
    type,
    amountRial,
    amountToman,
    balanceRial,
    balanceToman,
    accountOrCard,
    cardLast4,
    accountOrIban,
    trackingCode,
    date,
    time,
    confidenceScore: Math.min(confidenceScore, 99),
    detectedBank,
    suggestedBank,
    similarityScores: similarityScores.slice(0, 5),
    generatedRules: {
      amountPattern: amountRegexUsed ? `/(?:${amountRegexUsed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})/` : "",
      balancePattern: balMatch ? `/(?:مانده|موجودی)\\s*:?\\s*([0-9,]+)/` : undefined,
      accountPattern: accountOrCard ? `/${accountOrCard}/` : undefined,
    },
  };
}

/**
 * Intelligent Bank SMS Parser
 * Parses incoming raw text for deposit amounts, tracking codes, cards/IBANs, and balances
 * (Enhanced with Token-based Structural Inference Engine)
 */
export function parseBankDepositSms(text: string): {
  isDeposit: boolean;
  type: "CARD_TO_CARD" | "POL" | "PAYA" | "GENERAL" | "UNKNOWN";
  amountRial?: number;
  amountToman?: number;
  trackingCode?: string;
  cardLast4?: string;
  accountOrIban?: string;
  balanceRial?: number;
  balanceToman?: number;
  detectedBank?: BankInfo | null;
  patternType?: "SIGN_BASED" | "KEYWORD_BASED" | "HYBRID";
} {
  const result = analyzeBankSmsStructure(text);
  return {
    isDeposit: result.isDeposit,
    type: result.type,
    amountRial: result.amountRial > 0 ? result.amountRial : undefined,
    amountToman: result.amountToman > 0 ? result.amountToman : undefined,
    trackingCode: result.trackingCode,
    cardLast4: result.cardLast4,
    accountOrIban: result.accountOrIban || result.accountOrCard,
    balanceRial: result.balanceRial,
    balanceToman: result.balanceToman,
    detectedBank: result.detectedBank,
    patternType: result.patternType,
  };
}
