"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isSuperAdminRole } from "@/lib/roles";

type SiteOption = {
  id: string;
  name: string;
  slug: string;
};

export function SiteSwitcher({ className }: { className?: string }) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [loading, setLoading] = useState(false);

  const isSuperAdmin = isSuperAdminRole(session?.user?.role);
  const activeSiteId = session?.user?.activeSiteId;

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;

    async function loadSites() {
      const res = await fetch("/api/sites");
      if (!res.ok || cancelled) return;
      const data = await res.json();
      if (!cancelled) setSites(data.sites ?? []);
    }

    void loadSites();
    window.addEventListener("sites-updated", loadSites);
    return () => {
      cancelled = true;
      window.removeEventListener("sites-updated", loadSites);
    };
  }, [isSuperAdmin]);

  if (!isSuperAdmin || sites.length === 0) return null;

  async function onChange(nextSiteId: string) {
    if (!nextSiteId || nextSiteId === activeSiteId) return;
    setLoading(true);
    try {
      await update({ activeSiteId: nextSiteId });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className={className ?? "flex items-center gap-2"}>
      <select
        className="flex h-9 max-w-[12rem] rounded-md border border-input bg-background px-2 text-sm disabled:opacity-60"
        value={activeSiteId ?? ""}
        disabled={loading}
        onChange={(e) => void onChange(e.target.value)}
        aria-label="Active site"
      >
        {sites.map((site) => (
          <option key={site.id} value={site.id}>
            {site.name}
          </option>
        ))}
      </select>
    </label>
  );
}
