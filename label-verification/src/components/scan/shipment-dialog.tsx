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

type ShipmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (shipmentNumber: number, totalPallets: number, mode: string) => void;
};

export function ShipmentDialog({ open, onOpenChange, onStart }: ShipmentDialogProps) {
  const [shipmentNumber, setShipmentNumber] = useState("");
  const [totalPallets, setTotalPallets] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkAndStart() {
    setError("");
    setLoading(true);

    const num = Number(shipmentNumber);
    const pallets = Number(totalPallets);

    if (!num || !pallets) {
      setError("Shipment number and pallet count are required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentNumber: num, totalPallets: pallets }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to start shipment");
        setLoading(false);
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

  async function handleShipmentBlur() {
    if (!shipmentNumber) return;
    const res = await fetch(`/api/shipments?shipmentNumber=${shipmentNumber}`);
    const data = await res.json();

    if (data.status === "complete") {
      setError(`Shipment ${shipmentNumber} is already completed.`);
    } else if (data.status === "IN_PROGRESS") {
      setError(`Shipment ${shipmentNumber} is in progress. Enter pallet count to continue.`);
      if (data.shipment?.totalPallets) {
        setTotalPallets(String(data.shipment.totalPallets));
      }
    } else {
      setError("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Scan</DialogTitle>
          <DialogDescription>Enter shipment number and pallet count</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <Alert variant={error.includes("completed") ? "default" : "destructive"}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="shipment">Shipment Number</Label>
            <Input
              id="shipment"
              value={shipmentNumber}
              onChange={(e) => setShipmentNumber(e.target.value)}
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
              onKeyDown={(e) => e.key === "Enter" && checkAndStart()}
              className="text-lg h-12"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={checkAndStart} disabled={loading} className="w-full h-12">
            {loading ? "Starting..." : "Start Scanning"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
