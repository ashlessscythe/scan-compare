"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
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

type ShipmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (shipmentNumber: number, totalPallets: number, mode: string) => void;
};

type ConfirmStep = null | "redo" | "warn";

export function ShipmentDialog({ open, onOpenChange, onStart }: ShipmentDialogProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [shipmentNumber, setShipmentNumber] = useState("");
  const [totalPallets, setTotalPallets] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmStep, setConfirmStep] = useState<ConfirmStep>(null);
  const [operatorBlocked, setOperatorBlocked] = useState(false);

  function alreadyScannedMessage(num: string | number) {
    return `Shipment ${num} has already been scanned. Please ask an admin for assistance.`;
  }

  async function checkAndStart() {
    setError("");
    setOperatorBlocked(false);

    const num = Number(shipmentNumber);
    const pallets = Number(totalPallets);

    if (!num || !pallets) {
      setError("Shipment number and pallet count are required");
      return;
    }

    setLoading(true);
    try {
      const lookup = await fetch(`/api/shipments?shipmentNumber=${num}`);
      const lookupData = await lookup.json();

      if (lookupData.status && lookupData.status !== "none") {
        if (!isAdmin) {
          setError(alreadyScannedMessage(num));
          setOperatorBlocked(true);
          return;
        }
        if (lookupData.shipment?.totalPallets && !totalPallets) {
          setTotalPallets(String(lookupData.shipment.totalPallets));
        }
        setConfirmStep("redo");
        return;
      }

      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentNumber: num, totalPallets: pallets }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          if (!isAdmin) {
            setError(alreadyScannedMessage(num));
            setOperatorBlocked(true);
          } else {
            setConfirmStep("redo");
          }
          return;
        }
        setError(data.error ?? "Failed to start shipment");
        return;
      }

      onStart(num, pallets, data.mode);
      onOpenChange(false);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset() {
    const num = Number(shipmentNumber);
    const pallets = Number(totalPallets);

    if (!num || !pallets) {
      setError("Shipment number and pallet count are required");
      setConfirmStep(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/shipments/${num}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalPallets: pallets }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to reset shipment");
        setConfirmStep(null);
        return;
      }

      setConfirmStep(null);
      onStart(num, pallets, data.mode ?? "start");
      onOpenChange(false);
    } catch {
      setError("Network error");
      setConfirmStep(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleShipmentBlur() {
    if (!shipmentNumber) return;
    const num = Number(shipmentNumber);
    if (!num) return;

    const res = await fetch(`/api/shipments?shipmentNumber=${num}`);
    const data = await res.json();

    if (data.status && data.status !== "none") {
      if (data.shipment?.totalPallets) {
        setTotalPallets(String(data.shipment.totalPallets));
      }
      if (!isAdmin) {
        setError(alreadyScannedMessage(num));
        setOperatorBlocked(true);
      } else {
        setError(`Shipment ${num} has already been scanned.`);
        setOperatorBlocked(false);
      }
    } else {
      setError("");
      setOperatorBlocked(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setConfirmStep(null);
    }
    onOpenChange(next);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Scan</DialogTitle>
            <DialogDescription>Enter shipment number and pallet count</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="shipment">Shipment Number</Label>
              <Input
                id="shipment"
                value={shipmentNumber}
                onChange={(e) => {
                  setShipmentNumber(e.target.value);
                  setOperatorBlocked(false);
                  setError("");
                }}
                onBlur={handleShipmentBlur}
                onKeyDown={(e) => e.key === "Enter" && document.getElementById("pallets")?.focus()}
                className="text-lg h-12"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pallets">Pallet Count</Label>
              <Input
                id="pallets"
                type="number"
                min={1}
                value={totalPallets}
                onChange={(e) => setTotalPallets(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !operatorBlocked && checkAndStart()}
                className="text-lg h-12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={checkAndStart}
              disabled={loading || operatorBlocked}
              className="w-full h-12"
            >
              {loading ? "Starting..." : "Start Scanning"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmStep === "redo"}
        onOpenChange={(v) => !v && setConfirmStep(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Shipment Already Scanned</DialogTitle>
            <DialogDescription>
              Shipment {shipmentNumber} has already been scanned. Do you want to re-do?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setConfirmStep(null)}>
              No
            </Button>
            <Button onClick={() => setConfirmStep("warn")}>Yes, re-do</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmStep === "warn"}
        onOpenChange={(v) => !v && setConfirmStep("redo")}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Reset</DialogTitle>
            <DialogDescription className="text-destructive font-medium">
              This will clear all existing scans for this shipment. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setConfirmStep("redo")} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReset} disabled={loading}>
              {loading ? "Resetting..." : "Yes, clear and re-do"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
