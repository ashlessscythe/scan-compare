import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { normalizeRegisterEmail } from "@/lib/register";

/** How long a password-reset token remains valid. */
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export function normalizePasswordResetEmail(email: string): string {
  return normalizeRegisterEmail(email);
}

/** Generate a URL-safe raw token (send this in email; store only the hash). */
export function generatePasswordResetToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 hex digest of the raw token for DB storage. */
export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function passwordResetExpiryDate(now = new Date()): Date {
  return new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS);
}

export function isPasswordResetExpired(
  expiresAt: Date | null | undefined,
  now = new Date(),
): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() <= now.getTime();
}

/** Build the absolute reset URL included in the email. */
export function buildPasswordResetUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}
