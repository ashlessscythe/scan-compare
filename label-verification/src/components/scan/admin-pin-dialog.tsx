"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AdminPinDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApproved: (adminEmail: string) => void;
};

export function AdminPinDialog({ open, onOpenChange, onApproved }: AdminPinDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function verify() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Invalid PIN");
      return;
    }

    onApproved(data.approvedBy);
    setPin("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Admin PIN Required</DialogTitle>
          <DialogDescription>
            Duplicate scan detected. Enter admin PIN to override.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="pin">Admin PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              className="text-lg h-12 text-center tracking-widest"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={verify} disabled={loading || pin.length < 4}>
            {loading ? "Verifying..." : "Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
