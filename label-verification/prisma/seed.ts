import dotenv from "dotenv";
dotenv.config({ quiet: true });

import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

// Prefer direct (non-pooled) URL for CLI seed — same as Prisma Migrate.
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL },
  },
});
const clear = process.argv.includes("--clear");

async function clearAll() {
  // FK-safe order: scans → shipments → settings → users → sites
  await prisma.scan.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.appSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.site.deleteMany();
  console.log("Cleared all scans, shipments, settings, users, and sites.");
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const operatorEmail = process.env.SEED_OPERATOR_EMAIL ?? "operator@example.com";
  const operatorPassword = process.env.SEED_OPERATOR_PASSWORD ?? "Operator123!";

  if (clear) {
    await clearAll();
  }

  const adminPinHash = await bcrypt.hash("3333", 12);
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const operatorPasswordHash = await bcrypt.hash(operatorPassword, 12);

  const defaultSite = await prisma.site.upsert({
    where: { slug: "default" },
    update: { name: "Default" },
    create: {
      id: "default_site_seed",
      name: "Default",
      slug: "default",
    },
  });

  // Optional second site for superadmin switcher testing
  await prisma.site.upsert({
    where: { slug: "warehouse-b" },
    update: { name: "Warehouse B" },
    create: {
      name: "Warehouse B",
      slug: "warehouse-b",
    },
  });

  await prisma.appSettings.upsert({
    where: { siteId: defaultSite.id },
    update: {},
    create: {
      siteId: defaultSite.id,
      adminPinHash,
      emailFromName: "Tesla Scan",
      emailFromAddress: "no-reply@example.com",
      emailCcList: ["cc@example.com"],
      lockTimeoutMinutes: 30,
    },
  });

  const warehouseB = await prisma.site.findUniqueOrThrow({ where: { slug: "warehouse-b" } });
  await prisma.appSettings.upsert({
    where: { siteId: warehouseB.id },
    update: {},
    create: {
      siteId: warehouseB.id,
      adminPinHash,
      emailFromName: "Tesla Scan",
      emailFromAddress: "no-reply@example.com",
      emailCcList: ["cc@example.com"],
      lockTimeoutMinutes: 30,
    },
  });

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.SUPERADMIN,
      siteId: defaultSite.id,
    },
    create: {
      email: adminEmail,
      name: "Admin",
      role: Role.SUPERADMIN,
      passwordHash: adminPasswordHash,
      enabled: true,
      siteId: defaultSite.id,
    },
  });

  await prisma.user.upsert({
    where: { email: operatorEmail },
    update: {
      role: Role.OPERATOR,
      siteId: defaultSite.id,
    },
    create: {
      email: operatorEmail,
      name: "Sample Operator",
      role: Role.OPERATOR,
      passwordHash: operatorPasswordHash,
      enabled: true,
      siteId: defaultSite.id,
    },
  });

  console.log(clear ? "Seed complete (after clear):" : "Seed complete:");
  console.log(`  Superadmin: ${adminEmail} / ${adminPassword}`);
  console.log(`  Operator:   ${operatorEmail} / ${operatorPassword}`);
  console.log(`  Sites:      ${defaultSite.slug}, warehouse-b`);
  console.log("  Default admin PIN: 3333");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
