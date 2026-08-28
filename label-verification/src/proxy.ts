import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { proxyMatcher } from "@/proxy.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: proxyMatcher,
};
