import { NextRequest } from "next/server";
import { requireSuperAdmin, jsonError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SITE_SLUG, updateSiteSchema } from "@/lib/sites";

type RouteParams = { params: Promise<{ id: string }> };

const siteSelect = {
  id: true,
  name: true,
  slug: true,
  _count: { select: { users: true, shipments: true } },
} as const;

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await requireSuperAdmin();
  if (user instanceof Response) return user;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSiteSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const existing = await prisma.site.findUnique({ where: { id } });
  if (!existing) return jsonError("Site not found", 404);

  if (parsed.data.slug !== undefined && existing.slug === DEFAULT_SITE_SLUG) {
    return jsonError("Cannot change slug of the default site", 400);
  }

  if (parsed.data.slug !== undefined && parsed.data.slug !== existing.slug) {
    const slugTaken = await prisma.site.findUnique({ where: { slug: parsed.data.slug } });
    if (slugTaken) return jsonError("Site slug already exists", 409);
  }

  const data: Record<string, string> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.slug !== undefined) data.slug = parsed.data.slug;

  const site = await prisma.site.update({
    where: { id },
    data,
    select: siteSelect,
  });

  return Response.json({ site });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await requireSuperAdmin();
  if (user instanceof Response) return user;

  const { id } = await params;

  const existing = await prisma.site.findUnique({
    where: { id },
    include: { _count: { select: { users: true, shipments: true } } },
  });
  if (!existing) return jsonError("Site not found", 404);

  if (existing.slug === DEFAULT_SITE_SLUG) {
    return jsonError("Cannot delete the default site", 400);
  }

  if (existing._count.users > 0) {
    return jsonError("Cannot delete a site that has users", 400);
  }

  if (existing._count.shipments > 0) {
    return jsonError("Cannot delete a site that has shipments", 400);
  }

  await prisma.site.delete({ where: { id } });
  return Response.json({ ok: true });
}
