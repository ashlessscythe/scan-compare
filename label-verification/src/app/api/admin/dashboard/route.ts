import { requireSiteAdmin, activeSiteId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireSiteAdmin();
  if (user instanceof Response) return user;

  const siteId = activeSiteId(user);

  const [lockedShipments, activeShipments, recentScanRows, userCount] = await Promise.all([
    prisma.shipment.findMany({
      where: { siteId, lockedByUserId: { not: null }, status: "IN_PROGRESS" },
      include: { lockedBy: { select: { id: true, email: true, name: true } } },
      orderBy: { lockedAt: "desc" },
    }),
    prisma.shipment.count({ where: { siteId, status: "IN_PROGRESS" } }),
    // Fetch recent pallet scans, then collapse to one row per shipment.
    prisma.scan.findMany({
      where: { shipment: { siteId } },
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        shipment: {
          select: {
            id: true,
            shipmentNumber: true,
            totalPallets: true,
            scannedPallets: true,
            status: true,
          },
        },
      },
    }),
    prisma.user.count({ where: { siteId } }),
  ]);

  const seenShipmentIds = new Set<string>();
  const recentScans: Array<{
    id: string;
    shipmentNumber: number;
    scannedPallets: number;
    totalPallets: number;
    status: string;
    createdAt: string;
    user: { email: string; name: string | null };
  }> = [];

  for (const row of recentScanRows) {
    if (seenShipmentIds.has(row.shipment.id)) continue;
    seenShipmentIds.add(row.shipment.id);
    recentScans.push({
      id: row.shipment.id,
      shipmentNumber: row.shipment.shipmentNumber,
      scannedPallets: row.shipment.scannedPallets,
      totalPallets: row.shipment.totalPallets,
      status: row.shipment.status,
      createdAt: row.createdAt.toISOString(),
      user: row.user,
    });
    if (recentScans.length >= 10) break;
  }

  return Response.json({
    lockedShipments,
    stats: {
      activeShipments,
      lockedCount: lockedShipments.length,
      userCount,
    },
    recentScans,
  });
}
