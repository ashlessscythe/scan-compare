import { requireActiveOperator, activeSiteId, jsonError } from "@/lib/api-auth";
import { extendLock, findShipmentByNumber, ShipmentLockError } from "@/lib/shipment-lock";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: RouteParams) {
  const user = await requireActiveOperator();
  if (user instanceof Response) return user;

  const { id } = await params;
  const shipmentNumber = Number(id);

  const shipment = await findShipmentByNumber(activeSiteId(user), shipmentNumber);
  if (!shipment) return jsonError("Shipment not found", 404);

  try {
    const updated = await extendLock(shipment.id, user.id);
    return Response.json({ shipment: updated });
  } catch (error) {
    if (error instanceof ShipmentLockError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
