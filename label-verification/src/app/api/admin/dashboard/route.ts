import { requireSiteAdmin, activeSiteId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireSiteAdmin();
  if (user instanceof Response) return user;

  const siteId = activeSiteId(user);

  const [lockedShipments, activeShipments, recentScans, userCount] = await Promise.all([
    prisma.shipment.findMany({
      where: { siteId, lockedByUserId: { not: null }, status: "IN_PROGRESS" },
      include: { lockedBy: { select: { id: true, email: true, name: true } } },
      orderBy: { lockedAt: "desc" },
    }),
    prisma.shipment.count({ where: { siteId, status: "IN_PROGRESS" } }),
    prisma.scan.findMany({
      where: { shipment: { siteId } },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        shipment: { select: { shipmentNumber: true } },
      },
    }),
    prisma.user.count({ where: { siteId } }),
  ]);

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
