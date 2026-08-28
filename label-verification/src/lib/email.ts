import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { generateReportPdf } from "@/lib/pdf";
import type { ReportData } from "@/lib/pdf-document";
import {
  passwordResetEmailHtml,
  passwordResetEmailSubject,
  passwordResetEmailText,
  welcomeEmailHtml,
  welcomeEmailSubject,
  welcomeEmailText,
} from "@/lib/email-templates";
import { buildLoginUrl } from "@/lib/app-url";
import { PASSWORD_RESET_TOKEN_TTL_MS } from "@/lib/password-reset";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
}

async function resolveFromAddress(siteId: string): Promise<string> {
  const settings = await prisma.appSettings.findUnique({ where: { siteId } });
  if (!settings) {
    throw new Error("App settings not configured");
  }
  return `${settings.emailFromName} <${settings.emailFromAddress}>`;
}

function appDisplayName(): string {
  return process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Scan Compare";
}

export async function sendReportEmail(data: ReportData, toEmail: string, siteId: string) {
  const settings = await prisma.appSettings.findUnique({ where: { siteId } });
  if (!settings) throw new Error("App settings not configured");

  const pdfBuffer = await generateReportPdf(data);
  const subject = `Tesla Scan Shipment ${data.shipmentNumber} Complete`;
  const text = `Attached verification for Tesla Scan: Shipment ${data.shipmentNumber} for ${data.totalPallets} pallets.`;

  const resend = getResendClient();
  const from = `${settings.emailFromName} <${settings.emailFromAddress}>`;

  await resend.emails.send({
    from,
    to: [toEmail],
    cc: settings.emailCcList.length > 0 ? settings.emailCcList : undefined,
    subject,
    text,
    attachments: [
      {
        filename: `shipment_${data.shipmentNumber}_report.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}

export async function sendPasswordResetEmail(options: {
  toEmail: string;
  siteId: string;
  resetUrl: string;
  recipientName?: string | null;
}) {
  const appName = appDisplayName();
  const expiresInMinutes = Math.round(PASSWORD_RESET_TOKEN_TTL_MS / 60_000);
  const templateInput = {
    appName,
    resetUrl: options.resetUrl,
    expiresInMinutes,
    recipientName: options.recipientName,
  };

  const resend = getResendClient();
  const from = await resolveFromAddress(options.siteId);

  await resend.emails.send({
    from,
    to: [options.toEmail],
    subject: passwordResetEmailSubject(appName),
    text: passwordResetEmailText(templateInput),
    html: passwordResetEmailHtml(templateInput),
  });
}

export async function sendWelcomeEmail(options: {
  toEmail: string;
  siteId: string;
  siteName: string;
  recipientName?: string | null;
}) {
  const appName = appDisplayName();
  const templateInput = {
    appName,
    siteName: options.siteName,
    loginUrl: buildLoginUrl(),
    recipientName: options.recipientName,
  };

  const resend = getResendClient();
  const from = await resolveFromAddress(options.siteId);

  await resend.emails.send({
    from,
    to: [options.toEmail],
    subject: welcomeEmailSubject(appName),
    text: welcomeEmailText(templateInput),
    html: welcomeEmailHtml(templateInput),
  });
}
