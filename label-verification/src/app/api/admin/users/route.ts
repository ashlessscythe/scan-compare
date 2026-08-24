import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/api-auth";

export async function GET() {
  const user = await requireAdmin();
  if (user instanceof Response) return user;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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

  return Response.json({ users });
}

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(["OPERATOR", "ADMIN"]).default("OPERATOR"),
});

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (user instanceof Response) return user;

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) return jsonError("User already exists", 409);

  const created = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
    },
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

  return Response.json({ user: created }, { status: 201 });
}
