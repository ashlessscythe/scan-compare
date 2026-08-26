import { describe, expect, it } from "vitest";
import {
  passwordResetEmailHtml,
  passwordResetEmailSubject,
  passwordResetEmailText,
} from "./email-templates";

const sample = {
  appName: "Tesla Scan",
  resetUrl: "https://example.com/reset-password?token=abc123",
  expiresInMinutes: 60,
  recipientName: "Alex <Admin>",
};

describe("password reset email templates", () => {
  it("builds a clear subject line", () => {
    expect(passwordResetEmailSubject("Tesla Scan")).toBe(
      "Reset your Tesla Scan password",
    );
  });

  it("includes the reset URL and expiry in plain text", () => {
    const text = passwordResetEmailText(sample);
    expect(text).toContain("Hi Alex <Admin>,");
    expect(text).toContain(sample.resetUrl);
    expect(text).toContain("60 minutes");
    expect(text).toContain("ignore this email");
  });

  it("escapes HTML in the rich template and embeds the CTA", () => {
    const html = passwordResetEmailHtml(sample);
    expect(html).toContain("Hi Alex &lt;Admin&gt;,");
    expect(html).not.toContain("Hi Alex <Admin>,");
    expect(html).toContain(`href="${sample.resetUrl}"`);
    expect(html).toContain("Reset password");
    expect(html).toContain("60 minutes");
  });

  it("falls back to a generic greeting without a name", () => {
    const text = passwordResetEmailText({ ...sample, recipientName: null });
    expect(text.startsWith("Hi,")).toBe(true);
  });
});
