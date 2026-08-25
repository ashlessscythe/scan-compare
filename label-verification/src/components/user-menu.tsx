"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Superadmin",
  SITE_ADMIN: "Site admin",
  OPERATOR: "Operator",
  PENDING: "Pending",
};

type MeProfile = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  siteId: string;
  activeSiteId: string;
  homeSite: { id: string; name: string; slug: string } | null;
  activeSite: { id: string; name: string; slug: string } | null;
};

function getInitials(name: string | null | undefined, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
    }
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

type UserMenuProps = {
  onLogout?: () => void | Promise<void>;
  className?: string;
};

export function UserMenu({ onLogout, className }: UserMenuProps) {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<MeProfile | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      setProfile(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const res = await fetch("/api/me");
      if (!res.ok || cancelled) return;
      const data = await res.json();
      if (!cancelled) setProfile(data.user ?? null);
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id, session?.user?.activeSiteId]);

  if (status !== "authenticated" || !session?.user?.email) return null;

  const email = session.user.email;
  const name = session.user.name ?? profile?.name ?? null;
  const role = session.user.role ?? profile?.role;
  const initials = getInitials(name, email);
  const displayName = name?.trim() || email.split("@")[0];

  async function handleLogout() {
    if (onLogout) {
      await onLogout();
      return;
    }
    signOut({ callbackUrl: "/" });
  }

  const homeSiteName = profile?.homeSite?.name;
  const activeSiteName = profile?.activeSite?.name;
  const showActiveSite =
    profile?.activeSiteId &&
    profile?.siteId &&
    profile.activeSiteId !== profile.siteId &&
    activeSiteName;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon-lg"
            className={cn("rounded-full", className)}
            aria-label="Account menu"
          />
        }
      >
        <span className="text-xs font-semibold">{initials}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5 px-0.5 py-1">
            <span className="text-sm font-medium text-foreground">{displayName}</span>
            <span className="text-xs font-normal text-muted-foreground">{email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Role:</span>{" "}
            {ROLE_LABELS[role ?? ""] ?? role ?? "—"}
          </p>
          {homeSiteName ? (
            <p className="mt-1">
              <span className="font-medium text-foreground">Site:</span> {homeSiteName}
            </p>
          ) : null}
          {showActiveSite ? (
            <p className="mt-1">
              <span className="font-medium text-foreground">Active site:</span> {activeSiteName}
            </p>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="gap-2" onClick={() => void handleLogout()}>
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
