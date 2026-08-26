/**
 * Email templates for transactional mail (plain text + HTML).
 * Kept as string builders so we don't add a React Email dependency.
 */

export type PasswordResetEmailInput = {
  appName: string;
  resetUrl: string;
  expiresInMinutes: number;
  recipientName?: string | null;
};

export function passwordResetEmailSubject(appName: string): string {
  return `Reset your ${appName} password`;
}

export function passwordResetEmailText(input: PasswordResetEmailInput): string {
  const greeting = input.recipientName?.trim()
    ? `Hi ${input.recipientName.trim()},`
    : "Hi,";

  return [
    greeting,
    "",
    `We received a request to reset your ${input.appName} password.`,
    "",
    `Open this link to choose a new password (expires in ${input.expiresInMinutes} minutes):`,
    input.resetUrl,
    "",
    "If you did not request a password reset, you can ignore this email. Your password will stay the same.",
    "",
    `— ${input.appName}`,
  ].join("\n");
}

export function passwordResetEmailHtml(input: PasswordResetEmailInput): string {
  const greeting = input.recipientName?.trim()
    ? `Hi ${escapeHtml(input.recipientName.trim())},`
    : "Hi,";
  const appName = escapeHtml(input.appName);
  const resetUrl = escapeHtml(input.resetUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:28px 28px 8px;font-size:20px;font-weight:600;letter-spacing:-0.02em;">
              ${appName}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;font-size:16px;line-height:1.5;">
              ${greeting}
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 0;font-size:15px;line-height:1.6;color:#3f3f46;">
              We received a request to reset your password. Use the button below to choose a new one. This link expires in <strong>${input.expiresInMinutes} minutes</strong>.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px;">
              <a href="${resetUrl}" style="display:inline-block;background:#18181b;color:#fafafa;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:8px;">
                Reset password
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 8px;font-size:13px;line-height:1.5;color:#71717a;">
              Or copy and paste this link into your browser:
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font-size:12px;line-height:1.5;word-break:break-all;color:#52525b;">
              <a href="${resetUrl}" style="color:#2563eb;">${resetUrl}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;font-size:13px;line-height:1.5;color:#71717a;border-top:1px solid #f4f4f5;">
              <p style="margin:20px 0 0;">If you did not request a password reset, you can ignore this email. Your password will stay the same.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
