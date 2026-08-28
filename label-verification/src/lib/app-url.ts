/** Base app URL without trailing slash. */
export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/** Build an absolute URL for a path (path must start with `/`). */
export function buildAppUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${appBaseUrl()}${normalizedPath}`;
}

export function buildLoginUrl(): string {
  return buildAppUrl("/register?mode=login");
}
