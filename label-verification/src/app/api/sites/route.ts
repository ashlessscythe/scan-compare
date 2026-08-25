import { requireSuperAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireSuperAdmin();
  if (user instanceof Response) return user;

  const sites = await prisma.site.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return Response.json({ sites, activeSiteId: user.activeSiteId });
}
