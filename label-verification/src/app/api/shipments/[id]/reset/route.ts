import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/api-auth";
import {
  acquireLock,
  getShipmentByNumber,
  ShipmentLockError,
} from "@/lib/shipment-lock";

type RouteParams = { params: Promise<{ id: string }> };

const resetSchema = z.object({
  totalPallets: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await requireAdmin();
  if (user instanceof Response) return user;

  const { id } = await params;
  const shipmentNumber = Number(id);
  if (!shipmentNumber) return jsonError("Invalid shipment number", 400);

  const body = await request.json().catch(() => ({}));
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const shipment = await prisma.shipment.findUnique({ where: { shipmentNumber } });
  if (!shipment) return jsonError("Shipment not found", 404);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.scan.deleteMany({ where: { shipmentId: shipment.id } });
      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: "IN_PROGRESS",
          scannedPallets: 0,
          completedAt: null,
          ...(parsed.data.totalPallets != null
            ? { totalPallets: parsed.data.totalPallets }
            : {}),
          lockedByUserId: null,
          lockedAt: null,
          lockExpiresAt: null,
        },
      });
    });

    await acquireLock(shipment.id, user.id);
    const full = await getShipmentByNumber(shipmentNumber);

    return Response.json({
      shipment: full,
      mode: "start" as const,
    });
  } catch (error) {
    if (error instanceof ShipmentLockError) {
      return Response.json(
        { error: error.message, lockedBy: error.lockedBy },
        { status: error.status },
      );
    }
    throw error;
  }
}
