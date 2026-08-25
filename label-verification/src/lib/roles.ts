import { Role } from "@prisma/client";

export function isSiteAdminRole(role: string | undefined | null): boolean {
  return role === Role.SITE_ADMIN || role === Role.SUPERADMIN;
}

export function isSuperAdminRole(role: string | undefined | null): boolean {
  return role === Role.SUPERADMIN;
}
