export const SESSION_INVALIDATED_ERROR = "SessionInvalidated";

export type SessionVersionToken = {
  id?: string;
  sessionVersion?: number;
  error?: string;
};

/** Reject JWTs whose sessionVersion no longer matches the database. */
export async function validateSessionVersion(
  token: SessionVersionToken,
): Promise<SessionVersionToken> {
  if (!token.id) {
    return token;
  }

  if (token.error === SESSION_INVALIDATED_ERROR) {
    return token;
  }

  const { prisma } = await import("@/lib/prisma");
  const dbUser = await prisma.user.findUnique({
    where: { id: token.id },
    select: { sessionVersion: true },
  });

  if (!dbUser) {
    return { ...token, error: SESSION_INVALIDATED_ERROR };
  }

  const tokenVersion = token.sessionVersion ?? 0;
  if (tokenVersion !== dbUser.sessionVersion) {
    return { ...token, error: SESSION_INVALIDATED_ERROR };
  }

  return token;
}

export function isSessionInvalidated(error: string | undefined | null): boolean {
  return error === SESSION_INVALIDATED_ERROR;
}
