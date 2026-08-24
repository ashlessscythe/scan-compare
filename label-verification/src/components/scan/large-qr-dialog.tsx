"use client";

import { useRef, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { validateLargeQrScans, normalizeScanInput } from "@/lib/barcode";

type LargeQrDialogProps = {
  open: boolean;
  partNumber: string;
  onClose: () => void;
  onSuccess: (scans: [string, string, string, string], message: string) => void;
};

const LABELS = ["A", "B", "C", "D"];

export function LargeQrDialog({ open, partNumber, onClose, onSuccess }: LargeQrDialogProps) {
  const [scans, setScans] = useState(["", "", "", ""]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  function updateScan(index: number, value: string) {
    const next = [...scans];
    next[index] = value;
    setScans(next);
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.select();
  }

  function validateAndSubmit() {
    const normalized = scans.map(normalizeScanInput) as [string, string, string, string];
    const result = validateLargeQrScans(normalized);
    setMessage(result.message);
    setError(!result.valid);

    if (result.valid) {
      onSuccess(normalized, result.message);
      setScans(["", "", "", ""]);
      setMessage("");
      setError(false);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (index < 3) {
        refs[index + 1].current?.focus();
      } else {
        validateAndSubmit();
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scan New Labels</DialogTitle>
          <DialogDescription>
            Scan large QR codes for portal labels A, B, C, and D
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Badge variant="secondary" className="text-sm">Part Number: {partNumber}</Badge>
          {LABELS.map((label, i) => (
            <div key={label} className="space-y-1">
              <Label>Label {label}</Label>
              <Input
                ref={refs[i]}
                value={scans[i]}
                onChange={(e) => updateScan(i, e.target.value)}
                onFocus={handleFocus}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 font-mono text-base sm:text-lg"
                autoFocus={i === 0}
                inputMode="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
          ))}
          {message && (
            <Alert variant={error ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} className="h-11 w-full sm:w-auto">Cancel</Button>
          <Button onClick={validateAndSubmit} className="h-11 w-full sm:w-auto">Verify Labels</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
