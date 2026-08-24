"use client";

import { useEffect } from "react";

export function useLockHeartbeat(shipmentNumber: number | null, enabled: boolean) {
  useEffect(() => {
    if (!shipmentNumber || !enabled) return;

    const ping = () => {
      fetch(`/api/shipments/${shipmentNumber}/heartbeat`, { method: "PATCH" }).catch(() => {});
    };

    ping();
    const interval = setInterval(ping, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [shipmentNumber, enabled]);
}

export function useReleaseLockOnUnload(shipmentNumber: number | null, enabled: boolean) {
  useEffect(() => {
    if (!shipmentNumber || !enabled) return;

    const release = () => {
      navigator.sendBeacon?.(`/api/shipments/${shipmentNumber}/lock`, "");
      fetch(`/api/shipments/${shipmentNumber}/lock`, { method: "DELETE", keepalive: true }).catch(
        () => {},
      );
    };

    window.addEventListener("beforeunload", release);
    return () => window.removeEventListener("beforeunload", release);
  }, [shipmentNumber, enabled]);
}
