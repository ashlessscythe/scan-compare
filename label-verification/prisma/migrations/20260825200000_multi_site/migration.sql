-- Create Site table
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");

-- Seed default site (fixed id for backfill)
INSERT INTO "Site" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('default_site_seed', 'Default', 'default', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Rebuild Role enum: OPERATOR stays, ADMIN -> SUPERADMIN, add PENDING / SITE_ADMIN / SUPERADMIN
CREATE TYPE "Role_new" AS ENUM ('PENDING', 'OPERATOR', 'SITE_ADMIN', 'SUPERADMIN');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role_new"
  USING (
    CASE
      WHEN "role"::text = 'ADMIN' THEN 'SUPERADMIN'::"Role_new"
      WHEN "role"::text = 'OPERATOR' THEN 'OPERATOR'::"Role_new"
      ELSE 'OPERATOR'::"Role_new"
    END
  );
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OPERATOR'::"Role";

-- Add siteId to User
ALTER TABLE "User" ADD COLUMN "siteId" TEXT;
UPDATE "User" SET "siteId" = 'default_site_seed' WHERE "siteId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "siteId" SET NOT NULL;
CREATE INDEX "User_siteId_idx" ON "User"("siteId");
ALTER TABLE "User" ADD CONSTRAINT "User_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add siteId to Shipment and change uniqueness
ALTER TABLE "Shipment" ADD COLUMN "siteId" TEXT;
UPDATE "Shipment" SET "siteId" = 'default_site_seed' WHERE "siteId" IS NULL;
ALTER TABLE "Shipment" ALTER COLUMN "siteId" SET NOT NULL;
DROP INDEX IF EXISTS "Shipment_shipmentNumber_key";
CREATE UNIQUE INDEX "Shipment_siteId_shipmentNumber_key" ON "Shipment"("siteId", "shipmentNumber");
CREATE INDEX "Shipment_siteId_idx" ON "Shipment"("siteId");
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate AppSettings from singleton to per-site
ALTER TABLE "AppSettings" ADD COLUMN "siteId" TEXT;

UPDATE "AppSettings"
SET "siteId" = 'default_site_seed'
WHERE "id" = 'singleton' OR "siteId" IS NULL;

-- Ensure a settings row exists for the default site (bcrypt of 3333)
INSERT INTO "AppSettings" ("id", "siteId", "adminPinHash", "emailFromName", "emailFromAddress", "emailCcList", "lockTimeoutMinutes", "updatedAt")
SELECT
  'default_settings_seed',
  'default_site_seed',
  '$2b$12$TNPhthVr6r.s//Y1HzWPQOo9n5w3BO9Z0dBas5GEjuW1lq37msrGG',
  'Tesla Scan',
  'no-reply@example.com',
  ARRAY[]::TEXT[],
  30,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "AppSettings" WHERE "siteId" = 'default_site_seed');

ALTER TABLE "AppSettings" ALTER COLUMN "siteId" SET NOT NULL;
CREATE UNIQUE INDEX "AppSettings_siteId_key" ON "AppSettings"("siteId");
ALTER TABLE "AppSettings" ADD CONSTRAINT "AppSettings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
