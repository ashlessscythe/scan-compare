-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OPERATOR', 'ADMIN');
CREATE TYPE "ShipmentStatus" AS ENUM ('IN_PROGRESS', 'COMPLETE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shipmentNumber" INTEGER NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalPallets" INTEGER NOT NULL,
    "scannedPallets" INTEGER NOT NULL DEFAULT 0,
    "lockedByUserId" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "palletIndex" INTEGER NOT NULL,
    "qrOrig" TEXT NOT NULL,
    "qrNew" TEXT NOT NULL,
    "pnOrig" TEXT NOT NULL,
    "pnNew" TEXT NOT NULL,
    "scan1" TEXT NOT NULL,
    "scan2" TEXT NOT NULL,
    "scan3" TEXT NOT NULL,
    "scan4" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userUnblock" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "adminPinHash" TEXT NOT NULL,
    "emailFromName" TEXT NOT NULL DEFAULT 'Tesla Scan',
    "emailFromAddress" TEXT NOT NULL DEFAULT 'no-reply@example.com',
    "emailCcList" TEXT[],
    "lockTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");
CREATE INDEX "Scan_qrOrig_idx" ON "Scan"("qrOrig");
CREATE INDEX "Scan_qrNew_idx" ON "Scan"("qrNew");
CREATE INDEX "Scan_shipmentId_idx" ON "Scan"("shipmentId");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_lockedByUserId_fkey" FOREIGN KEY ("lockedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
