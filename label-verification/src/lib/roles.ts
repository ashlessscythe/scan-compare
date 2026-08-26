import { Role } from "@prisma/client";

export function isSiteAdminRole(role: string | undefined | null): boolean {
  return role === Role.SITE_ADMIN || role === Role.SUPERADMIN;
}

export function isSuperAdminRole(role: string | undefined | null): boolean {
  return role === Role.SUPERADMIN;
}

/** OPERATOR and admins can use scan/shipment APIs; PENDING cannot. */
export function canOperate(role: string | undefined | null): boolean {
  return role === Role.OPERATOR || isSiteAdminRole(role);
}

export function canAccessAdmin(role: string | undefined | null): boolean {
  return isSiteAdminRole(role);
}

/**
 * Resolve an in-app redirect after login / for gated pages.
 * Returns null when the current path is allowed.
 */
export function resolveAuthRedirect(options: {
  pathname: string;
  isLoggedIn: boolean;
  role?: string | null;
}): string | null {
  const { pathname, isLoggedIn, role } = options;
  const isLoginPage = pathname.startsWith("/login");
  const isRegisterPage = pathname.startsWith("/register");
  const isForgotPasswordPage = pathname.startsWith("/forgot-password");
  const isResetPasswordPage = pathname.startsWith("/reset-password");
  const isPendingPage = pathname.startsWith("/pending");
  const isLandingPage = pathname === "/";
  const isPublicApi = pathname.startsWith("/api/auth");
  const isAuthFormPage =
    isRegisterPage || isLoginPage || isForgotPasswordPage || isResetPasswordPage;

  if (isPublicApi || pathname.startsWith("/api/") || isLandingPage) {
    return null;
  }

  if (isAuthFormPage) {
    if (!isLoggedIn) {
      // Unified auth UI lives on /register (signup + login).
      return isLoginPage ? "/register?mode=login" : null;
    }
    return role === Role.PENDING ? "/pending" : "/scan";
  }

  if (!isLoggedIn) {
    return "/register";
  }

  if (role === Role.PENDING && !isPendingPage) {
    return "/pending";
  }

  if (role !== Role.PENDING && isPendingPage) {
    return "/scan";
  }

  if (pathname.startsWith("/admin") && !canAccessAdmin(role)) {
    return "/scan";
  }

  return null;
}

/** Superadmin-only active site switch for JWT updates. */
export function applyActiveSiteUpdate(options: {
  role: string | undefined | null;
  currentActiveSiteId: string;
  nextActiveSiteId: string | undefined | null;
}): string {
  const { role, currentActiveSiteId, nextActiveSiteId } = options;
  if (isSuperAdminRole(role) && nextActiveSiteId) {
    return nextActiveSiteId;
  }
  return currentActiveSiteId;
}

/** Only SUPERADMIN may assign SUPERADMIN to others. */
export function canAssignRole(
  actorRole: string | undefined | null,
  targetRole: string,
): boolean {
  if (targetRole === Role.SUPERADMIN) {
    return isSuperAdminRole(actorRole);
  }
  return canAccessAdmin(actorRole);
}
