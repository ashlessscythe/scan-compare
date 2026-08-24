import { requireAdmin, jsonError } from "@/lib/api-auth";
import { releaseLock } from "@/lib/shipment-lock";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ shipmentId: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await requireAdmin();
  if (user instanceof Response) return user;

  const { shipmentId } = await params;
  const shipmentNumber = Number(shipmentId);

  const shipment = await prisma.shipment.findUnique({ where: { shipmentNumber } });
  if (!shipment) return jsonError("Shipment not found", 404);

  const updated = await releaseLock(shipment.id, user.id, { force: true, isAdmin: true });
  return Response.json({ shipment: updated });
}
