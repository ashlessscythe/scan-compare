import { requireAuth, jsonError } from "@/lib/api-auth";
import { releaseLock, ShipmentLockError } from "@/lib/shipment-lock";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await requireAuth();
  if (user instanceof Response) return user;

  const { id } = await params;
  const shipmentNumber = Number(id);

  const shipment = await prisma.shipment.findUnique({ where: { shipmentNumber } });
  if (!shipment) return jsonError("Shipment not found", 404);

  try {
    const updated = await releaseLock(shipment.id, user.id, {
      force: false,
      isAdmin: user.role === "ADMIN",
    });
    return Response.json({ shipment: updated });
  } catch (error) {
    if (error instanceof ShipmentLockError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
