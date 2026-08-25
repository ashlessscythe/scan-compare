"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteSwitcher } from "@/components/site-switcher";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  title: string;
  subtitle?: string | null;
  actions?: React.ReactNode;
  /** Extra items shown only inside the mobile sandwich menu (e.g. section links). */
  mobileMenuExtras?: React.ReactNode;
  /** Custom logout handler (e.g. release shipment lock before sign-out). */
  onLogout?: () => void | Promise<void>;
  className?: string;
};

export function AppHeader({
  title,
  subtitle,
  actions,
  mobileMenuExtras,
  onLogout,
  className,
}: AppHeaderProps) {
  const [open, setOpen] = useState(false);
  const hasMenuContent = Boolean(actions || mobileMenuExtras);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
          {subtitle ? (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        {/* Desktop: site switcher + inline actions */}
        <div className="hidden items-center gap-2 sm:flex">
          <SiteSwitcher />
          {actions}
          <UserMenu onLogout={onLogout} />
          <ThemeToggle />
        </div>

        {/* Mobile: site switcher + account + theme + sandwich menu */}
        <div className="flex shrink-0 items-center gap-2 sm:hidden">
          <SiteSwitcher className="flex items-center" />
          <UserMenu onLogout={onLogout} />
          <ThemeToggle />
          {hasMenuContent ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-lg"
                    aria-label="Open menu"
                  />
                }
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100%,20rem)] p-0">
                <SheetHeader className="border-b">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav
                  className="flex flex-col gap-2 p-4"
                  onClick={() => setOpen(false)}
                >
                  {mobileMenuExtras}
                  {actions}
                </nav>
              </SheetContent>
            </Sheet>
          ) : null}
        </div>
      </div>
    </header>
  );
}

type HeaderNavLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function HeaderNavLink({ href, children, className }: HeaderNavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted",
        "w-full sm:w-auto",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function HeaderMenuButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      className="h-11 w-full justify-start"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
