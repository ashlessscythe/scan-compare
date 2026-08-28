import { requireActiveOperator, activeSiteId, jsonError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateReportPdf } from "@/lib/pdf";
import type { ReportData } from "@/lib/pdf-document";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

async function getReportData(siteId: string, shipmentNumber: number): Promise<ReportData | null> {
  const shipment = await prisma.shipment.findUnique({
    where: { siteId_shipmentNumber: { siteId, shipmentNumber } },
    include: {
      scans: {
        orderBy: { palletIndex: "asc" },
        include: { user: { select: { email: true } } },
      },
    },
  });

  if (!shipment) return null;

  return {
    shipmentNumber: shipment.shipmentNumber,
    totalPallets: shipment.totalPallets,
    scannedPallets: shipment.scannedPallets,
    scans: shipment.scans.map((s) => ({
      palletIndex: s.palletIndex,
      pnOrig: s.pnOrig,
      pnNew: s.pnNew,
      qrOrig: s.qrOrig,
      qrNew: s.qrNew,
      result: s.result,
      createdAt: s.createdAt.toISOString(),
      userEmail: s.user.email,
    })),
  };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await requireActiveOperator();
  if (user instanceof Response) return user;

  const { id } = await params;
  const shipmentNumber = Number(id);
  const data = await getReportData(activeSiteId(user), shipmentNumber);
  if (!data) return jsonError("Shipment not found", 404);

  const pdf = await generateReportPdf(data);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="shipment_${shipmentNumber}_report.pdf"`,
    },
  });
}
