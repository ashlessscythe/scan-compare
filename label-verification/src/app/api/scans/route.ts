import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError } from "@/lib/api-auth";
import { extendLock, requireLockOwner } from "@/lib/shipment-lock";
import {
  validateLargeQrScans,
  validateSmallQrPair,
  extractPartNumber,
  normalizeScanInput,
} from "@/lib/barcode";

const scanSchema = z.object({
  shipmentNumber: z.number().int().positive(),
  qrOrig: z.string().min(1),
  qrNew: z.string().min(1),
  scan1: z.string().min(1),
  scan2: z.string().min(1),
  scan3: z.string().min(1),
  scan4: z.string().min(1),
  userUnblock: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (user instanceof Response) return user;

  const body = await request.json();
  const parsed = scanSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const data = parsed.data;
  const qrOrig = normalizeScanInput(data.qrOrig);
  const qrNew = normalizeScanInput(data.qrNew);
  const scans = [
    normalizeScanInput(data.scan1),
    normalizeScanInput(data.scan2),
    normalizeScanInput(data.scan3),
    normalizeScanInput(data.scan4),
  ] as [string, string, string, string];

  const smallResult = validateSmallQrPair(qrOrig, qrNew);
  if (!smallResult.valid) {
    return jsonError(smallResult.message, 400);
  }

  const largeResult = validateLargeQrScans(scans);
  if (!largeResult.valid) {
    return jsonError(largeResult.message, 400);
  }

  const shipment = await prisma.shipment.findUnique({
    where: { shipmentNumber: data.shipmentNumber },
  });
  if (!shipment) return jsonError("Shipment not found", 404);
  if (shipment.status === "COMPLETE") return jsonError("Shipment already complete", 400);

  await requireLockOwner(shipment.id, user.id);

  const duplicate = await prisma.scan.findFirst({
    where: { OR: [{ qrOrig }, { qrNew }] },
  });
  if (duplicate && !data.userUnblock) {
    return jsonError("Scan already in database", 409);
  }

  const pnOrig = extractPartNumber(qrOrig)!;
  const pnNew = extractPartNumber(qrNew)!;
  const palletIndex = shipment.scannedPallets + 1;

  const result = await prisma.$transaction(async (tx) => {
    const scan = await tx.scan.create({
      data: {
        shipmentId: shipment.id,
        palletIndex,
        qrOrig,
        qrNew,
        pnOrig,
        pnNew,
        scan1: scans[0],
        scan2: scans[1],
        scan3: scans[2],
        scan4: scans[3],
        result: largeResult.message,
        userId: user.id,
        userUnblock: data.userUnblock,
      },
    });

    const updatedShipment = await tx.shipment.update({
      where: { id: shipment.id },
      data: { scannedPallets: { increment: 1 } },
      include: {
        scans: { orderBy: { palletIndex: "asc" } },
        lockedBy: { select: { id: true, email: true, name: true } },
      },
    });

    if (updatedShipment.scannedPallets >= updatedShipment.totalPallets) {
      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: "COMPLETE",
          completedAt: new Date(),
          lockedByUserId: null,
          lockedAt: null,
          lockExpiresAt: null,
        },
      });
    } else {
      await extendLock(shipment.id, user.id);
    }

    return { scan, shipment: updatedShipment };
  });

  const finalShipment = await prisma.shipment.findUnique({
    where: { id: shipment.id },
    include: {
      scans: { orderBy: { palletIndex: "asc" } },
      lockedBy: { select: { id: true, email: true, name: true } },
    },
  });

  return Response.json({
    scan: result.scan,
    shipment: finalShipment,
    complete: (finalShipment?.scannedPallets ?? 0) >= (finalShipment?.totalPallets ?? 0),
  });
}

export async function GET(request: NextRequest) {
  const user = await requireAuth();
  if (user instanceof Response) return user;

  const code = request.nextUrl.searchParams.get("code");
  if (!code) return jsonError("code is required", 400);

  const normalized = normalizeScanInput(code);
  const duplicate = await prisma.scan.findFirst({
    where: { OR: [{ qrOrig: normalized }, { qrNew: normalized }] },
  });

  return Response.json({ exists: !!duplicate });
}
