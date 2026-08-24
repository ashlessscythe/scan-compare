import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as Role,
  };
}

export async function requireAuth(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  if (user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
