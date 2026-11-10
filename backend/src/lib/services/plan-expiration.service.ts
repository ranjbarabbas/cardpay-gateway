import { db } from "../db";
import { sendFarazSms } from "../faraz-sms";
import { sendResendEmail } from "../resend-email";

export interface PlanLimits {
  maxCards: number;
  maxMonthlyTx: number;
  title: string;
}

export function getPlanLimits(plan: string): PlanLimits {
  switch (plan) {
    case "PRO":
      return {
        maxCards: 5,
        maxMonthlyTx: 500,
        title: "پلن حرفه‌ای",
      };
    case "SPECIAL":
    case "PREMIUM":
      return {
        maxCards: 999,
        maxMonthlyTx: 999999,
        title: "پلن ویژه (VIP)",
      };
    case "FREE":
    default:
      return {
        maxCards: 1,
        maxMonthlyTx: 50,
        title: "پلن پایه (رایگان)",
      };
  }
}

/**
 * 1. Automatically expires pending transactions past the 10-minute payment grace period.
 */
export async function expireOverduePendingTransactions(): Promise<number> {
  try {
    const now = new Date();
    const result = await db.transaction.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      data: {
        status: "EXPIRED",
      },
    });
    return result.count;
  } catch (err) {
    console.error("Error expiring overdue transactions:", err);
    return 0;
  }
}

/**
 * 2. Checks all users with expired subscriptions and automatically:
 * - Downgrades their plan to "FREE"
 * - Keeps only the first/default card active and freezes all extra cards
 * - Creates an in-app UserNotification
 * - Sends SMS and Email notifications to the user
 */
export async function checkAndEnforcePlanExpirations(): Promise<number> {
  try {
    const now = new Date();
    const expiredUsers = await db.user.findMany({
      where: {
        plan: { not: "FREE" },
        planExpiresAt: {
          not: null,
          lt: now,
        },
      },
      include: {
        cards: {
          where: { isArchived: false },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    for (const u of expiredUsers) {
      // Revert user to FREE plan
      await db.user.update({
        where: { id: u.id },
        data: {
          plan: "FREE",
          planDurationMonths: null,
        },
      });

      // Freeze all extra cards beyond the first card (FREE plan limit is 1 card)
      if (u.cards.length > 1) {
        const extraCards = u.cards.slice(1);
        await db.bankCard.updateMany({
          where: {
            id: { in: extraCards.map((c) => c.id) },
          },
          data: {
            isActive: false,
            isFrozen: true,
          },
        });
      }

      // 1. In-app notification
      const notifMessage =
        "مدت اشتراک پلن شما به پایان رسید و حساب شما به پلن پایه (رایگان) بازگشت. کارت‌های بانکی مازاد شما موقتاً فریز شدند و تنها کارت اول فعال است. جهت فعال‌سازی مجدد و بهره‌مندی از امکانات، لطفاً اشتراک خود را تمدید فرمایید.";

      await db.userNotification.create({
        data: {
          userId: u.id,
          title: "انقضای اشتراک و بازگشت به پلن پایه",
          message: notifMessage,
          type: "PLAN_EXPIRED",
        },
      });

      // 2. SMS alert
      if (u.phone) {
        sendFarazSms({
          recipient: u.phone,
          message: `کاربر گرامی هنرهاب پی،\nمدت زمان اشتراک شما به پایان رسید و حساب شما به پلن پایه منتقل شد. کارت‌های مازاد فریز شدند.\nجهت تمدید به پنل کاربری مراجعه نمایید.\nhonarhub.ir/portal`,
        }).catch((e) => console.error("Plan expiry SMS alert error:", e));
      }

      // 3. Email alert
      if (u.email) {
        sendResendEmail({
          to: u.email,
          subject: "[هنرهاب پی] اطلاع‌رسانی انقضای اشتراک و بازگشت به پلن پایه",
          html: `
            <div dir="rtl" style="font-family: Tahoma, sans-serif; padding: 24px; background-color: #0F172A; color: #f8fafc; border-radius: 12px; line-height: 1.8;">
              <h2 style="color: #f59e0b; margin-top: 0;">پایان مهلت اشتراک در هنرهاب پی</h2>
              <p>کاربر گرامی <strong>${u.name || "عزیز"}</strong>،</p>
              <p>${notifMessage}</p>
              <div style="margin: 20px 0;">
                <a href="https://honarhub.ir/portal" style="background-color: #10b981; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  تمدید فوری اشتراک در پنل کاربری
                </a>
              </div>
            </div>
          `,
        }).catch((e) => console.error("Plan expiry email error:", e));
      }
    }

    return expiredUsers.length;
  } catch (err) {
    console.error("Error checking plan expirations:", err);
    return 0;
  }
}

/**
 * 3. Sets or updates a user's plan and subscription duration (e.g. 1, 3, 12 months)
 * - Automatically unfreezes or freezes cards according to new plan limits
 * - Automatically sends in-app notification, SMS, and Email to user
 */
export async function setUserPlanAndDuration(
  userId: string,
  newPlan: string,
  durationMonths: number = 1,
  adminNotes?: string
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      cards: {
        where: { isArchived: false },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) throw new Error("کاربر یافت نشد.");

  let planExpiresAt: Date | null = null;
  if (newPlan !== "FREE") {
    const days = durationMonths * 30;
    // If user already has an active subscription of the same or higher plan, extend from existing expiry date
    const baseDate =
      user.planExpiresAt && user.planExpiresAt > new Date()
        ? new Date(user.planExpiresAt)
        : new Date();
    planExpiresAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      plan: newPlan,
      planDurationMonths: newPlan === "FREE" ? null : durationMonths,
      planExpiresAt,
    },
  });

  const limits = getPlanLimits(newPlan);

  // Manage cards according to new plan capacity
  if (newPlan === "FREE") {
    // Freeze cards beyond the first card
    if (user.cards.length > 1) {
      const extraCards = user.cards.slice(1);
      await db.bankCard.updateMany({
        where: { id: { in: extraCards.map((c) => c.id) } },
        data: { isActive: false, isFrozen: true },
      });
    }
  } else {
    // Unfreeze cards up to maxCards limit
    const allowedCards = user.cards.slice(0, limits.maxCards);
    await db.bankCard.updateMany({
      where: { id: { in: allowedCards.map((c) => c.id) } },
      data: { isActive: true, isFrozen: false },
    });

    if (user.cards.length > limits.maxCards) {
      const remainingExtra = user.cards.slice(limits.maxCards);
      await db.bankCard.updateMany({
        where: { id: { in: remainingExtra.map((c) => c.id) } },
        data: { isActive: false, isFrozen: true },
      });
    }
  }

  // User notification
  const expiryPersianDate = planExpiresAt
    ? planExpiresAt.toLocaleDateString("fa-IR")
    : "همیشگی";

  const isUpgrade = newPlan !== "FREE";
  const notifTitle = isUpgrade ? "ارتقا و فعال‌سازی اشتراک حساب" : "تغییر پلن حساب کاربری";
  const notifMessage = isUpgrade
    ? `اشتراک شما با موفقیت به «${limits.title}» (${durationMonths} ماهه) ارتقا یافت و تا تاریخ ${expiryPersianDate} فعال است. کارت‌های بانکی مجاز شما فعال گردیدند.`
    : `پلن حساب شما به «${limits.title}» تغییر یافت. در پلن پایه تنها ۱ کارت بانکی فعال باقی مانده و سایر کارت‌ها فریز می‌باشند.`;

  await db.userNotification.create({
    data: {
      userId: user.id,
      title: notifTitle,
      message: notifMessage,
      type: isUpgrade ? "PLAN_UPGRADED" : "PLAN_DOWNGRADED",
    },
  });

  // SMS Alert
  if (user.phone) {
    sendFarazSms({
      recipient: user.phone,
      message: `کاربر گرامی هنرهاب پی،\n${notifMessage}\nhonarhub.ir/portal`,
    }).catch((e) => console.error("User plan notification SMS failed:", e));
  }

  // Email Alert
  if (user.email) {
    sendResendEmail({
      to: user.email,
      subject: `[هنرهاب پی] ${notifTitle}`,
      html: `
        <div dir="rtl" style="font-family: Tahoma, sans-serif; padding: 24px; background-color: #0F172A; color: #f8fafc; border-radius: 12px; line-height: 1.8;">
          <h2 style="color: #10b981; margin-top: 0;">${notifTitle}</h2>
          <p>کاربر گرامی <strong>${user.name || "عزیز"}</strong>،</p>
          <p>${notifMessage}</p>
          ${adminNotes ? `<p style="color: #94a3b8; font-size: 13px;">توضیحات مدیریت: ${adminNotes}</p>` : ""}
          <div style="margin: 20px 0;">
            <a href="https://honarhub.ir/portal" style="background-color: #10b981; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              ورود به پنل کاربری هنرهاب پی
            </a>
          </div>
        </div>
      `,
    }).catch((e) => console.error("User plan notification Email failed:", e));
  }

  return updatedUser;
}

/**
 * Checks if a transaction is a Plan Upgrade purchase, and if so, automatically upgrades the user.
 */
export async function checkAndProcessPlanUpgradeTransaction(transactionId: string): Promise<boolean> {
  try {
    const tx = await db.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx || !tx.description || !tx.description.includes("UPGRADE_PLAN:")) {
      return false;
    }
    const match = tx.description.match(/UPGRADE_PLAN:(PRO|SPECIAL):([136]):([a-zA-Z0-9_-]+)/);
    if (!match) return false;

    const targetPlan = match[1];
    const durationMonths = parseInt(match[2], 10);
    const userId = match[3] || tx.userId;

    if (!userId) return false;

    await setUserPlanAndDuration(
      userId,
      targetPlan,
      durationMonths,
      `ارتقای خودکار پس از پرداخت موفقیت‌آمیز فاکتور واریز کارت به کارت (کد رهگیری: ${tx.internalTrackingCode || tx.authority})`
    );
    console.log(`[PLAN_UPGRADE_AUTO_SUCCESS] User ${userId} upgraded to ${targetPlan} for ${durationMonths} months via Tx ${tx.id}`);
    return true;
  } catch (err) {
    console.error("[PLAN_UPGRADE_AUTO_ERROR]", err);
    return false;
  }
}

