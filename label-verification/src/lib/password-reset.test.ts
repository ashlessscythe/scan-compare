import { describe, expect, it } from "vitest";
import {
  buildPasswordResetUrl,
  forgotPasswordSchema,
  generatePasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetExpired,
  normalizePasswordResetEmail,
  passwordResetExpiryDate,
  PASSWORD_RESET_TOKEN_TTL_MS,
  resetPasswordSchema,
} from "./password-reset";

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "bad" }).success).toBe(false);
    expect(
      forgotPasswordSchema.safeParse({ email: "user@example.com" }).success,
    ).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  it("requires token and password of at least 8 characters", () => {
    expect(
      resetPasswordSchema.safeParse({ token: "", password: "longenough" }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({ token: "abc", password: "short" }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({ token: "abc", password: "longenough" }).success,
    ).toBe(true);
  });
});

describe("normalizePasswordResetEmail", () => {
  it("lowercases email for lookup", () => {
    expect(normalizePasswordResetEmail("Admin@Example.COM")).toBe("admin@example.com");
  });
});

describe("password reset tokens", () => {
  it("generates unique URL-safe tokens", () => {
    const a = generatePasswordResetToken();
    const b = generatePasswordResetToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });

  it("hashes tokens deterministically without storing the raw value", () => {
    const token = generatePasswordResetToken();
    const hash = hashPasswordResetToken(token);
    expect(hash).toBe(hashPasswordResetToken(token));
    expect(hash).not.toBe(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("computes expiry from TTL", () => {
    const now = new Date("2026-08-26T12:00:00.000Z");
    const expires = passwordResetExpiryDate(now);
    expect(expires.getTime() - now.getTime()).toBe(PASSWORD_RESET_TOKEN_TTL_MS);
  });

  it("detects expired tokens", () => {
    const now = new Date("2026-08-26T12:00:00.000Z");
    expect(isPasswordResetExpired(new Date("2026-08-26T11:00:00.000Z"), now)).toBe(true);
    expect(isPasswordResetExpired(new Date("2026-08-26T13:00:00.000Z"), now)).toBe(false);
    expect(isPasswordResetExpired(null, now)).toBe(true);
  });
});

describe("buildPasswordResetUrl", () => {
  it("embeds the token in a reset-password path", () => {
    const url = buildPasswordResetUrl("tok+en/value");
    expect(url).toContain("/reset-password?token=");
    expect(url).toContain(encodeURIComponent("tok+en/value"));
  });
});
