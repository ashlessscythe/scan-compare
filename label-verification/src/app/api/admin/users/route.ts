import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireSiteAdmin,
  activeSiteId,
  jsonError,
  isSuperAdminRole,
} from "@/lib/api-auth";
import { canAssignRole } from "@/lib/roles";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  enabled: true,
  lastLogin: true,
  createdAt: true,
  siteId: true,
} as const;

export async function GET() {
  const user = await requireSiteAdmin();
  if (user instanceof Response) return user;

  const users = await prisma.user.findMany({
    where: { siteId: activeSiteId(user) },
    orderBy: { createdAt: "desc" },
    select: userSelect,
  });

  return Response.json({ users });
}

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(["PENDING", "OPERATOR", "SITE_ADMIN", "SUPERADMIN"]).default("OPERATOR"),
  siteId: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  const user = await requireSiteAdmin();
  if (user instanceof Response) return user;

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

  if (!canAssignRole(user.role, parsed.data.role)) {
    return jsonError("Only superadmins can create superadmin users", 403);
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) return jsonError("User already exists", 409);

  let targetSiteId = activeSiteId(user);
  if (parsed.data.siteId !== undefined) {
    if (!isSuperAdminRole(user.role)) {
      return jsonError("Only superadmins can assign users to a specific site", 403);
    }
    const site = await prisma.site.findUnique({ where: { id: parsed.data.siteId } });
    if (!site) return jsonError("Site not found", 404);
    targetSiteId = site.id;
  }

  const created = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      role: parsed.data.role as Role,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      siteId: targetSiteId,
    },
    select: userSelect,
  });

  return Response.json({ user: created }, { status: 201 });
}
