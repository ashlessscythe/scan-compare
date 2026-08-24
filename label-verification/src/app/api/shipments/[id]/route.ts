import { requireAuth, jsonError } from "@/lib/api-auth";
import { getShipmentByNumber } from "@/lib/shipment-lock";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await requireAuth();
  if (user instanceof Response) return user;

  const { id } = await params;
  const shipmentNumber = Number(id);
  if (!shipmentNumber) return jsonError("Invalid shipment number", 400);

  const shipment = await getShipmentByNumber(shipmentNumber);
  if (!shipment) return jsonError("Shipment not found", 404);

  return Response.json({ shipment });
}
