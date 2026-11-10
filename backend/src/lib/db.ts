import { PrismaClient } from "@prisma/client";

// Normalize DATABASE_URL for SQLite if file: protocol prefix is missing
if (process.env.DATABASE_URL) {
  const rawDbUrl = process.env.DATABASE_URL.trim();
  if (!rawDbUrl.startsWith("file:") && !rawDbUrl.includes("://")) {
    process.env.DATABASE_URL = `file:${rawDbUrl}`;
  }
}

// Workaround for BigInt serialization in JSON
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/**
 * Format database and Prisma errors into clear, friendly Persian messages
 */
export function formatFriendlyDbError(err: any): string {
  const msg = err?.message || String(err || "");
  if (
    msg.includes("Can't reach database server") ||
    msg.includes("P1001") ||
    msg.includes("P1000") ||
    msg.includes("connection refused")
  ) {
    const hostMatch = msg.match(/at `([^`]+)`/);
    const host = hostMatch ? hostMatch[1] : "";
    return `عدم دسترسی به سرور پایگاه داده${host ? ` (${host})` : ""}. لطفاً بررسی نمایید که سرویس دیتابیس در کولیفای در وضعیت روشن (Running) باشد و آدرس DATABASE_URL دقیقاً برابر با Internal Connection String دیتابیس ست شده باشد.`;
  }
  if (msg.includes("datasource `db`") || msg.includes("protocol `file:`")) {
    return "خطا در فرمت پایگاه داده. لطفاً مقدار متغیر DATABASE_URL را در تنظیمات بررسی نمایید.";
  }
  if (msg.includes("Unique constraint failed") || msg.includes("P2002")) {
    return "اطلاعات وارد شده تکراری است (این شماره کارت، آدرس ایمیل یا شماره موبایل از قبل در سیستم ثبت گردیده است).";
  }
  if (msg.includes("Record to update not found") || msg.includes("P2025")) {
    return "رکورد مورد نظر در پایگاه داده یافت نشد.";
  }
  if (msg.includes("prisma") || msg.includes("invocation")) {
    return "خطا در پردازش اطلاعات پایگاه داده. لطفاً مجدداً تلاش فرمایید.";
  }
  return msg;
}
