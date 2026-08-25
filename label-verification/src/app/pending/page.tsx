"use client";

import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";

export default function PendingPage() {
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
          <CardTitle className="text-xl sm:text-2xl">Awaiting approval</CardTitle>
          <CardDescription>
            Your account is pending review. A site admin will approve your access
            before you can start scanning.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
