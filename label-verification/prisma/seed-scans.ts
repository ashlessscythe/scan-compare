import { PrismaClient, ShipmentStatus } from "@prisma/client";
import { buildPalletScan } from "../src/lib/barcode-generate";

export const DEMO_SHIPMENT_NUMBERS = [
  12345670, 12345671, 12345672, 12345673, 12345674,
  12345675, 12345676, 12345677, 12345678, 12345679,
] as const;

const DEMO_SHIPMENTS: Array<{
  shipmentNumber: number;
  totalPallets: number;
  siteSlug: "default" | "warehouse-b";
}> = [
  { shipmentNumber: 12345670, totalPallets: 2, siteSlug: "default" },
  { shipmentNumber: 12345671, totalPallets: 3, siteSlug: "default" },
  { shipmentNumber: 12345672, totalPallets: 5, siteSlug: "default" },
  { shipmentNumber: 12345673, totalPallets: 7, siteSlug: "default" },
  { shipmentNumber: 12345674, totalPallets: 8, siteSlug: "default" },
  { shipmentNumber: 12345675, totalPallets: 10, siteSlug: "warehouse-b" },
  { shipmentNumber: 12345676, totalPallets: 12, siteSlug: "warehouse-b" },
  { shipmentNumber: 12345677, totalPallets: 15, siteSlug: "default" },
  { shipmentNumber: 12345678, totalPallets: 20, siteSlug: "warehouse-b" },
  { shipmentNumber: 12345679, totalPallets: 25, siteSlug: "default" },
];

const REFERENCE_SHIPMENT = 12345679;

type SeedScansContext = {
  defaultSiteId: string;
  warehouseBSiteId: string;
  operatorsBySite: Record<string, string[]>;
  createdByUserId: string;
};

function palletSeed(shipmentNumber: number, palletIndex: number): number {
  return shipmentNumber * 100 + palletIndex;
}

function scanTimestamp(shipmentIndex: number, palletIndex: number, totalPallets: number): Date {
  const base = new Date();
  base.setDate(base.getDate() - (DEMO_SHIPMENTS.length - shipmentIndex));
  base.setHours(8, 0, 0, 0);

  const minutesPerPallet = 4;
  const offsetMinutes = (palletIndex - 1) * minutesPerPallet;
  base.setMinutes(base.getMinutes() + offsetMinutes);

  // Spread completion across the day for larger shipments
  if (totalPallets > 10) {
    base.setMinutes(base.getMinutes() + Math.floor(palletIndex / 3));
  }

  return base;
}

export async function seedDemoShipments(
  prisma: PrismaClient,
  ctx: SeedScansContext,
): Promise<{ shipmentCount: number; scanCount: number; totalPallets: number }> {
  const siteIds = [ctx.defaultSiteId, ctx.warehouseBSiteId];

  // Remove existing demo shipments (idempotent refresh)
  await prisma.scan.deleteMany({
    where: {
      shipment: {
        shipmentNumber: { in: [...DEMO_SHIPMENT_NUMBERS] },
        siteId: { in: siteIds },
      },
    },
  });
  await prisma.shipment.deleteMany({
    where: {
      shipmentNumber: { in: [...DEMO_SHIPMENT_NUMBERS] },
      siteId: { in: siteIds },
    },
  });

  let scanCount = 0;
  let totalPallets = 0;

  for (let shipmentIndex = 0; shipmentIndex < DEMO_SHIPMENTS.length; shipmentIndex++) {
    const config = DEMO_SHIPMENTS[shipmentIndex];
    const siteId =
      config.siteSlug === "default" ? ctx.defaultSiteId : ctx.warehouseBSiteId;
    const operatorIds = ctx.operatorsBySite[siteId] ?? [ctx.createdByUserId];

    const startedAt = scanTimestamp(shipmentIndex, 1, config.totalPallets);
    const completedAt = scanTimestamp(shipmentIndex, config.totalPallets, config.totalPallets);
    completedAt.setMinutes(completedAt.getMinutes() + 5);

    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber: config.shipmentNumber,
        totalPallets: config.totalPallets,
        scannedPallets: config.totalPallets,
        status: ShipmentStatus.COMPLETE,
        siteId,
        createdByUserId: ctx.createdByUserId,
        createdAt: startedAt,
        completedAt,
      },
    });

    totalPallets += config.totalPallets;

    for (let palletIndex = 1; palletIndex <= config.totalPallets; palletIndex++) {
      const seed = palletSeed(config.shipmentNumber, palletIndex);
      const useReference =
        config.shipmentNumber === REFERENCE_SHIPMENT && palletIndex <= 2
          ? ((palletIndex - 1) as 0 | 1)
          : undefined;

      const scanData = buildPalletScan(seed, { useReference });
      const operatorId = operatorIds[(palletIndex - 1) % operatorIds.length];

      await prisma.scan.create({
        data: {
          shipmentId: shipment.id,
          palletIndex,
          qrOrig: scanData.qrOrig,
          qrNew: scanData.qrNew,
          pnOrig: scanData.pnOrig,
          pnNew: scanData.pnNew,
          scan1: scanData.scan1,
          scan2: scanData.scan2,
          scan3: scanData.scan3,
          scan4: scanData.scan4,
          result: scanData.result,
          userId: operatorId,
          createdAt: scanTimestamp(shipmentIndex, palletIndex, config.totalPallets),
        },
      });
      scanCount++;
    }
  }

  return {
    shipmentCount: DEMO_SHIPMENTS.length,
    scanCount,
    totalPallets,
  };
}
