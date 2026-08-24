import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();
const clear = process.argv.includes("--clear");

async function clearAll() {
  // FK-safe order: scans → shipments → users → settings
  await prisma.scan.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appSettings.deleteMany();
  console.log("Cleared all scans, shipments, users, and app settings.");
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

  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      adminPinHash,
      emailFromName: "Tesla Scan",
      emailFromAddress: "no-reply@example.com",
      emailCcList: ["cc@example.com"],
      lockTimeoutMinutes: 30,
    },
  });

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
      enabled: true,
    },
  });

  await prisma.user.upsert({
    where: { email: operatorEmail },
    update: {},
    create: {
      email: operatorEmail,
      name: "Sample Operator",
      role: Role.OPERATOR,
      passwordHash: operatorPasswordHash,
      enabled: true,
    },
  });

  console.log(clear ? "Seed complete (after clear):" : "Seed complete:");
  console.log(`  Admin:    ${adminEmail} / ${adminPassword}`);
  console.log(`  Operator: ${operatorEmail} / ${operatorPassword}`);
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
