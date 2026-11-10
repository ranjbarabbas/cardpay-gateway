import crypto from "crypto";
import { db } from "./db";
import { sendOtpSms } from "./faraz-sms";
import { sendResendEmail } from "./resend-email";
import { getEmailOtpTemplate } from "./email-templates";

const PASSWORD_SALT = "_honarhub_pay_secure_salt_2026_";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + PASSWORD_SALT).digest("hex");
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  const computed = hashPassword(password);
  return computed === storedHash || password === storedHash;
}

export interface CleanIdentifier {
  clean: string;
  isEmail: boolean;
  phone?: string;
  email?: string;
}

export function parseIdentifier(rawInput: string): CleanIdentifier {
  const trimmed = rawInput.trim();
  const isEmail = trimmed.includes("@");
  if (isEmail) {
    const cleanEmail = trimmed.toLowerCase();
    return { clean: cleanEmail, isEmail: true, email: cleanEmail };
  } else {
    let cleanPhone = trimmed.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0098")) cleanPhone = "0" + cleanPhone.slice(4);
    else if (cleanPhone.startsWith("98") && cleanPhone.length === 12) cleanPhone = "0" + cleanPhone.slice(2);
    else if (!cleanPhone.startsWith("0") && cleanPhone.length === 10) cleanPhone = "0" + cleanPhone;
    return { clean: cleanPhone, isEmail: false, phone: cleanPhone };
  }
}

/**
 * Send 5-digit OTP via SMS (Faraz SMS pattern) or Email (Resend)
 */
export async function sendOtp(params: {
  target: string;
  isEmail: boolean;
  type?: string;
  recipientName?: string;
}): Promise<{ success: boolean; code?: string; expiresAt: Date; message?: string; error?: string }> {
  const { target, isEmail, type = "LOGIN_OTP", recipientName = "کاربر گرامی" } = params;

  // Generate 5-digit numeric OTP
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  // Invalidate previous unexpired codes for this target
  await db.verificationCode.updateMany({
    where: {
      target,
      isUsed: false,
    },
    data: {
      isUsed: true,
    },
  });

  // Save new code to DB
  await db.verificationCode.create({
    data: {
      target,
      code,
      type,
      expiresAt,
    },
  });

  if (isEmail) {
    const html = getEmailOtpTemplate({
      recipientName,
      code,
      expiresMinutes: 5,
    });
    const emailRes = await sendResendEmail({
      to: target,
      subject: `کد تایید یکبار مصرف ورود به هنرهاب پی: ${code}`,
      html,
    });
    return {
      success: true,
      code,
      expiresAt,
      message: `کد تایید ۵ رقمی به آدرس ایمیل ${target} ارسال گردید.`,
    };
  } else {
    // Send via Faraz SMS pattern with variable 'code'
    const smsRes = await sendOtpSms(target, code);
    return {
      success: true,
      code,
      expiresAt,
      message: `کد تایید ۵ رقمی به شماره ${target} پیامک شد.`,
    };
  }
}

/**
 * Verify OTP entered by user
 */
export async function verifyOtpCode(target: string, code: string): Promise<boolean> {
  const cleanCode = code.toString().trim();
  const now = new Date();

  const validRecord = await db.verificationCode.findFirst({
    where: {
      target,
      code: cleanCode,
      isUsed: false,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!validRecord) return false;

  // Mark as used
  await db.verificationCode.update({
    where: { id: validRecord.id },
    data: { isUsed: true },
  });

  return true;
}
