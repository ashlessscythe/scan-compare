"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Monitor, Moon, Palette, Sun, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_THEMES, THEME_LABELS, type AppTheme } from "@/lib/themes";

const THEME_ICONS: Record<AppTheme, React.ReactNode> = {
  light: <Sun className="size-4" />,
  dark: <Moon className="size-4" />,
  corporate: <Monitor className="size-4" />,
  neon: <Zap className="size-4" />,
  cyberpunk: <Palette className="size-4" />,
};

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsClient();
  const current = (mounted ? theme : "light") as AppTheme;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon-lg" aria-label="Select theme" />
        }
      >
        {THEME_ICONS[current] ?? <Sun className="size-4" />}
        <span className="sr-only">Theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(value) => {
            if (value) setTheme(value);
          }}
        >
          {APP_THEMES.map((name) => (
            <DropdownMenuRadioItem key={name} value={name} className="gap-2">
              {THEME_ICONS[name]}
              {THEME_LABELS[name]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
