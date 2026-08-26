"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not send reset email");
        return;
      }

      setSuccess(
        data.message ??
          "If an account exists for that email, a password reset link has been sent.",
      );
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
          <CardTitle className="text-xl sm:text-2xl">Forgot password</CardTitle>
          <CardDescription>
            Enter your email and we will send a reset link if an account exists.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base sm:text-lg"
                autoFocus
                autoComplete="email"
                required
                disabled={Boolean(success)}
              />
            </div>
            <Button
              type="submit"
              className="h-12 w-full text-base sm:text-lg"
              disabled={loading || Boolean(success)}
            >
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/register?mode=login" className="underline underline-offset-2">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
