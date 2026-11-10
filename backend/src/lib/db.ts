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
