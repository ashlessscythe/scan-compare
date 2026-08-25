import { requireSiteAdmin, activeSiteId, jsonError } from "@/lib/api-auth";
import { findShipmentByNumber, releaseLock } from "@/lib/shipment-lock";

type RouteParams = { params: Promise<{ shipmentId: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await requireSiteAdmin();
  if (user instanceof Response) return user;

  const { shipmentId } = await params;
  const shipmentNumber = Number(shipmentId);

  const shipment = await findShipmentByNumber(activeSiteId(user), shipmentNumber);
  if (!shipment) return jsonError("Shipment not found", 404);

  const updated = await releaseLock(shipment.id, user.id, { force: true, isAdmin: true });
  return Response.json({ shipment: updated });
}
