import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";
import { applyActiveSiteUpdate, resolveAuthRedirect } from "@/lib/roles";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role as Role | undefined;

      const redirectTo = resolveAuthRedirect({ pathname, isLoggedIn, role });
      if (redirectTo === "/login") return false;
      if (redirectTo) {
        return Response.redirect(new URL(redirectTo, request.nextUrl));
      }
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.siteId = user.siteId;
        token.activeSiteId = user.siteId;
      }

      if (trigger === "update") {
        token.activeSiteId = applyActiveSiteUpdate({
          role: token.role as string | undefined,
          currentActiveSiteId: (token.activeSiteId as string) ?? (token.siteId as string),
          nextActiveSiteId: session?.activeSiteId as string | undefined,
        });
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.siteId = token.siteId as string;
        session.user.activeSiteId = (token.activeSiteId as string) ?? (token.siteId as string);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
