import dotenv from "dotenv";
dotenv.config({ quiet: true });

import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { seedDemoShipments, DEMO_SHIPMENT_NUMBERS } from "./seed-scans";

// Prefer direct (non-pooled) URL for CLI seed — same as Prisma Migrate.
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL },
  },
});
const clear = process.argv.includes("--clear");
const clearData = process.argv.includes("--clear-data");

const DEFAULT_OPERATORS = [
  { email: "operator@example.com", name: "Operator" },
  { email: "operator1@example.com", name: "Operator 1" },
  { email: "operator2@example.com", name: "Operator 2" },
  { email: "operator3@example.com", name: "Operator 3" },
  { email: "operator4@example.com", name: "Operator 4" },
] as const;

const WAREHOUSE_B_OPERATORS = [
  { email: "wb-operator1@example.com", name: "WB Operator 1" },
  { email: "wb-operator2@example.com", name: "WB Operator 2" },
  { email: "wb-operator3@example.com", name: "WB Operator 3" },
] as const;

async function clearAll() {
  // FK-safe order: scans → shipments → settings → users → sites
  await prisma.scan.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.appSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.site.deleteMany();
  console.log("Cleared all scans, shipments, settings, users, and sites.");
}

async function clearScanData() {
  // Leaves sites, users, and settings intact
  await prisma.scan.deleteMany();
  await prisma.shipment.deleteMany();
  console.log("Cleared all scans and shipments (sites and users left intact).");
}

async function seedOperators(
  operators: ReadonlyArray<{ email: string; name: string }>,
  siteId: string,
  passwordHash: string,
  primaryEmail?: string,
) {
  const ids: string[] = [];

  for (const op of operators) {
    const user = await prisma.user.upsert({
      where: { email: op.email },
      update: {
        name: op.name,
        role: Role.OPERATOR,
        siteId,
        enabled: true,
      },
      create: {
        email: op.email,
        name: op.name,
        role: Role.OPERATOR,
        passwordHash,
        enabled: true,
        siteId,
      },
    });
    ids.push(user.id);
  }

  return { ids, primaryId: ids.find((_, i) => operators[i].email === primaryEmail) ?? ids[0] };
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const operatorEmail = process.env.SEED_OPERATOR_EMAIL ?? "operator@example.com";
  const operatorPassword = process.env.SEED_OPERATOR_PASSWORD ?? "Operator123!";

  if (clear && clearData) {
    throw new Error("Use either --clear or --clear-data, not both.");
  }
  if (clear) {
    await clearAll();
  } else if (clearData) {
    await clearScanData();
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

  const admin = await prisma.user.upsert({
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

  const defaultOps = await seedOperators(
    DEFAULT_OPERATORS.map((op) =>
      op.email === "operator@example.com" ? { ...op, email: operatorEmail } : op,
    ),
    defaultSite.id,
    operatorPasswordHash,
    operatorEmail,
  );

  const warehouseBOps = await seedOperators(
    WAREHOUSE_B_OPERATORS,
    warehouseB.id,
    operatorPasswordHash,
  );

  const demoStats = await seedDemoShipments(prisma, {
    defaultSiteId: defaultSite.id,
    warehouseBSiteId: warehouseB.id,
    operatorsBySite: {
      [defaultSite.id]: defaultOps.ids,
      [warehouseB.id]: warehouseBOps.ids,
    },
    createdByUserId: admin.id,
  });

  const allOperators = [
    ...DEFAULT_OPERATORS.map((op) =>
      op.email === "operator@example.com"
        ? { email: operatorEmail, name: op.name }
        : op,
    ),
    ...WAREHOUSE_B_OPERATORS,
  ];

  console.log(
    clear
      ? "Seed complete (after clear):"
      : clearData
        ? "Seed complete (after clear-data):"
        : "Seed complete:",
  );
  console.log(`  Superadmin: ${adminEmail} / ${adminPassword}`);
  console.log(`  Operators (${allOperators.length}, password ${operatorPassword}):`);
  for (const op of allOperators) {
    console.log(`    ${op.email} (${op.name})`);
  }
  console.log(`  Sites:      ${defaultSite.slug}, warehouse-b`);
  console.log("  Default admin PIN: 3333");
  console.log(
    `  Demo shipments: ${DEMO_SHIPMENT_NUMBERS[0]}–${DEMO_SHIPMENT_NUMBERS[DEMO_SHIPMENT_NUMBERS.length - 1]} (${demoStats.shipmentCount} shipments, ${demoStats.totalPallets} pallets, ${demoStats.scanCount} scans)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
