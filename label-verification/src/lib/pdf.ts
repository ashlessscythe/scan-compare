import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { VerificationReportDocument, type ReportData } from "@/lib/pdf-document";

export async function generateReportPdf(data: ReportData): Promise<Buffer> {
  const buffer = await renderToBuffer(
    React.createElement(VerificationReportDocument, { data }) as React.ReactElement<DocumentProps>,
  );
  return Buffer.from(buffer);
}
