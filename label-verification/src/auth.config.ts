import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";
import { applyActiveSiteUpdate, resolveAuthRedirect } from "@/lib/roles";
import {
  SESSION_INVALIDATED_ERROR,
  isSessionInvalidated,
  validateSessionVersion,
} from "@/lib/session-version";

export const authConfig = {
  pages: {
    signIn: "/register",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      const sessionInvalidated = isSessionInvalidated(auth?.error);
      const isLoggedIn = !!auth?.user && !sessionInvalidated;
      const role = auth?.user?.role as Role | undefined;

      if (sessionInvalidated) {
        if (
          pathname.startsWith("/pending") ||
          pathname.startsWith("/api/auth/") ||
          pathname.startsWith("/register")
        ) {
          return true;
        }
        const url = new URL("/register?mode=login&reason=approved", request.nextUrl);
        return Response.redirect(url);
      }

      const redirectTo = resolveAuthRedirect({ pathname, isLoggedIn, role });
      // Let NextAuth send guests to pages.signIn (preserves callbackUrl).
      if (redirectTo === "/register" && !pathname.startsWith("/register")) return false;
      if (redirectTo) {
        return Response.redirect(new URL(redirectTo, request.nextUrl));
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.siteId = user.siteId;
        token.activeSiteId = user.siteId;
        token.sessionVersion = user.sessionVersion ?? 0;
        delete token.error;
      }

      if (trigger === "update") {
        token.activeSiteId = applyActiveSiteUpdate({
          role: token.role as string | undefined,
          currentActiveSiteId: (token.activeSiteId as string) ?? (token.siteId as string),
          nextActiveSiteId: session?.activeSiteId as string | undefined,
        });
      }

      return validateSessionVersion({
        id: token.id as string | undefined,
        sessionVersion: token.sessionVersion as number | undefined,
        error: token.error as string | undefined,
      }).then((validated) => ({
        ...token,
        ...validated,
      }));
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.siteId = token.siteId as string;
        session.user.activeSiteId = (token.activeSiteId as string) ?? (token.siteId as string);
      }
      if (token.error) {
        session.error = token.error as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export { SESSION_INVALIDATED_ERROR };
