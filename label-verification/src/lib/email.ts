import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { generateReportPdf } from "@/lib/pdf";
import type { ReportData } from "@/lib/pdf-document";

export async function sendReportEmail(data: ReportData, toEmail: string) {
  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) throw new Error("App settings not configured");

  const pdfBuffer = await generateReportPdf(data);
  const subject = `Tesla Scan Shipment ${data.shipmentNumber} Complete`;
  const text = `Attached verification for Tesla Scan: Shipment ${data.shipmentNumber} for ${data.totalPallets} pallets.`;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(apiKey);
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
