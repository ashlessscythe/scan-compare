import type { NextAuthConfig } from "next-auth";

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
      const isPublicApi = pathname.startsWith("/api/auth");

      if (isPublicApi) return true;
      if (pathname.startsWith("/api/")) return true;

      if (!isLoggedIn && !isLoginPage) return false;
      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/scan", request.nextUrl));
      }
      if (pathname.startsWith("/admin") && auth?.user?.role !== "ADMIN") {
        return Response.redirect(new URL("/scan", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "OPERATOR" | "ADMIN";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
