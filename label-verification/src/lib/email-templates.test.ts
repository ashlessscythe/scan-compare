import { describe, expect, it } from "vitest";
import {
  passwordResetEmailHtml,
  passwordResetEmailSubject,
  passwordResetEmailText,
  welcomeEmailHtml,
  welcomeEmailSubject,
  welcomeEmailText,
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

const welcomeSample = {
  appName: "Tesla Scan",
  siteName: "Plant A <West>",
  loginUrl: "https://example.com/register?mode=login",
  recipientName: "Jordan",
};

describe("welcome email templates", () => {
  it("builds a clear subject line", () => {
    expect(welcomeEmailSubject("Tesla Scan")).toBe(
      "Your Tesla Scan account has been approved",
    );
  });

  it("includes site name and login URL in plain text", () => {
    const text = welcomeEmailText(welcomeSample);
    expect(text).toContain("Hi Jordan,");
    expect(text).toContain("approved for Plant A <West>");
    expect(text).toContain(welcomeSample.loginUrl);
    expect(text).toContain("Sign in to get started");
    expect(text).not.toContain("log out");
  });

  it("escapes HTML in the rich template and embeds the CTA", () => {
    const html = welcomeEmailHtml(welcomeSample);
    expect(html).toContain("Plant A &lt;West&gt;");
    expect(html).not.toContain("Plant A <West>");
    expect(html).toContain(`href="${welcomeSample.loginUrl}"`);
    expect(html).toContain("Sign in to get started");
  });

  it("falls back to a generic greeting without a name", () => {
    const text = welcomeEmailText({ ...welcomeSample, recipientName: null });
    expect(text.startsWith("Hi,")).toBe(true);
  });
});
