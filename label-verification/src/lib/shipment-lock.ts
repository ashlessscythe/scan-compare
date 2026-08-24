import { prisma } from "@/lib/prisma";
import type { Shipment, User } from "@prisma/client";

export class ShipmentLockError extends Error {
  constructor(
    message: string,
    public status: number,
    public lockedBy?: Pick<User, "id" | "email" | "name">,
  ) {
    super(message);
    this.name = "ShipmentLockError";
  }
}

async function getLockTimeoutMinutes(): Promise<number> {
  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  return settings?.lockTimeoutMinutes ?? 30;
}

export async function clearStaleLock(shipment: Shipment): Promise<Shipment> {
  if (
    shipment.lockedByUserId &&
    shipment.lockExpiresAt &&
    shipment.lockExpiresAt < new Date()
  ) {
    return prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        lockedByUserId: null,
        lockedAt: null,
        lockExpiresAt: null,
      },
    });
  }
  return shipment;
}

export async function acquireLock(shipmentId: string, userId: string) {
  const timeoutMinutes = await getLockTimeoutMinutes();
  const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    let shipment = await tx.shipment.findUniqueOrThrow({
      where: { id: shipmentId },
      include: { lockedBy: { select: { id: true, email: true, name: true } } },
    });

    if (shipment.status === "COMPLETE") {
      return shipment;
    }

    if (
      shipment.lockedByUserId &&
      shipment.lockExpiresAt &&
      shipment.lockExpiresAt < new Date()
    ) {
      shipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: { lockedByUserId: null, lockedAt: null, lockExpiresAt: null },
        include: { lockedBy: { select: { id: true, email: true, name: true } } },
      });
    }

    if (shipment.lockedByUserId && shipment.lockedByUserId !== userId) {
      throw new ShipmentLockError(
        `Shipment ${shipment.shipmentNumber} is being scanned by ${shipment.lockedBy?.name ?? shipment.lockedBy?.email ?? "another user"}`,
        409,
        shipment.lockedBy ?? undefined,
      );
    }

    return tx.shipment.update({
      where: { id: shipmentId },
      data: {
        lockedByUserId: userId,
        lockedAt: new Date(),
        lockExpiresAt: expiresAt,
      },
      include: { lockedBy: { select: { id: true, email: true, name: true } } },
    });
  });
}

export async function extendLock(shipmentId: string, userId: string) {
  const timeoutMinutes = await getLockTimeoutMinutes();
  const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

  const shipment = await prisma.shipment.findUniqueOrThrow({
    where: { id: shipmentId },
    include: { lockedBy: { select: { id: true, email: true, name: true } } },
  });

  if (shipment.status === "COMPLETE") {
    return shipment;
  }

  if (shipment.lockedByUserId !== userId) {
    throw new ShipmentLockError(
      "You do not hold the lock for this shipment",
      403,
      shipment.lockedBy ?? undefined,
    );
  }

  return prisma.shipment.update({
    where: { id: shipmentId },
    data: { lockExpiresAt: expiresAt, lockedAt: shipment.lockedAt ?? new Date() },
    include: { lockedBy: { select: { id: true, email: true, name: true } } },
  });
}

export async function releaseLock(
  shipmentId: string,
  userId: string,
  options?: { force?: boolean; isAdmin?: boolean },
) {
  const shipment = await prisma.shipment.findUniqueOrThrow({
    where: { id: shipmentId },
  });

  const canRelease =
    options?.force && options?.isAdmin
      ? true
      : shipment.lockedByUserId === userId || !shipment.lockedByUserId;

  if (!canRelease) {
    throw new ShipmentLockError("You do not hold the lock for this shipment", 403);
  }

  return prisma.shipment.update({
    where: { id: shipmentId },
    data: {
      lockedByUserId: null,
      lockedAt: null,
      lockExpiresAt: null,
    },
  });
}

export async function requireLockOwner(shipmentId: string, userId: string) {
  const current = await prisma.shipment.findUniqueOrThrow({
    where: { id: shipmentId },
  });
  await clearStaleLock(current);

  const shipment = await prisma.shipment.findUniqueOrThrow({
    where: { id: shipmentId },
    include: { lockedBy: { select: { id: true, email: true, name: true } } },
  });

  if (shipment.status === "COMPLETE") {
    return shipment;
  }

  if (shipment.lockedByUserId !== userId) {
    throw new ShipmentLockError(
      shipment.lockedBy
        ? `Shipment is locked by ${shipment.lockedBy.name ?? shipment.lockedBy.email}`
        : "Shipment lock required",
      403,
      shipment.lockedBy ?? undefined,
    );
  }

  return shipment;
}

const shipmentInclude = {
  lockedBy: { select: { id: true, email: true, name: true } },
  scans: {
    orderBy: { palletIndex: "asc" as const },
    include: { user: { select: { email: true, name: true } } },
  },
};

export async function getShipmentByNumber(shipmentNumber: number) {
  const shipment = await prisma.shipment.findUnique({
    where: { shipmentNumber },
    include: shipmentInclude,
  });

  if (!shipment) return null;

  await clearStaleLock(shipment);

  return prisma.shipment.findUnique({
    where: { shipmentNumber },
    include: shipmentInclude,
  });
}
