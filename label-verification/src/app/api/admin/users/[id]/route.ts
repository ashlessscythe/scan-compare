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
import { sendWelcomeEmail } from "@/lib/email";

type RouteParams = { params: Promise<{ id: string }> };

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

const updateSchema = z.object({
  name: z.string().optional(),
  enabled: z.boolean().optional(),
  role: z.enum(["PENDING", "OPERATOR", "SITE_ADMIN", "SUPERADMIN"]).optional(),
  password: z.string().min(8).optional(),
  siteId: z.string().min(1).optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const admin = await requireSiteAdmin();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return jsonError("User not found", 404);
  if (existing.siteId !== activeSiteId(admin)) {
    return jsonError("User not found", 404);
  }

  if (parsed.data.role !== undefined && !canAssignRole(admin.role, parsed.data.role)) {
    return jsonError("Only superadmins can assign superadmin role", 403);
  }

  if (parsed.data.siteId !== undefined) {
    if (!isSuperAdminRole(admin.role)) {
      return jsonError("Only superadmins can assign users to a specific site", 403);
    }
    const site = await prisma.site.findUnique({ where: { id: parsed.data.siteId } });
    if (!site) return jsonError("Site not found", 404);
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.enabled !== undefined) data.enabled = parsed.data.enabled;
  if (parsed.data.role !== undefined) data.role = parsed.data.role as Role;
  if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  if (parsed.data.siteId !== undefined) data.siteId = parsed.data.siteId;

  const wasPending = existing.role === Role.PENDING;
  const newRole =
    parsed.data.role !== undefined ? (parsed.data.role as Role) : existing.role;
  const isApproval = wasPending && newRole !== Role.PENDING;

  if (isApproval) {
    data.sessionVersion = { increment: 1 };
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });

  let welcomeEmailSent = false;
  if (isApproval && user.enabled) {
    const site = await prisma.site.findUnique({
      where: { id: user.siteId },
      select: { name: true },
    });
    if (site) {
      try {
        await sendWelcomeEmail({
          toEmail: user.email,
          siteId: user.siteId,
          siteName: site.name,
          recipientName: user.name,
        });
        welcomeEmailSent = true;
      } catch (error) {
        console.error("Failed to send welcome email", error);
      }
    }
  }

  return Response.json({ user, welcomeEmailSent });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const admin = await requireSiteAdmin();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  if (id === admin.id) return jsonError("Cannot delete your own account", 400);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return jsonError("User not found", 404);
  if (existing.siteId !== activeSiteId(admin)) {
    return jsonError("User not found", 404);
  }

  await prisma.user.delete({ where: { id } });
  return Response.json({ ok: true });
}
