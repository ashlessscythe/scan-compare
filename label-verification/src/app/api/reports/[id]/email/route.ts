import { requireActiveOperator, activeSiteId, jsonError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { sendReportEmail } from "@/lib/email";
import type { ReportData } from "@/lib/pdf-document";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const user = await requireActiveOperator();
  if (user instanceof Response) return user;

  const siteId = activeSiteId(user);
  const { id } = await params;
  const shipmentNumber = Number(id);

  const shipment = await prisma.shipment.findUnique({
    where: { siteId_shipmentNumber: { siteId, shipmentNumber } },
    include: {
      scans: {
        orderBy: { palletIndex: "asc" },
        include: { user: { select: { email: true } } },
      },
    },
  });

  if (!shipment) return jsonError("Shipment not found", 404);

  const data: ReportData = {
    shipmentNumber: shipment.shipmentNumber,
    totalPallets: shipment.totalPallets,
    scannedPallets: shipment.scannedPallets,
    scans: shipment.scans.map((s) => ({
      palletIndex: s.palletIndex,
      pnOrig: s.pnOrig,
      pnNew: s.pnNew,
      result: s.result,
      createdAt: s.createdAt.toISOString(),
      userEmail: s.user.email,
    })),
  };

  try {
    await sendReportEmail(data, user.email, siteId);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return jsonError(message, 500);
  }
}
