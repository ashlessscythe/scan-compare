import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireAuth();
  if (user instanceof Response) return user;

  const [homeSite, activeSite] = await Promise.all([
    prisma.site.findUnique({
      where: { id: user.siteId },
      select: { id: true, name: true, slug: true },
    }),
    user.activeSiteId !== user.siteId
      ? prisma.site.findUnique({
          where: { id: user.activeSiteId },
          select: { id: true, name: true, slug: true },
        })
      : Promise.resolve(null),
  ]);

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      role: user.role,
      siteId: user.siteId,
      activeSiteId: user.activeSiteId,
      homeSite,
      activeSite: activeSite ?? homeSite,
    },
  });
}
