/**
 * Helper to manage admin emails configured via the IMAILS environment variable.
 * Example: IMAILS="admin@honarhub.com,support@domain.ir"
 */
export function getAdminEmails(): string[] {
  const envVal = process.env.IMAILS || process.env.ADMIN_EMAILS || "";
  return envVal
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAuthorizedAdminEmail(email: string): boolean {
  const allowed = getAdminEmails();
  if (allowed.length === 0) return true; // If none configured, unrestricted
  return allowed.includes(email.trim().toLowerCase());
}
