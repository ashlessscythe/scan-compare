"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import {
  AppHeader,
  HeaderLogoutButton,
  HeaderNavLink,
} from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ScanDetail = {
  id: string;
  palletIndex: number;
  qrOrig: string;
  qrNew: string;
  pnOrig: string;
  pnNew: string;
  scan1: string;
  scan2: string;
  scan3: string;
  scan4: string;
  result: string;
  userUnblock: string | null;
  createdAt: string;
  user: { email: string; name: string | null } | null;
};

type ShipmentDetail = {
  id: string;
  shipmentNumber: number;
  status: string;
  totalPallets: number;
  scannedPallets: number;
  createdAt: string;
  completedAt: string | null;
  scans: ScanDetail[];
};

function BarcodeField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="break-all rounded-md bg-muted/50 px-2 py-1.5 font-mono text-xs leading-relaxed">
        {value || "—"}
      </p>
    </div>
  );
}

function ShipmentDetailContent() {
  const { data: session } = useSession();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const highlightPallet = Number(searchParams.get("pallet") ?? 0) || null;

  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);

  const isAdmin =
    session?.user?.role === "SITE_ADMIN" || session?.user?.role === "SUPERADMIN";
  const shipmentNumber = Number(params.id);

  const load = useCallback(async () => {
    if (!shipmentNumber) {
      setError("Invalid shipment number");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const res = await fetch(`/api/shipments/${shipmentNumber}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Shipment not found");
      setShipment(null);
    } else {
      setShipment(data.shipment);
    }
    setLoading(false);
  }, [shipmentNumber]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!highlightPallet || !shipment) return;
    const el = document.getElementById(`pallet-${highlightPallet}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [highlightPallet, shipment]);

  async function downloadPdf() {
    window.open(`/api/reports/${shipmentNumber}/pdf`, "_blank");
  }

  async function resendEmail() {
    setEmailSending(true);
    const res = await fetch(`/api/reports/${shipmentNumber}/email`, { method: "POST" });
    setEmailSending(false);
    if (res.ok) {
      toast.success("Report email sent");
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to send email");
    }
  }

  const progress = shipment
    ? Math.round((shipment.scannedPallets / shipment.totalPallets) * 100)
    : 0;

  return (
    <div className="app-page">
      <AppHeader
        title="Shipment Details"
        subtitle={
          shipment
            ? `Shipment ${shipment.shipmentNumber}`
            : session?.user?.email
        }
        actions={
          <>
            <HeaderNavLink href="/scan">Scan</HeaderNavLink>
            {isAdmin && <HeaderNavLink href="/admin">Admin</HeaderNavLink>}
            <HeaderLogoutButton onClick={() => signOut({ callbackUrl: "/" })} />
          </>
        }
      />

      <main className="app-main max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={isAdmin ? "/admin" : "/scan"} />}
          >
            Back
          </Button>
        </div>

        {loading && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading shipment…
            </CardContent>
          </Card>
        )}

        {error && !loading && (
          <Card>
            <CardContent className="py-8 text-center text-destructive">{error}</CardContent>
          </Card>
        )}

        {shipment && !loading && (
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
                  <span>
                    Pallets: {shipment.scannedPallets} / {shipment.totalPallets}
                  </span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Started: </span>
                    {new Date(shipment.createdAt).toLocaleString()}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Completed: </span>
                    {shipment.completedAt
                      ? new Date(shipment.completedAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Read-only view — scan records cannot be edited.
                </p>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Report actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={downloadPdf} className="h-11 flex-1">
                    Download PDF
                  </Button>
                  <Button
                    onClick={resendEmail}
                    variant="outline"
                    className="h-11 flex-1"
                    disabled={emailSending}
                  >
                    {emailSending ? "Sending…" : "Resend email"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <h2 className="text-base font-semibold sm:text-lg">Pallet scans</h2>
              {shipment.scans.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    No scans recorded yet
                  </CardContent>
                </Card>
              ) : (
                shipment.scans.map((scan) => (
                  <Card
                    key={scan.id}
                    id={`pallet-${scan.palletIndex}`}
                    className={cn(
                      highlightPallet === scan.palletIndex &&
                        "ring-2 ring-primary/60",
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <CardTitle className="text-base">
                          Pallet {scan.palletIndex}
                        </CardTitle>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{new Date(scan.createdAt).toLocaleString()}</p>
                          <p>{scan.user?.name ?? scan.user?.email ?? "—"}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Result</p>
                        <p className="text-sm">{scan.result}</p>
                        {scan.userUnblock ? (
                          <p className="text-xs text-muted-foreground">
                            Admin override by {scan.userUnblock}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <BarcodeField label="PN Orig" value={scan.pnOrig} />
                        <BarcodeField label="PN New" value={scan.pnNew} />
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-medium">Small QR codes</p>
                        <BarcodeField label="Original label" value={scan.qrOrig} />
                        <BarcodeField label="Portal label" value={scan.qrNew} />
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-medium">Large QR codes (A–D)</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <BarcodeField label="Label A" value={scan.scan1} />
                          <BarcodeField label="Label B" value={scan.scan2} />
                          <BarcodeField label="Label C" value={scan.scan3} />
                          <BarcodeField label="Label D" value={scan.scan4} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function ShipmentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="app-page">
          <main className="app-main max-w-5xl">
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading shipment…
              </CardContent>
            </Card>
          </main>
        </div>
      }
    >
      <ShipmentDetailContent />
    </Suspense>
  );
}
