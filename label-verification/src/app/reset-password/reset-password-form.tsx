"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("This reset link is missing a token. Request a new link and try again.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not reset password");
        return;
      }

      setSuccess(data.message ?? "Password updated. You can sign in now.");
      window.setTimeout(() => {
        router.push("/register?mode=login");
        router.refresh();
      }, 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4">
      <div className="absolute top-3 right-3 flex items-center gap-2 sm:top-4 sm:right-4">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3 text-sm")}
        >
          Home
        </Link>
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl">Reset password</CardTitle>
          <CardDescription>
            Choose a new password for your account. Links expire after one hour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  This reset link is invalid. Request a new password reset email.
                </AlertDescription>
              </Alert>
              <Link
                href="/forgot-password"
                className={cn(buttonVariants(), "flex h-12 w-full items-center justify-center text-base sm:text-lg")}
              >
                Request a new link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base sm:text-lg"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  autoFocus
                  disabled={Boolean(success)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 text-base sm:text-lg"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={Boolean(success)}
                />
              </div>
              <Button
                type="submit"
                className="h-12 w-full text-base sm:text-lg"
                disabled={loading || Boolean(success)}
              >
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/register?mode=login" className="underline underline-offset-2">
              Back to log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
