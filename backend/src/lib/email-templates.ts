// HonarHub Pay Email HTML/CSS Templates
// Designed with modern fintech dark aesthetic, full RTL support, and high email-client compatibility.

interface OtpEmailOptions {
  recipientName?: string;
  code: string;
  expiresMinutes?: number;
}

interface PasswordResetEmailOptions {
  recipientName?: string;
  code: string;
  resetLink?: string;
  userEmail?: string;
  expiresMinutes?: number;
}

interface DepositAlertEmailOptions {
  recipientName?: string;
  amountToman: number | string;
  trackingCode: string;
  bankTitle?: string;
  cardLast4?: string;
  customerMobile?: string;
  description?: string;
  dateStr?: string;
  timeStr?: string;
}

/**
 * Common HTML email wrapper with HonarHub Pay brand styling
 */
function emailLayout(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: Tahoma, 'Segoe UI', Arial, sans-serif; direction: rtl; text-align: right; color: #E2E8F0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B0F17; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);">
          
          <!-- Header Banner (Brand Logo Top-Right like Main Site) -->
          <tr>
            <td style="padding: 22px 28px; background: linear-gradient(135deg, #0F172A 0%, #132238 100%); border-bottom: 1px solid #1E293B;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl">
                <tr>
                  <!-- Brand Logo (Right Aligned) -->
                  <td align="right" style="vertical-align: middle;">
                    <a href="https://pay.honarhub.com" target="_blank" style="text-decoration: none; display: inline-block;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #020617; border: 1px solid #334155; border-radius: 12px; padding: 6px 14px; vertical-align: middle;">
                            <span style="font-size: 19px; font-weight: 900; color: #FFFFFF; font-family: Tahoma, 'Segoe UI', sans-serif; letter-spacing: -0.5px;">هنر</span><span style="background-color: #F59E0B; color: #020617; padding: 2px 7px; border-radius: 6px; margin-right: 4px; font-size: 15px; font-weight: 900;">هاب</span><span style="padding-right: 6px; font-size: 14px; font-weight: 800; color: #10B981; font-family: Tahoma, 'Segoe UI', sans-serif;">پی</span>
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                  <!-- Tagline Badge (Left Aligned) -->
                  <td align="left" style="vertical-align: middle;">
                    <span style="display: inline-block; font-size: 11px; color: #10B981; background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 20px; padding: 4px 12px; font-family: Tahoma, sans-serif; font-weight: 600;">
                      درگاه پرداخت امن
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding: 20px 32px; background-color: #090D16; border-top: 1px solid #1E293B; text-align: center; font-size: 11px; color: #64748B; line-height: 1.8;">
              <p style="margin: 0 0 6px 0;">
                این پیام به صورت خودکار از سوی سیستم امنیتی <strong>هنرهاب پی</strong> ارسال گردیده است.
              </p>
              <p style="margin: 0; color: #475569;">
                پشتیبانی: support@honarhub.com | وب‌سایت: <a href="https://honarhub.com" style="color: #10B981; text-decoration: none;">honarhub.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 1. Template: Email OTP / Verification Code (رمز یکبار مصرف)
 */
export function getEmailOtpTemplate(options: OtpEmailOptions): string {
  const { recipientName = "کاربر گرامی", code, expiresMinutes = 5 } = options;

  const content = `
    <h2 style="font-size: 18px; font-weight: 800; color: #FFFFFF; margin: 0 0 12px 0;">
      رمز یکبار مصرف و تایید هویت
    </h2>
    <p style="font-size: 13px; color: #CBD5E1; line-height: 1.8; margin: 0 0 24px 0;">
      سلام <strong>${recipientName}</strong> عزیز،<br>
      کد یکبار مصرف شما جهت ورود، تایید آدرس ایمیل و احراز هویت در سامانه هنرهاب پی به شرح زیر است:
    </p>

    <!-- OTP Code Display Card -->
    <div style="background-color: #020617; border: 2px dashed #0D9488; border-radius: 16px; padding: 22px 16px; text-align: center; margin: 0 0 24px 0;">
      <div style="font-size: 11px; color: #2DD4BF; font-weight: bold; margin-bottom: 8px;">
        کد تایید اختصاصی شما (OTP)
      </div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #10B981; direction: ltr; text-align: center;">
        ${code}
      </div>
      <div style="font-size: 11px; color: #94A3B8; margin-top: 10px;">
        ⏱ این کد به مدت <strong>${expiresMinutes} دقیقه</strong> معتبر می‌باشد.
      </div>
    </div>

    <!-- Security Alert Box -->
    <div style="background-color: #172554; border-right: 4px solid #3B82F6; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #93C5FD; line-height: 1.7; margin: 0 0 16px 0;">
      <strong>توصیه امنیتی:</strong> هرگز این کد را در اختیار افراد دیگر قرار ندهید. کارشناسان و پشتیبانی هنرهاب پی هرگز این کد را از شما درخواست نخواهند کرد.
    </div>

    <p style="font-size: 12px; color: #64748B; margin: 0;">
      اگر شما درخواستی برای دریافت این کد ثبت نکرده‌اید، لطفاً این ایمیل را نادیده بگیرید.
    </p>
  `;

  return emailLayout("کد تایید یکبار مصرف - هنرهاب پی", content);
}

/**
 * 2. Template: Password Reset / Change (تغییر و بازیابی رمز عبور)
 */
export function getPasswordResetTemplate(options: PasswordResetEmailOptions): string {
  const {
    recipientName = "کاربر گرامی",
    code,
    resetLink,
    userEmail = "",
    expiresMinutes = 15,
  } = options;

  const content = `
    <h2 style="font-size: 18px; font-weight: 800; color: #FFFFFF; margin: 0 0 12px 0;">
      درخواست تغییر / بازیابی کلمه عبور
    </h2>
    <p style="font-size: 13px; color: #CBD5E1; line-height: 1.8; margin: 0 0 20px 0;">
      سلام <strong>${recipientName}</strong>،<br>
      درخواستی برای تغییر یا بازیابی کلمه عبور حساب کاربری هنرهاب پی مربوط به آدرس ${userEmail ? `(<strong>${userEmail}</strong>)` : ""} ثبت گردیده است.
    </p>

    <!-- Verification Code for Reset -->
    <div style="background-color: #020617; border: 2px dashed #EAB308; border-radius: 16px; padding: 20px 16px; text-align: center; margin: 0 0 24px 0;">
      <div style="font-size: 11px; color: #FACC15; font-weight: bold; margin-bottom: 6px;">
        کد تایید جهت تغییر کلمه عبور
      </div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #F59E0B; direction: ltr; text-align: center;">
        ${code}
      </div>
      <div style="font-size: 11px; color: #94A3B8; margin-top: 8px;">
        مهلت استفاده: <strong>${expiresMinutes} دقیقه</strong>
      </div>
    </div>

    ${
      resetLink
        ? `
      <div style="text-align: center; margin: 0 0 24px 0;">
        <a href="${resetLink}" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFFFFF; font-size: 13px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
          تایید و تعیین کلمه عبور جدید
        </a>
      </div>
    `
        : ""
    }

    <!-- High Security Warning -->
    <div style="background-color: #2D0607; border-right: 4px solid #EF4444; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #FCA5A5; line-height: 1.7; margin: 0 0 16px 0;">
      <strong>هشدار امنیتی:</strong> اگر شما این درخواست را ثبت نکرده‌اید، ممکن است امنیت حساب شما در خطر باشد. لطفاً فوراً با پشتیبانی ما تماس بگیرید.
    </div>

    <p style="font-size: 11px; color: #64748B; margin: 0;">
      تاریخ ثبت درخواست: ${new Date().toLocaleDateString("fa-IR")} - ${new Date().toLocaleTimeString("fa-IR")}
    </p>
  `;

  return emailLayout("درخواست بازیابی رمز عبور - هنرهاب پی", content);
}

/**
 * 3. Template: Successful Payment / Deposit Alert (اطلاع‌رسانی پرداخت و واریز موفق)
 */
export function getDepositAlertTemplate(options: DepositAlertEmailOptions): string {
  const {
    recipientName = "پذیرنده گرامی",
    amountToman,
    trackingCode,
    bankTitle = "بانک قرض‌الحسنه مهر ایران",
    cardLast4 = "",
    customerMobile = "",
    description = "",
    dateStr = new Date().toLocaleDateString("fa-IR"),
    timeStr = new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
  } = options;

  const formattedAmount =
    typeof amountToman === "number"
      ? amountToman.toLocaleString("fa-IR")
      : amountToman;

  const content = `
    <!-- Top Success Pill -->
    <div style="text-align: center; margin-bottom: 18px;">
      <span style="background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); color: #34D399; font-size: 12px; font-weight: bold; padding: 6px 16px; border-radius: 20px; display: inline-block;">
        ✓ واریز موفق به درگاه پرداخت
      </span>
    </div>

    <h2 style="font-size: 19px; font-weight: 800; color: #FFFFFF; text-align: center; margin: 0 0 12px 0;">
      دریافت واریز جدید در هنرهاب پی
    </h2>
    <p style="font-size: 13px; color: #CBD5E1; text-align: center; line-height: 1.8; margin: 0 0 24px 0;">
      سلام <strong>${recipientName}</strong>، یک تراکنش واریز جدید با موفقیت توسط پیامک بانک تایید و تسویه گردید.
    </p>

    <!-- Highlighted Amount Card -->
    <div style="background: linear-gradient(135deg, #064E3B 0%, #022C22 100%); border: 1px solid #059669; border-radius: 18px; padding: 20px; text-align: center; margin: 0 0 24px 0; box-shadow: 0 10px 25px rgba(5, 150, 105, 0.25);">
      <div style="font-size: 11px; color: #6EE7B7; font-weight: bold; margin-bottom: 4px;">
        مبلغ واریز شده به حساب شما
      </div>
      <div style="font-size: 30px; font-weight: 900; color: #FFFFFF; font-family: Tahoma, sans-serif;">
        +${formattedAmount} <span style="font-size: 16px; color: #A7F3D0; font-weight: normal;">تومان</span>
      </div>
    </div>

    <!-- Receipt Details Table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #020617; border: 1px solid #1E293B; border-radius: 16px; padding: 16px; margin: 0 0 24px 0; font-size: 12px;">
      <tr>
        <td style="padding: 8px 12px; color: #94A3B8; border-bottom: 1px solid #1E293B;">کد پیگیری تراکنش:</td>
        <td style="padding: 8px 12px; color: #F1F5F9; font-weight: bold; font-family: 'Courier New', monospace; direction: ltr; text-align: left; border-bottom: 1px solid #1E293B;">
          ${trackingCode}
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; color: #94A3B8; border-bottom: 1px solid #1E293B;">کارت بانکی مقصد:</td>
        <td style="padding: 8px 12px; color: #F1F5F9; border-bottom: 1px solid #1E293B;">
          ${bankTitle} ${cardLast4 ? `(کارت: ****${cardLast4})` : ""}
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; color: #94A3B8; border-bottom: 1px solid #1E293B;">زمان و تاریخ واریز:</td>
        <td style="padding: 8px 12px; color: #F1F5F9; border-bottom: 1px solid #1E293B;">
          ${dateStr} - ساعت ${timeStr}
        </td>
      </tr>
      ${
        customerMobile
          ? `
      <tr>
        <td style="padding: 8px 12px; color: #94A3B8; border-bottom: 1px solid #1E293B;">شماره پرداخت‌کننده:</td>
        <td style="padding: 8px 12px; color: #F1F5F9; font-family: 'Courier New', monospace; direction: ltr; text-align: left; border-bottom: 1px solid #1E293B;">
          ${customerMobile}
        </td>
      </tr>
      `
          : ""
      }
      ${
        description
          ? `
      <tr>
        <td style="padding: 8px 12px; color: #94A3B8;">بابت / توضیحات:</td>
        <td style="padding: 8px 12px; color: #F1F5F9;">
          ${description}
        </td>
      </tr>
      `
          : ""
      }
    </table>

    <!-- Action Link -->
    <div style="text-align: center; margin: 0 0 16px 0;">
      <a href="https://honarhub.com/portal" style="background-color: #1E293B; border: 1px solid #334155; color: #E2E8F0; font-size: 12px; font-weight: bold; text-decoration: none; padding: 10px 24px; border-radius: 10px; display: inline-block;">
        مشاهده جزییات در پنل کاربری هنرهاب پی
      </a>
    </div>
  `;

  return emailLayout("اعلان واریز موفق - هنرهاب پی", content);
}
