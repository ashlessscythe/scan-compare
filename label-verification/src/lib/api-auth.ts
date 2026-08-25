import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  siteId: string;
  activeSiteId: string;
};

export function isSiteAdminRole(role: Role): boolean {
  return role === Role.SITE_ADMIN || role === Role.SUPERADMIN;
}

export function isSuperAdminRole(role: Role): boolean {
  return role === Role.SUPERADMIN;
}

export function canOperate(role: Role): boolean {
  return role === Role.OPERATOR || isSiteAdminRole(role);
}

export function activeSiteId(user: SessionUser): string {
  return user.activeSiteId;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email || !session.user.siteId || !session.user.activeSiteId) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as Role,
    siteId: session.user.siteId,
    activeSiteId: session.user.activeSiteId,
  };
}

export async function requireAuth(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

/** Authenticated and not PENDING — can use scan / shipment APIs. */
export async function requireActiveOperator(): Promise<SessionUser | NextResponse> {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  if (!canOperate(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}

/** SITE_ADMIN or SUPERADMIN. */
export async function requireSiteAdmin(): Promise<SessionUser | NextResponse> {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  if (!isSiteAdminRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}

/** @deprecated Use requireSiteAdmin — kept as alias for gradual migration. */
export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  return requireSiteAdmin();
}

export async function requireSuperAdmin(): Promise<SessionUser | NextResponse> {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  if (!isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status: status });
}
