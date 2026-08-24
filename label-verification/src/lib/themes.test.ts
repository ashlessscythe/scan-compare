import { describe, expect, it } from "vitest";
import {
  APP_THEMES,
  isDarkSurfaceTheme,
  THEME_LABELS,
} from "./themes";

describe("themes", () => {
  it("exposes the five app themes", () => {
    expect([...APP_THEMES]).toEqual([
      "light",
      "dark",
      "corporate",
      "neon",
      "cyberpunk",
    ]);
  });

  it("labels every theme", () => {
    for (const theme of APP_THEMES) {
      expect(THEME_LABELS[theme]).toBeTruthy();
    }
  });

  it("classifies dark-surface themes", () => {
    expect(isDarkSurfaceTheme("dark")).toBe(true);
    expect(isDarkSurfaceTheme("neon")).toBe(true);
    expect(isDarkSurfaceTheme("cyberpunk")).toBe(true);
    expect(isDarkSurfaceTheme("light")).toBe(false);
    expect(isDarkSurfaceTheme("corporate")).toBe(false);
    expect(isDarkSurfaceTheme(undefined)).toBe(false);
  });
});
