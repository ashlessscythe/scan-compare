import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireActiveOperator, activeSiteId, jsonError } from "@/lib/api-auth";
import {
  acquireLock,
  getShipmentByNumber,
  ShipmentLockError,
} from "@/lib/shipment-lock";

const createSchema = z.object({
  shipmentNumber: z.number().int().positive(),
  totalPallets: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const user = await requireActiveOperator();
  if (user instanceof Response) return user;

  const siteId = activeSiteId(user);
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { shipmentNumber, totalPallets } = parsed.data;

  try {
    const shipment = await getShipmentByNumber(siteId, shipmentNumber);

    if (shipment) {
      return Response.json(
        {
          error: `Shipment ${shipmentNumber} already exists`,
          status: shipment.status,
        },
        { status: 409 },
      );
    }

    const created = await prisma.shipment.create({
      data: {
        shipmentNumber,
        totalPallets,
        createdByUserId: user.id,
        siteId,
      },
    });

    const locked = await acquireLock(created.id, user.id);
    const full = await getShipmentByNumber(siteId, shipmentNumber);

    return Response.json({
      shipment: full ?? locked,
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

export async function GET(request: NextRequest) {
  const user = await requireActiveOperator();
  if (user instanceof Response) return user;

  const siteId = activeSiteId(user);
  const shipmentNumber = Number(request.nextUrl.searchParams.get("shipmentNumber"));
  if (!shipmentNumber) {
    return jsonError("shipmentNumber is required", 400);
  }

  const shipment = await getShipmentByNumber(siteId, shipmentNumber);
  if (!shipment) {
    return Response.json({ shipment: null, status: "none" });
  }

  return Response.json({ shipment, status: shipment.status });
}
