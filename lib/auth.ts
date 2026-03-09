import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "portfolio_admin_session";

function secureCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.PORTFOLIO_ADMIN_SECRET?.trim());
}

export function verifyAdminSecret(secret: string): boolean {
  const expectedSecret = process.env.PORTFOLIO_ADMIN_SECRET?.trim();

  if (!expectedSecret) {
    return false;
  }

  return secureCompare(secret, expectedSecret);
}

export function createAdminSessionToken(secret: string): string {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function hasAdminSession(cookieValue?: string): boolean {
  const expectedSecret = process.env.PORTFOLIO_ADMIN_SECRET?.trim();

  if (!cookieValue || !expectedSecret) {
    return false;
  }

  return secureCompare(cookieValue, createAdminSessionToken(expectedSecret));
}
