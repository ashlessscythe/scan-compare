import { describe, expect, it } from "vitest";
import { authConfig, SESSION_INVALIDATED_ERROR } from "@/auth.config";

type AuthorizedParams = Parameters<
  NonNullable<typeof authConfig.callbacks.authorized>
>[0];

function mockRequest(pathname: string): AuthorizedParams["request"] {
  return {
    nextUrl: new URL(pathname, "http://localhost:3000"),
  } as AuthorizedParams["request"];
}

function mockAuth(
  overrides: {
    user?: Partial<NonNullable<NonNullable<AuthorizedParams["auth"]>["user"]>>;
  } & Partial<Omit<NonNullable<AuthorizedParams["auth"]>, "user">> = {},
): AuthorizedParams["auth"] {
  const { user: userOverrides, ...authOverrides } = overrides;
  return {
    user: {
      id: "user-1",
      role: "OPERATOR",
      ...userOverrides,
    },
    ...authOverrides,
  } as AuthorizedParams["auth"];
}

function callAuthorized(pathname: string, auth: AuthorizedParams["auth"] = null) {
  const authorized = authConfig.callbacks.authorized;
  if (!authorized) {
    throw new Error("authorized callback is missing");
  }
  return authorized({ auth, request: mockRequest(pathname) });
}

describe("authConfig authorized callback", () => {
  describe("invalidated sessions", () => {
    const invalidatedAuth = mockAuth({ error: SESSION_INVALIDATED_ERROR });

    it("allows auth API routes so signOut and signIn can complete", () => {
      for (const path of [
        "/api/auth/session",
        "/api/auth/signout",
        "/api/auth/csrf",
        "/api/auth/providers",
        "/api/auth/callback/credentials",
        "/api/auth/account-status",
      ]) {
        expect(callAuthorized(path, invalidatedAuth)).toBe(true);
      }
    });

    it("allows pending and register pages", () => {
      expect(callAuthorized("/pending", invalidatedAuth)).toBe(true);
      expect(callAuthorized("/register", invalidatedAuth)).toBe(true);
      expect(callAuthorized("/register?mode=login&reason=approved", invalidatedAuth)).toBe(
        true,
      );
    });

    it("redirects other pages to the approved login flow", () => {
      for (const path of ["/scan", "/admin", "/"]) {
        const result = callAuthorized(path, invalidatedAuth);
        expect(result).toBeInstanceOf(Response);
        expect((result as Response).headers.get("Location")).toBe(
          "http://localhost:3000/register?mode=login&reason=approved",
        );
      }
    });

    it("treats invalidated sessions as logged out for normal redirects", () => {
      const result = callAuthorized("/scan", invalidatedAuth);
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).headers.get("Location")).toContain("/register");
    });
  });

  describe("active sessions", () => {
    it("allows auth API routes for guests", () => {
      expect(callAuthorized("/api/auth/session", null)).toBe(true);
    });

    it("defers guest redirects on protected pages to NextAuth sign-in", () => {
      expect(callAuthorized("/scan", null)).toBe(false);
    });

    it("redirects pending users to /pending from protected pages", () => {
      const pendingAuth = mockAuth({ user: { role: "PENDING" } });
      const result = callAuthorized("/scan", pendingAuth);
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).headers.get("Location")).toBe(
        "http://localhost:3000/pending",
      );
    });
  });
});
