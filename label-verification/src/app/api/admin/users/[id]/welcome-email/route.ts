import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireSuperAdmin,
  activeSiteId,
  jsonError,
} from "@/lib/api-auth";
import { sendWelcomeEmail } from "@/lib/email";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const admin = await requireSuperAdmin();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      enabled: true,
      siteId: true,
      site: { select: { name: true } },
    },
  });

  if (!user || user.siteId !== activeSiteId(admin)) {
    return jsonError("User not found", 404);
  }

  if (user.role === Role.PENDING) {
    return jsonError("Approve the user before sending a welcome email", 400);
  }

  if (!user.enabled) {
    return jsonError("Cannot send welcome email to a disabled user", 400);
  }

  try {
    await sendWelcomeEmail({
      toEmail: user.email,
      siteId: user.siteId,
      siteName: user.site.name,
      recipientName: user.name,
    });
  } catch (error) {
    console.error("Failed to resend welcome email", error);
    return jsonError("Could not send welcome email. Please try again later.", 503);
  }

  return Response.json({ ok: true });
}
