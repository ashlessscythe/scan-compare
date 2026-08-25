import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-auth";
import { normalizeRegisterEmail, registerSchema } from "@/lib/register";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const email = normalizeRegisterEmail(parsed.data.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError("An account with this email already exists", 409);
  }

  const defaultSite = await prisma.site.findUnique({ where: { slug: "default" } });
  if (!defaultSite) {
    return jsonError("Default site is not configured", 500);
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      role: Role.PENDING,
      enabled: true,
      siteId: defaultSite.id,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
