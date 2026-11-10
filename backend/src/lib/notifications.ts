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

    // Only PRO and SPECIAL plan users receive deposit alerts
    const isProOrSpecial = user.plan === "PRO" || user.plan === "SPECIAL";
    if (!isProOrSpecial) {
      return { smsSent: false, emailSent: false, details: "User plan is FREE (deposit alerts require PRO/SPECIAL)" };
    }

    const amountNum = Number(params.amountToman);
    const amountStr = amountNum.toLocaleString("fa-IR");
    const trackCode = params.trackingCode || `PAY-${params.transactionId.substring(0, 8)}`;
    const results: { smsSent: boolean; emailSent: boolean; details?: any } = {
      smsSent: false,
      emailSent: false,
    };

    const userPhone = user.phone || (user as any).phoneNumber || "";

    // 1. Send SMS Deposit Alert if enabled in settings
    if (settings.sms.depositAlertProEnabled && userPhone) {
      try {
        const smsRes = await sendDepositAlertSms(userPhone, amountStr, trackCode);
        results.smsSent = smsRes.success;
      } catch (smsErr) {
        console.error("[DEPOSIT_NOTIFICATION_SMS_ERROR]", smsErr);
      }
    }

    // 2. Send Email Deposit Alert if email verified and user has enabled email alerts
    if (user.email && user.isEmailVerified && user.emailNotifyDeposit !== false) {
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
          to: user.email,
          subject: `واریز موفق مبلغ ${amountStr} تومان به حساب شما - هنرهاب پی`,
          html,
        });
        results.emailSent = emailRes.success;
      } catch (emailErr) {
        console.error("[DEPOSIT_NOTIFICATION_EMAIL_ERROR]", emailErr);
      }
    }

    return results;
  } catch (err: any) {
    console.error("[DISPATCH_DEPOSIT_NOTIFICATIONS_ERROR]", err);
    return { smsSent: false, emailSent: false, details: err.message };
  }
}
