import { NextRequest } from "next/server";

export function verifyAdminAuth(req: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY || "super-secret-admin-key-change-me";
  const authHeader = req.headers.get("x-admin-key") || req.headers.get("authorization");

  if (!authHeader) return false;

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : authHeader.trim();

  return token === adminKey;
}
