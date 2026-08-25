import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { requireSuperAdmin, jsonError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createSiteSchema, defaultAppSettingsData } from "@/lib/sites";

const siteSelect = {
  id: true,
  name: true,
  slug: true,
  _count: { select: { users: true, shipments: true } },
} as const;

export async function GET() {
  const user = await requireSuperAdmin();
  if (user instanceof Response) return user;

  const sites = await prisma.site.findMany({
    orderBy: { name: "asc" },
    select: siteSelect,
  });

  return Response.json({ sites, activeSiteId: user.activeSiteId });
}

export async function POST(request: NextRequest) {
  const user = await requireSuperAdmin();
  if (user instanceof Response) return user;

  const body = await request.json();
  const parsed = createSiteSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const existing = await prisma.site.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return jsonError("Site slug already exists", 409);

  const adminPinHash = await bcrypt.hash("3333", 12);

  const site = await prisma.$transaction(async (tx) => {
    const created = await tx.site.create({
      data: { name: parsed.data.name, slug: parsed.data.slug },
      select: { id: true, name: true, slug: true },
    });
    await tx.appSettings.create({
      data: defaultAppSettingsData(created.id, adminPinHash),
    });
    return created;
  });

  return Response.json({ site }, { status: 201 });
}
