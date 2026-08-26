import { requireActiveOperator, activeSiteId, jsonError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  findShipmentByNumber,
  requireLockOwner,
  ShipmentLockError,
} from "@/lib/shipment-lock";

type RouteParams = { params: Promise<{ id: string }> };

/** Abandon an in-progress shipment: delete it and all scans (lock holder only). */
export async function POST(_request: Request, { params }: RouteParams) {
  const user = await requireActiveOperator();
  if (user instanceof Response) return user;

  const { id } = await params;
  const shipmentNumber = Number(id);
  if (!shipmentNumber) return jsonError("Invalid shipment number", 400);

  const shipment = await findShipmentByNumber(activeSiteId(user), shipmentNumber);
  if (!shipment) return jsonError("Shipment not found", 404);

  if (shipment.status === "COMPLETE") {
    return jsonError("Completed shipments cannot be abandoned; use admin reset to re-do", 400);
  }

  try {
    await requireLockOwner(shipment.id, user.id);
    await prisma.shipment.delete({ where: { id: shipment.id } });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof ShipmentLockError) {
      return jsonError(error.message, error.status);
    }
    throw error;
  }
}
