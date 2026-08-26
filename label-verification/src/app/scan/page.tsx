"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { ShipmentDialog } from "@/components/scan/shipment-dialog";
import { LargeQrDialog } from "@/components/scan/large-qr-dialog";
import { AdminPinDialog } from "@/components/scan/admin-pin-dialog";
import {
  AppHeader,
  HeaderNavLink,
} from "@/components/app-header";
import { ResponsiveTable } from "@/components/responsive-table";
import { useLockHeartbeat, useReleaseLockOnUnload } from "@/hooks/use-shipment-lock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  validateSmallQrPair,
  extractPartNumber,
  normalizeScanInput,
} from "@/lib/barcode";

type ScanRecord = {
  id: string;
  palletIndex: number;
  pnOrig: string;
  pnNew: string;
  result: string;
  createdAt: string;
  user: { email: string; name: string | null };
};

type ShipmentData = {
  id: string;
  shipmentNumber: number;
  status: string;
  totalPallets: number;
  scannedPallets: number;
  scans: ScanRecord[];
  lockedBy?: { email: string; name: string | null } | null;
};

export default function ScanPage() {
  const { data: session } = useSession();
  const [dialogOpen, setDialogOpen] = useState(true);
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [qrOrig, setQrOrig] = useState("");
  const [qrNew, setQrNew] = useState("");
  const [largeQrOpen, setLargeQrOpen] = useState(false);
  const [pendingScans, setPendingScans] = useState<{ orig: string; new: string; pn: string } | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pendingLargeScans, setPendingLargeScans] = useState<[string, string, string, string] | null>(null);
  const [pendingMessage, setPendingMessage] = useState("");

  const origRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLInputElement>(null);

  const lockEnabled = !!shipment && shipment.status === "IN_PROGRESS" && !viewOnly;
  useLockHeartbeat(shipment?.shipmentNumber ?? null, lockEnabled);
  useReleaseLockOnUnload(shipment?.shipmentNumber ?? null, lockEnabled);

  function handleStart(shipmentNumber: number, _totalPallets: number, mode: string) {
    fetch(`/api/shipments/${shipmentNumber}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.shipment) {
          setShipment(data.shipment);
          const readOnly =
            mode === "complete" || data.shipment.status === "COMPLETE";
          setViewOnly(readOnly);
          setDialogOpen(false);
          if (!readOnly) {
            setTimeout(() => origRef.current?.focus(), 100);
          }
        }
      });
  }

  useEffect(() => {
    if (shipment && !viewOnly) {
      origRef.current?.focus();
    }
  }, [shipment, viewOnly]);

  async function checkDuplicate(code: string) {
    const res = await fetch(`/api/scans?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    return data.exists as boolean;
  }

  async function handleOrigBlur() {
    const code = normalizeScanInput(qrOrig);
    if (!code) return;
    const exists = await checkDuplicate(code);
    if (exists) {
      toast.error("Scan already in database");
      setQrOrig("");
      origRef.current?.focus();
    }
  }

  async function handleNewBlur() {
    const code = normalizeScanInput(qrNew);
    if (!code) return;
    const exists = await checkDuplicate(code);
    if (exists) {
      toast.error("Scan already in database");
      setQrNew("");
      newRef.current?.focus();
    }
  }

  async function handleNext() {
    const orig = normalizeScanInput(qrOrig);
    const portal = normalizeScanInput(qrNew);
    const result = validateSmallQrPair(orig, portal);

    if (!result.valid) {
      toast.error(result.message);
      origRef.current?.focus();
      return;
    }

    const [origExists, portalExists] = await Promise.all([
      checkDuplicate(orig),
      checkDuplicate(portal),
    ]);

    if (origExists) {
      toast.error("Scan already in database");
      setQrOrig("");
      origRef.current?.focus();
      return;
    }

    if (portalExists) {
      toast.error("Scan already in database");
      setQrNew("");
      newRef.current?.focus();
      return;
    }

    const pn = extractPartNumber(orig)!;
    setPendingScans({ orig, new: portal, pn });
    setLargeQrOpen(true);
  }

  async function submitScan(
    largeScans: [string, string, string, string],
    message: string,
    userUnblock?: string,
  ) {
    if (!shipment || !pendingScans) return;

    const res = await fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipmentNumber: shipment.shipmentNumber,
        qrOrig: pendingScans.orig,
        qrNew: pendingScans.new,
        scan1: largeScans[0],
        scan2: largeScans[1],
        scan3: largeScans[2],
        scan4: largeScans[3],
        userUnblock,
      }),
    });

    const data = await res.json();

    if (res.status === 409) {
      setPendingLargeScans(largeScans);
      setPendingMessage(message);
      setPinOpen(true);
      setLargeQrOpen(false);
      return;
    }

    if (!res.ok) {
      toast.error(data.error ?? "Failed to save scan");
      return;
    }

    toast.success(message);
    setQrOrig("");
    setQrNew("");
    setPendingScans(null);
    setLargeQrOpen(false);
    setShipment(data.shipment);

    if (data.complete) {
      toast.success("Scanning complete! You can download or email the report.");
      setViewOnly(true);
    } else {
      origRef.current?.focus();
    }
  }

  function handlePinApproved(adminEmail: string) {
    if (pendingLargeScans && pendingMessage) {
      submitScan(pendingLargeScans, pendingMessage, adminEmail);
      setPendingLargeScans(null);
      setPendingMessage("");
    }
  }

  async function downloadPdf() {
    if (!shipment) return;
    window.open(`/api/reports/${shipment.shipmentNumber}/pdf`, "_blank");
  }

  async function emailPdf() {
    if (!shipment) return;
    const res = await fetch(`/api/reports/${shipment.shipmentNumber}/email`, { method: "POST" });
    if (res.ok) {
      toast.success("Email sent");
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to send email");
    }
  }

  async function handleLogout() {
    if (shipment && lockEnabled) {
      await fetch(`/api/shipments/${shipment.shipmentNumber}/lock`, { method: "DELETE" });
    }
    signOut({ callbackUrl: "/" });
  }

  async function handleCancelScan() {
    if (shipment && lockEnabled) {
      // Abandon in-progress work so partial pallets don't linger in recent scans
      // and the next start with the same number is a clean create (no false re-do).
      const abandonRes = await fetch(`/api/shipments/${shipment.shipmentNumber}/abandon`, {
        method: "POST",
      });
      if (!abandonRes.ok) {
        // Fall back to releasing the lock if abandon fails (e.g. already complete).
        await fetch(`/api/shipments/${shipment.shipmentNumber}/lock`, { method: "DELETE" });
      }
    }
    setShipment(null);
    setViewOnly(false);
    setQrOrig("");
    setQrNew("");
    setPendingScans(null);
    setLargeQrOpen(false);
    setPinOpen(false);
    setPendingLargeScans(null);
    setPendingMessage("");
    setDialogOpen(true);
  }

  const progress = shipment
    ? Math.round((shipment.scannedPallets / shipment.totalPallets) * 100)
    : 0;

  return (
    <div className="app-page">
      <AppHeader
        title="Scan Compare"
        subtitle={session?.user?.email}
        onLogout={handleLogout}
        actions={
          <>
            {(session?.user?.role === "SITE_ADMIN" || session?.user?.role === "SUPERADMIN") && (
              <HeaderNavLink href="/admin">Admin</HeaderNavLink>
            )}
          </>
        }
      />

      <main className="app-main max-w-5xl">
        {!shipment && !dialogOpen && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <p className="text-center text-muted-foreground">
                Enter a shipment number to begin scanning.
              </p>
              <Button className="h-12 w-full max-w-xs text-base" onClick={() => setDialogOpen(true)}>
                Start Scan
              </Button>
            </CardContent>
          </Card>
        )}

        {shipment && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg">
                    Shipment {shipment.shipmentNumber}
                  </CardTitle>
                  <Badge variant={shipment.status === "COMPLETE" ? "default" : "secondary"}>
                    {shipment.status === "COMPLETE" ? "Complete" : "In Progress"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Pallets: {shipment.scannedPallets} / {shipment.totalPallets}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </CardContent>
            </Card>

            {!viewOnly && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Scan Small QR Codes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Original Label (small QR)</Label>
                    <Input
                      ref={origRef}
                      value={qrOrig}
                      onChange={(e) => setQrOrig(e.target.value)}
                      onBlur={handleOrigBlur}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => e.key === "Enter" && newRef.current?.focus()}
                      inputMode="text"
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className="h-12 text-base font-mono sm:text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Portal Label (small QR)</Label>
                    <Input
                      ref={newRef}
                      value={qrNew}
                      onChange={(e) => setQrNew(e.target.value)}
                      onBlur={handleNewBlur}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => e.key === "Enter" && handleNext()}
                      inputMode="text"
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className="h-12 text-base font-mono sm:text-lg"
                    />
                  </div>
                  <Button onClick={handleNext} className="h-12 w-full text-base sm:text-lg">
                    Next — Scan Large Labels
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelScan}
                    className="h-12 w-full text-base"
                  >
                    Cancel Current Scan
                  </Button>
                </CardContent>
              </Card>
            )}

            {(viewOnly || shipment.status === "COMPLETE") && (
              <Card>
                <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap">
                  <Button onClick={downloadPdf} className="h-12 flex-1">Download PDF</Button>
                  <Button onClick={emailPdf} variant="outline" className="h-12 flex-1">Email PDF</Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancelScan}
                    className="h-12 w-full sm:w-auto sm:flex-none"
                  >
                    Start New Scan
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Scan History</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>PN Orig</TableHead>
                        <TableHead>PN New</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipment.scans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No scans yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        shipment.scans.map((scan) => (
                          <TableRow key={scan.id}>
                            <TableCell>{scan.palletIndex}</TableCell>
                            <TableCell className="font-mono text-xs">{scan.pnOrig}</TableCell>
                            <TableCell className="font-mono text-xs">{scan.pnNew}</TableCell>
                            <TableCell className="text-xs">{scan.result}</TableCell>
                            <TableCell className="text-xs">{scan.user?.name ?? scan.user?.email ?? "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                nativeButton={false}
                                render={
                                  <Link
                                    href={`/shipments/${shipment.shipmentNumber}?pallet=${scan.palletIndex}`}
                                  />
                                }
                              >
                                View details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <ShipmentDialog
        open={dialogOpen && !shipment}
        onOpenChange={setDialogOpen}
        onStart={handleStart}
      />

      <LargeQrDialog
        key={`${shipment?.id ?? "none"}-${shipment?.scannedPallets ?? 0}`}
        open={largeQrOpen}
        partNumber={pendingScans?.pn ?? ""}
        scannedPallets={shipment?.scannedPallets ?? 0}
        totalPallets={shipment?.totalPallets ?? 0}
        onClose={() => setLargeQrOpen(false)}
        onSuccess={(scans, message) => submitScan(scans, message)}
      />

      <AdminPinDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        onApproved={handlePinApproved}
      />
    </div>
  );
}
