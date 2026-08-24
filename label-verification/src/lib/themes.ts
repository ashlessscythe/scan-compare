export const APP_THEMES = [
  "light",
  "dark",
  "corporate",
  "neon",
  "cyberpunk",
] as const;

export type AppTheme = (typeof APP_THEMES)[number];

export const THEME_LABELS: Record<AppTheme, string> = {
  light: "Light",
  dark: "Dark",
  corporate: "Corporate",
  neon: "Neon",
  cyberpunk: "Cyberpunk",
};

/** Themes that should use dark-mode component variants and dark toasts. */
export const DARK_SURFACE_THEMES: ReadonlySet<string> = new Set([
  "dark",
  "neon",
  "cyberpunk",
]);

export function isDarkSurfaceTheme(theme: string | undefined): boolean {
  return theme != null && DARK_SURFACE_THEMES.has(theme);
}
