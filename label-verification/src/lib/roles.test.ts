import { describe, expect, it } from "vitest";
import {
  applyActiveSiteUpdate,
  canAccessAdmin,
  canAssignRole,
  canOperate,
  isSiteAdminRole,
  isSuperAdminRole,
  resolveAuthRedirect,
} from "./roles";

describe("role helpers", () => {
  it("identifies site admins and superadmins", () => {
    expect(isSiteAdminRole("SITE_ADMIN")).toBe(true);
    expect(isSiteAdminRole("SUPERADMIN")).toBe(true);
    expect(isSiteAdminRole("OPERATOR")).toBe(false);
    expect(isSiteAdminRole("PENDING")).toBe(false);
    expect(isSuperAdminRole("SUPERADMIN")).toBe(true);
    expect(isSuperAdminRole("SITE_ADMIN")).toBe(false);
  });

  it("allows operators and admins to operate, but not pending", () => {
    expect(canOperate("OPERATOR")).toBe(true);
    expect(canOperate("SITE_ADMIN")).toBe(true);
    expect(canOperate("SUPERADMIN")).toBe(true);
    expect(canOperate("PENDING")).toBe(false);
    expect(canOperate(undefined)).toBe(false);
  });

  it("gates admin panel to site admin roles", () => {
    expect(canAccessAdmin("SITE_ADMIN")).toBe(true);
    expect(canAccessAdmin("SUPERADMIN")).toBe(true);
    expect(canAccessAdmin("OPERATOR")).toBe(false);
    expect(canAccessAdmin("PENDING")).toBe(false);
  });

  it("only lets superadmins assign SUPERADMIN", () => {
    expect(canAssignRole("SUPERADMIN", "SUPERADMIN")).toBe(true);
    expect(canAssignRole("SITE_ADMIN", "SUPERADMIN")).toBe(false);
    expect(canAssignRole("SITE_ADMIN", "OPERATOR")).toBe(true);
    expect(canAssignRole("SITE_ADMIN", "PENDING")).toBe(true);
    expect(canAssignRole("OPERATOR", "OPERATOR")).toBe(false);
  });
});

describe("resolveAuthRedirect", () => {
  it("allows public landing and auth APIs", () => {
    expect(resolveAuthRedirect({ pathname: "/", isLoggedIn: false })).toBeNull();
    expect(
      resolveAuthRedirect({ pathname: "/api/auth/session", isLoggedIn: false }),
    ).toBeNull();
    expect(resolveAuthRedirect({ pathname: "/register", isLoggedIn: false })).toBeNull();
    expect(
      resolveAuthRedirect({ pathname: "/forgot-password", isLoggedIn: false }),
    ).toBeNull();
    expect(
      resolveAuthRedirect({ pathname: "/reset-password", isLoggedIn: false }),
    ).toBeNull();
  });

  it("sends guests to register for protected pages", () => {
    expect(resolveAuthRedirect({ pathname: "/scan", isLoggedIn: false })).toBe("/register");
    expect(resolveAuthRedirect({ pathname: "/admin", isLoggedIn: false })).toBe("/register");
  });

  it("keeps PENDING users on /pending", () => {
    expect(
      resolveAuthRedirect({ pathname: "/scan", isLoggedIn: true, role: "PENDING" }),
    ).toBe("/pending");
    expect(
      resolveAuthRedirect({ pathname: "/admin", isLoggedIn: true, role: "PENDING" }),
    ).toBe("/pending");
    expect(
      resolveAuthRedirect({ pathname: "/pending", isLoggedIn: true, role: "PENDING" }),
    ).toBeNull();
  });

  it("redirects approved users away from /pending", () => {
    expect(
      resolveAuthRedirect({ pathname: "/pending", isLoggedIn: true, role: "OPERATOR" }),
    ).toBe("/scan");
  });

  it("blocks operators from admin", () => {
    expect(
      resolveAuthRedirect({ pathname: "/admin", isLoggedIn: true, role: "OPERATOR" }),
    ).toBe("/scan");
    expect(
      resolveAuthRedirect({ pathname: "/admin", isLoggedIn: true, role: "SITE_ADMIN" }),
    ).toBeNull();
    expect(
      resolveAuthRedirect({ pathname: "/admin", isLoggedIn: true, role: "SUPERADMIN" }),
    ).toBeNull();
  });

  it("redirects logged-in users off login/register/password-reset pages", () => {
    expect(
      resolveAuthRedirect({ pathname: "/login", isLoggedIn: true, role: "OPERATOR" }),
    ).toBe("/scan");
    expect(
      resolveAuthRedirect({ pathname: "/login", isLoggedIn: true, role: "PENDING" }),
    ).toBe("/pending");
    expect(
      resolveAuthRedirect({ pathname: "/register", isLoggedIn: true, role: "PENDING" }),
    ).toBe("/pending");
    expect(
      resolveAuthRedirect({
        pathname: "/forgot-password",
        isLoggedIn: true,
        role: "OPERATOR",
      }),
    ).toBe("/scan");
    expect(
      resolveAuthRedirect({
        pathname: "/reset-password",
        isLoggedIn: true,
        role: "OPERATOR",
      }),
    ).toBe("/scan");
  });

  it("sends guests from /login to the unified register page", () => {
    expect(resolveAuthRedirect({ pathname: "/login", isLoggedIn: false })).toBe(
      "/register?mode=login",
    );
  });
});

describe("applyActiveSiteUpdate", () => {
  it("updates active site only for superadmins", () => {
    expect(
      applyActiveSiteUpdate({
        role: "SUPERADMIN",
        currentActiveSiteId: "site-a",
        nextActiveSiteId: "site-b",
      }),
    ).toBe("site-b");

    expect(
      applyActiveSiteUpdate({
        role: "SITE_ADMIN",
        currentActiveSiteId: "site-a",
        nextActiveSiteId: "site-b",
      }),
    ).toBe("site-a");

    expect(
      applyActiveSiteUpdate({
        role: "SUPERADMIN",
        currentActiveSiteId: "site-a",
        nextActiveSiteId: null,
      }),
    ).toBe("site-a");
  });
});
