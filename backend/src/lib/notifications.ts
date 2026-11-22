// Deposit & User Notification Dispatcher
// Dispatches SMS alerts via Faraz SMS and Email alerts via Resend

import { db } from "./db";
import { getSystemSettings } from "./settings";
import { sendDepositAlertSms } from "./faraz-sms";
import { sendResendEmail } from "./resend-email";
import { getDepositAlertTemplate } from "./email-templates";

export interface DepositNotificationParams {
  transactionId: string;
  trackingCode?: string;
  amountToman: number | bigint | string;
  cardId?: string;
  userId?: string;
}

export async function dispatchDepositNotifications(params: DepositNotificationParams): Promise<{
  smsSent: boolean;
  emailSent: boolean;
  details?: any;
}> {
  try {
    const settings = getSystemSettings();
    let user: any = null;
    let card: any = null;

    if (params.userId) {
      user = await db.user.findUnique({ where: { id: params.userId } });
    }

    if (params.cardId) {
      card = await db.bankCard.findUnique({
        where: { id: params.cardId },
        include: { user: true },
      });
      if (!user && card?.user) {
        user = card.user;
      }
    }

    if (!user) {
      // Find via transaction
      const tx = await db.transaction.findUnique({
        where: { id: params.transactionId },
        include: { user: true, card: { include: { user: true } } },
      });
      user = tx?.user || tx?.card?.user;
      if (!card && tx?.card) {
        card = tx.card;
      }
    }

    if (!user) {
      return { smsSent: false, emailSent: false, details: "No user attached to transaction" };
    }

    // Only PRO and SPECIAL/VIP plan users receive deposit alerts
    const planUpper = (user.plan || "FREE").toUpperCase();
    const isPro = planUpper === "PRO";
    const isVip = planUpper === "SPECIAL" || planUpper === "VIP";

    if (!isPro && !isVip) {
      return { smsSent: false, emailSent: false, details: `User plan is ${planUpper} (deposit alerts require PRO or VIP/SPECIAL)` };
    }

    const amountNum = Number(params.amountToman);
    const amountStr = amountNum.toLocaleString("fa-IR");
    const trackCode = params.trackingCode || `PAY-${params.transactionId.substring(0, 8)}`;
    const results: { smsSent: boolean; emailSent: boolean; details?: any } = {
      smsSent: false,
      emailSent: false,
    };

    const userPhone = (user.phone || (user as any).phoneNumber || "").trim();
    const userEmail = (user.email || "").trim();

    // System-level settings
    const isEmailGloballyEnabled = settings.email?.enabled !== false;
    const isSmsGloballyEnabled = settings.sms?.enabled !== false;
    const isProEmailEnabled = settings.email?.proEmailNotifyEnabled !== false;
    const isVipEmailEnabled = settings.email?.vipEmailNotifyEnabled !== false;
    const isVipSmsEnabled = settings.sms?.vipSmsNotifyEnabled !== false;

    // Helper: Send deposit confirmation email
    const sendAlertEmail = async () => {
      if (!userEmail) return;
      try {
        const html = getDepositAlertTemplate({
          recipientName: user.name || "کاربر گرامی",
          amountToman: amountNum,
          trackingCode: trackCode,
          bankTitle: card?.bankTitle || "کارت بانکی متصل",
          cardLast4: card?.cardNumber ? card.cardNumber.slice(-4) : undefined,
          customerMobile: userPhone,
        });

        const emailRes = await sendResendEmail({
          to: userEmail,
          subject: `واریز موفق مبلغ ${amountStr} تومان به حساب شما - هنرهاب پی`,
          html,
        });
        results.emailSent = emailRes.success;
      } catch (emailErr) {
        console.error("[DEPOSIT_NOTIFICATION_EMAIL_ERROR]", emailErr);
      }
    };

    // Helper: Send deposit confirmation SMS (VIP only)
    const sendAlertSms = async () => {
      if (!userPhone) return;
      try {
        const smsRes = await sendDepositAlertSms(userPhone, amountNum, trackCode);
        results.smsSent = smsRes.success;
      } catch (smsErr) {
        console.error("[DEPOSIT_NOTIFICATION_SMS_ERROR]", smsErr);
      }
    };

    // 1. Plan PRO:
    // If user has email registered -> send email (if enabled). Do not send SMS.
    if (isPro) {
      if (isEmailGloballyEnabled && isProEmailEnabled && userEmail && user.emailNotifyDeposit !== false) {
        await sendAlertEmail();
      }
    }

    // 2. Plan VIP (SPECIAL):
    // If user has email registered -> send email (if enabled).
    // If user has mobile registered -> send SMS (if enabled) with pattern parameters 'number' and 'code'.
    if (isVip) {
      if (isEmailGloballyEnabled && isVipEmailEnabled && userEmail && user.emailNotifyDeposit !== false) {
        await sendAlertEmail();
      }

      if (isSmsGloballyEnabled && isVipSmsEnabled && userPhone) {
        await sendAlertSms();
      }
    }

    return results;
  } catch (err: any) {
    console.error("[DISPATCH_DEPOSIT_NOTIFICATIONS_ERROR]", err);
    return { smsSent: false, emailSent: false, details: err.message };
  }
}
