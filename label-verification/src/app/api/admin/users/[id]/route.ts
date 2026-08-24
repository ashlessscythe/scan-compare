import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/api-auth";

type RouteParams = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().optional(),
  enabled: z.boolean().optional(),
  role: z.enum(["OPERATOR", "ADMIN"]).optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.enabled !== undefined) data.enabled = parsed.data.enabled;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      enabled: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  return Response.json({ user });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  if (id === admin.id) return jsonError("Cannot delete your own account", 400);

  await prisma.user.delete({ where: { id } });
  return Response.json({ ok: true });
}
