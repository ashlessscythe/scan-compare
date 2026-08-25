import { requireActiveOperator, activeSiteId, jsonError } from "@/lib/api-auth";
import { findShipmentByNumber } from "@/lib/shipment-lock";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: RouteParams) {
  const user = await requireActiveOperator();
  if (user instanceof Response) return user;

  const { id } = await params;
  const shipmentNumber = Number(id);

  const shipment = await findShipmentByNumber(activeSiteId(user), shipmentNumber);
  if (!shipment) return jsonError("Shipment not found", 404);

  if (shipment.lockedByUserId && shipment.lockedByUserId !== user.id) {
    return jsonError("You do not hold the lock for this shipment", 403);
  }

  const updated = await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      status: "COMPLETE",
      completedAt: new Date(),
      lockedByUserId: null,
      lockedAt: null,
      lockExpiresAt: null,
    },
    include: {
      scans: { orderBy: { palletIndex: "asc" } },
      lockedBy: { select: { id: true, email: true, name: true } },
    },
  });

  return Response.json({ shipment: updated });
}
