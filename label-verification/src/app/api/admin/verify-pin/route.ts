import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError } from "@/lib/api-auth";

const pinSchema = z.object({
  pin: z.string().min(4).max(8),
});

export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (user instanceof Response) return user;

  const body = await request.json();
  const parsed = pinSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid PIN", 400);

  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) return jsonError("Settings not configured", 500);

  const valid = await bcrypt.compare(parsed.data.pin, settings.adminPinHash);
  if (!valid) return jsonError("Invalid admin PIN", 403);

  return Response.json({ ok: true, approvedBy: user.email });
}
