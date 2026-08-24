import { requireAdmin, jsonError } from "@/lib/api-auth";
import { releaseLock } from "@/lib/shipment-lock";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireAdmin();
  if (user instanceof Response) return user;

  const [lockedShipments, activeShipments, recentScans, userCount] = await Promise.all([
    prisma.shipment.findMany({
      where: { lockedByUserId: { not: null }, status: "IN_PROGRESS" },
      include: { lockedBy: { select: { id: true, email: true, name: true } } },
      orderBy: { lockedAt: "desc" },
    }),
    prisma.shipment.count({ where: { status: "IN_PROGRESS" } }),
    prisma.scan.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        shipment: { select: { shipmentNumber: true } },
      },
    }),
    prisma.user.count(),
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
