import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireActiveOperator, activeSiteId, jsonError } from "@/lib/api-auth";
import {
  extendLock,
  findShipmentByNumber,
  requireLockOwner,
  shipmentInclude,
  ShipmentLockError,
} from "@/lib/shipment-lock";
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

function largeLabelDuplicateWhere(codes: string[]) {
  return {
    OR: [
      { scan1: { in: codes } },
      { scan2: { in: codes } },
      { scan3: { in: codes } },
      { scan4: { in: codes } },
    ],
  };
}

export async function POST(request: NextRequest) {
  const user = await requireActiveOperator();
  if (user instanceof Response) return user;

  const siteId = activeSiteId(user);
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

  try {
    const shipment = await findShipmentByNumber(siteId, data.shipmentNumber);
    if (!shipment) return jsonError("Shipment not found", 404);
    if (shipment.status === "COMPLETE") return jsonError("Shipment already complete", 400);

    await requireLockOwner(shipment.id, user.id);

    const duplicate = await prisma.scan.findFirst({
      where: {
        OR: [{ qrOrig }, { qrNew }],
        shipment: { siteId },
      },
    });
    if (duplicate && !data.userUnblock) {
      return jsonError("Scan already in database", 409);
    }

    const duplicateLabels = await prisma.scan.findFirst({
      where: {
        ...largeLabelDuplicateWhere(scans),
        shipment: { siteId },
      },
      include: {
        shipment: { select: { shipmentNumber: true, status: true } },
      },
    });
    if (duplicateLabels) {
      const sn = duplicateLabels.shipment.shipmentNumber;
      const status = duplicateLabels.shipment.status;
      return jsonError(
        status === "COMPLETE"
          ? `These labels were already saved on shipment ${sn}`
          : `These labels were already scanned on shipment ${sn} (pallet ${duplicateLabels.palletIndex})`,
        400,
      );
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
        include: shipmentInclude,
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
        await extendLock(shipment.id, user.id, tx);
      }

      return { scan, shipment: updatedShipment };
    });

    const finalShipment = await prisma.shipment.findUnique({
      where: { id: shipment.id },
      include: shipmentInclude,
    });

    return Response.json({
      scan: result.scan,
      shipment: finalShipment,
      complete: (finalShipment?.scannedPallets ?? 0) >= (finalShipment?.totalPallets ?? 0),
    });
  } catch (error) {
    if (error instanceof ShipmentLockError) {
      return jsonError(error.message, error.status);
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const user = await requireActiveOperator();
  if (user instanceof Response) return user;

  const siteId = activeSiteId(user);
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return jsonError("code is required", 400);

  const normalized = normalizeScanInput(code);
  const duplicate = await prisma.scan.findFirst({
    where: {
      shipment: { siteId },
      OR: [
        { qrOrig: normalized },
        { qrNew: normalized },
        { scan1: normalized },
        { scan2: normalized },
        { scan3: normalized },
        { scan4: normalized },
      ],
    },
    include: {
      shipment: { select: { shipmentNumber: true, status: true } },
    },
  });

  if (!duplicate) {
    return Response.json({ exists: false });
  }

  const isLargeLabel =
    duplicate.scan1 === normalized ||
    duplicate.scan2 === normalized ||
    duplicate.scan3 === normalized ||
    duplicate.scan4 === normalized;

  return Response.json({
    exists: true,
    kind: isLargeLabel ? "large" : "small",
    shipmentNumber: duplicate.shipment.shipmentNumber,
    shipmentStatus: duplicate.shipment.status,
    palletIndex: duplicate.palletIndex,
  });
}
