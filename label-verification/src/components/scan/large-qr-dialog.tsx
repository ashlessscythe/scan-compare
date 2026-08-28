"use client";

import { useEffect, useRef, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { validateLargeQrScans, normalizeScanInput } from "@/lib/barcode";

type LargeQrDialogProps = {
  open: boolean;
  partNumber: string;
  scannedPallets: number;
  totalPallets: number;
  onClose: () => void;
  onSuccess: (scans: [string, string, string, string], message: string) => void;
};

const LABELS = ["A", "B", "C", "D"];

export function LargeQrDialog({
  open,
  partNumber,
  scannedPallets,
  totalPallets,
  onClose,
  onSuccess,
}: LargeQrDialogProps) {
  const [scans, setScans] = useState(["", "", "", ""]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [duplicateWarn, setDuplicateWarn] = useState("");
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const refs = [ref0, ref1, ref2, ref3];

  const remaining = Math.max(totalPallets - scannedPallets, 0);
  const progress =
    totalPallets > 0 ? Math.round((scannedPallets / totalPallets) * 100) : 0;

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => ref0.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open, ref0]);

  function updateScan(index: number, value: string) {
    const next = [...scans];
    next[index] = value;
    setScans(next);
    if (index === 0 && duplicateWarn) {
      setDuplicateWarn("");
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.select();
  }

  function focusAndSelect(index: number) {
    const el = refs[index].current;
    if (!el) return;
    el.focus();
    el.select();
  }

  async function checkDuplicateLabel(code: string): Promise<string | null> {
    const normalized = normalizeScanInput(code);
    if (!normalized) return null;

    const res = await fetch(`/api/scans?code=${encodeURIComponent(normalized)}`);
    const data = await res.json();
    if (!data.exists || data.kind !== "large") return null;

    if (data.shipmentStatus === "COMPLETE") {
      return `Already saved on shipment ${data.shipmentNumber}. Do not rescan this set.`;
    }
    return `Already scanned on shipment ${data.shipmentNumber} (pallet ${data.palletIndex}). Do not rescan this set.`;
  }

  async function warnIfDuplicateInitial() {
    const warn = await checkDuplicateLabel(scans[0]);
    setDuplicateWarn(warn ?? "");
    if (warn) {
      requestAnimationFrame(() => focusAndSelect(0));
    }
    return warn;
  }

  async function validateAndSubmit(fromIndex = 0) {
    const normalized = scans.map(normalizeScanInput) as [string, string, string, string];
    const result = validateLargeQrScans(normalized);
    setMessage(result.message);
    setError(!result.valid);

    if (!result.valid) {
      requestAnimationFrame(() => focusAndSelect(fromIndex));
      return;
    }

    let warnIndex = -1;
    let warn: string | null = null;
    for (let i = 0; i < 4; i++) {
      warn = await checkDuplicateLabel(normalized[i]);
      if (warn) {
        warnIndex = i;
        break;
      }
    }

    if (warn) {
      setDuplicateWarn(warn);
      setMessage(warn);
      setError(true);
      requestAnimationFrame(() => focusAndSelect(warnIndex >= 0 ? warnIndex : 0));
      return;
    }

    onSuccess(normalized, result.message);
  }

  async function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;

    if (index === 0) {
      const warn = await warnIfDuplicateInitial();
      if (warn) return;
    }

    if (index < 3) {
      refs[index + 1].current?.focus();
    } else {
      await validateAndSubmit(index);
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
          <div className="space-y-2 rounded-md border bg-muted/40 p-3">
            <div className="flex justify-between text-sm">
              <span>
                Pallets: {scannedPallets} / {totalPallets}
                {remaining > 0 ? ` · ${remaining} remaining` : ""}
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <Badge variant="secondary" className="text-sm">
            Part Number: {partNumber}
          </Badge>
          {LABELS.map((label, i) => (
            <div key={label} className="space-y-1">
              <Label>Label {label}</Label>
              <Input
                ref={refs[i]}
                value={scans[i]}
                onChange={(e) => updateScan(i, e.target.value)}
                onFocus={handleFocus}
                onBlur={() => {
                  if (i === 0) void warnIfDuplicateInitial();
                }}
                onKeyDown={(e) => void handleKeyDown(i, e)}
                className="h-12 font-mono text-base sm:text-lg"
                aria-invalid={!!duplicateWarn && i === 0 ? true : undefined}
                autoFocus={i === 0}
                inputMode="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
          ))}
          {duplicateWarn && (
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{duplicateWarn}</p>
          )}
          {message && (
            <Alert variant={error ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} className="h-11 w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={() => void validateAndSubmit(0)}
            className="h-11 w-full sm:w-auto"
            disabled={!!duplicateWarn}
          >
            Verify Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
