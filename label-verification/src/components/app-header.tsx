"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  title: string;
  subtitle?: string | null;
  actions?: React.ReactNode;
  className?: string;
};

export function AppHeader({ title, subtitle, actions, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
          {subtitle ? (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

type HeaderNavLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function HeaderNavLink({ href, children }: HeaderNavLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
    >
      {children}
    </Link>
  );
}

export function HeaderLogoutButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" className="h-9" onClick={onClick}>
      Logout
    </Button>
  );
}
