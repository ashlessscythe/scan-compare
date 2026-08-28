import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-auth";
import { isSessionInvalidated } from "@/lib/session-version";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      site: { select: { name: true } },
    },
  });

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const isApproved = user.role !== Role.PENDING;

  return Response.json({
    role: user.role,
    siteName: user.site.name,
    isApproved,
    requiresSignIn: isApproved || isSessionInvalidated(session.error),
  });
}
