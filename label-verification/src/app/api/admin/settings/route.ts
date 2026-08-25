import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSiteAdmin, activeSiteId, jsonError } from "@/lib/api-auth";

export async function GET() {
  const user = await requireSiteAdmin();
  if (user instanceof Response) return user;

  const settings = await prisma.appSettings.findUnique({
    where: { siteId: activeSiteId(user) },
  });
  if (!settings) return jsonError("Settings not found", 404);

  return Response.json({
    settings: {
      emailFromName: settings.emailFromName,
      emailFromAddress: settings.emailFromAddress,
      emailCcList: settings.emailCcList,
      lockTimeoutMinutes: settings.lockTimeoutMinutes,
      updatedAt: settings.updatedAt,
    },
  });
}

const updateSchema = z.object({
  adminPin: z.string().min(4).max(8).optional(),
  emailFromName: z.string().min(1).optional(),
  emailFromAddress: z.string().email().optional(),
  emailCcList: z.array(z.string().email()).optional(),
  lockTimeoutMinutes: z.number().int().min(5).max(240).optional(),
});

export async function PATCH(request: NextRequest) {
  const user = await requireSiteAdmin();
  if (user instanceof Response) return user;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const data: Record<string, unknown> = { updatedByUserId: user.id };
  if (parsed.data.adminPin) data.adminPinHash = await bcrypt.hash(parsed.data.adminPin, 12);
  if (parsed.data.emailFromName) data.emailFromName = parsed.data.emailFromName;
  if (parsed.data.emailFromAddress) data.emailFromAddress = parsed.data.emailFromAddress;
  if (parsed.data.emailCcList) data.emailCcList = parsed.data.emailCcList;
  if (parsed.data.lockTimeoutMinutes) data.lockTimeoutMinutes = parsed.data.lockTimeoutMinutes;

  const settings = await prisma.appSettings.update({
    where: { siteId: activeSiteId(user) },
    data,
  });

  return Response.json({
    settings: {
      emailFromName: settings.emailFromName,
      emailFromAddress: settings.emailFromAddress,
      emailCcList: settings.emailCcList,
      lockTimeoutMinutes: settings.lockTimeoutMinutes,
      updatedAt: settings.updatedAt,
    },
  });
}
