import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, userId, type, newPassword } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: "ایمیل و کد تایید الزامی هستند." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();
    const now = new Date();

    // Find valid matching verification code
    const validCode = await db.verificationCode.findFirst({
      where: {
        target: cleanEmail,
        code: cleanCode,
        isUsed: false,
        expiresAt: { gt: now },
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!validCode) {
      return NextResponse.json(
        { success: false, error: "کد تایید وارد شده نامعتبر است یا منقضی شده است." },
        { status: 400 }
      );
    }

    // Mark code as used
    await db.verificationCode.update({
      where: { id: validCode.id },
      data: { isUsed: true },
    });

    let updatedUser: any = null;

    if (userId) {
      updatedUser = await db.user.update({
        where: { id: userId },
        data: {
          email: cleanEmail,
          isEmailVerified: true,
          ...(newPassword ? { password: newPassword } : {}),
        },
      });
    } else {
      // Find user by email
      const existingUser = await db.user.findFirst({
        where: { email: cleanEmail },
      });

      if (existingUser) {
        updatedUser = await db.user.update({
          where: { id: existingUser.id },
          data: {
            isEmailVerified: true,
            ...(newPassword ? { password: newPassword } : {}),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "تایید ایمیل با موفقیت انجام شد.",
      user: updatedUser
        ? {
            id: updatedUser.id,
            email: updatedUser.email,
            isEmailVerified: updatedUser.isEmailVerified,
            emailNotifyDeposit: updatedUser.emailNotifyDeposit,
            plan: updatedUser.plan,
          }
        : null,
    });
  } catch (error: any) {
    console.error("[EMAIL_VERIFY_OTP_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "خطا در بررسی کد تایید" },
      { status: 500 }
    );
  }
}
