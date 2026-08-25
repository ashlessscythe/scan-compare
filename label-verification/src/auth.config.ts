import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

const ADMIN_ROLES: Role[] = ["SITE_ADMIN", "SUPERADMIN"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;
      const isLoginPage = pathname.startsWith("/login");
      const isRegisterPage = pathname.startsWith("/register");
      const isPendingPage = pathname.startsWith("/pending");
      const isLandingPage = pathname === "/";
      const isPublicApi = pathname.startsWith("/api/auth");

      if (isPublicApi) return true;
      if (pathname.startsWith("/api/")) return true;
      if (isLandingPage) return true;
      if (isRegisterPage) {
        if (isLoggedIn) {
          const role = auth?.user?.role as Role | undefined;
          if (role === "PENDING") {
            return Response.redirect(new URL("/pending", request.nextUrl));
          }
          return Response.redirect(new URL("/scan", request.nextUrl));
        }
        return true;
      }

      if (!isLoggedIn && !isLoginPage) return false;

      const role = auth?.user?.role as Role | undefined;

      if (isLoggedIn && isLoginPage) {
        if (role === "PENDING") {
          return Response.redirect(new URL("/pending", request.nextUrl));
        }
        return Response.redirect(new URL("/scan", request.nextUrl));
      }

      if (isLoggedIn && role === "PENDING" && !isPendingPage) {
        return Response.redirect(new URL("/pending", request.nextUrl));
      }

      if (isLoggedIn && role !== "PENDING" && isPendingPage) {
        return Response.redirect(new URL("/scan", request.nextUrl));
      }

      if (pathname.startsWith("/admin") && (!role || !ADMIN_ROLES.includes(role))) {
        return Response.redirect(new URL("/scan", request.nextUrl));
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

      // Superadmin site switch via session.update({ activeSiteId })
      if (trigger === "update" && session?.activeSiteId && token.role === "SUPERADMIN") {
        token.activeSiteId = session.activeSiteId as string;
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
