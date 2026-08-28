"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";

type AccountStatus = {
  role: string;
  siteName: string;
  isApproved: boolean;
  requiresSignIn: boolean;
};

const POLL_INTERVAL_MS = 5000;

export function PendingStatus() {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [loadingSignIn, setLoadingSignIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/auth/account-status");
        if (!res.ok) return;
        const data = (await res.json()) as AccountStatus;
        if (!cancelled) {
          setStatus(data);
        }
      } catch {
        // Ignore transient network errors during polling.
      }
    }

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function handleSignIn() {
    setLoadingSignIn(true);
    await signOut({ callbackUrl: "/register?mode=login&reason=approved" });
  }

  const isApproved = status?.isApproved ?? false;

  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4">
      <div className="absolute top-3 right-3 flex items-center gap-2 sm:top-4 sm:right-4">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3 text-sm")}
        >
          Home
        </Link>
        <UserMenu />
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isApproved ? (
            <>
              <CardTitle className="text-xl sm:text-2xl">You&apos;re approved</CardTitle>
              <CardDescription>
                Your account has been approved for{" "}
                <span className="font-medium text-foreground">{status?.siteName}</span>.
                Sign in again to start using the app.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-xl sm:text-2xl">Awaiting approval</CardTitle>
              <CardDescription>
                Your account is pending review. A site admin will approve your access
                before you can start scanning.
              </CardDescription>
            </>
          )}
        </CardHeader>
        {isApproved && (
          <CardContent className="flex justify-center pb-6">
            <Button onClick={() => void handleSignIn()} disabled={loadingSignIn}>
              {loadingSignIn ? "Redirecting…" : "Sign in"}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
