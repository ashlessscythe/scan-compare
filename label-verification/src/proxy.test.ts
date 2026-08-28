import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { proxyMatcher } from "@/proxy.config";

const PROXY_MATCHER = proxyMatcher[0];
const proxySource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "proxy.ts"),
  "utf8",
);

function matchesProxy(pathname: string): boolean {
  return new RegExp(`^${PROXY_MATCHER}$`).test(pathname);
}

describe("proxy matcher", () => {
  it("stays in sync with the inline matcher in proxy.ts", () => {
    expect(proxySource).toContain(PROXY_MATCHER);
  });

  it("skips auth API routes so NextAuth handlers return JSON", () => {
    for (const path of [
      "/api/auth/session",
      "/api/auth/signout",
      "/api/auth/csrf",
      "/api/auth/providers",
      "/api/auth/callback/credentials",
      "/api/auth/account-status",
      "/api/auth/register",
    ]) {
      expect(matchesProxy(path)).toBe(false);
    }
  });

  it("skips static assets", () => {
    expect(matchesProxy("/_next/static/chunks/main.js")).toBe(false);
    expect(matchesProxy("/_next/image?url=%2Flogo.png")).toBe(false);
    expect(matchesProxy("/favicon.ico")).toBe(false);
  });

  it("still protects app pages and non-auth APIs", () => {
    for (const path of ["/", "/scan", "/pending", "/register", "/admin", "/api/me", "/api/scans"]) {
      expect(matchesProxy(path)).toBe(true);
    }
  });
});
