"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AppHeader,
  HeaderMenuButton,
  HeaderNavLink,
} from "@/components/app-header";
import { ResponsiveTable } from "@/components/responsive-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { isSuperAdminRole } from "@/lib/roles";

const ADMIN_SECTIONS = [
  { value: "dashboard", label: "Dashboard" },
  { value: "users", label: "Users" },
  { value: "settings", label: "Settings" },
  { value: "locks", label: "Locks" },
] as const;

type AdminSection = (typeof ADMIN_SECTIONS)[number]["value"];
type AssignableRole = "PENDING" | "OPERATOR" | "SITE_ADMIN" | "SUPERADMIN";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  enabled: boolean;
  lastLogin: string | null;
  siteId: string;
};

type Site = {
  id: string;
  name: string;
  slug: string;
};

type Dashboard = {
  stats: { activeShipments: number; lockedCount: number; userCount: number };
  lockedShipments: Array<{
    id: string;
    shipmentNumber: number;
    lockedAt: string | null;
    lockedBy: { email: string; name: string | null } | null;
  }>;
  recentScans: Array<{
    id: string;
    palletIndex: number;
    createdAt: string;
    shipment: { shipmentNumber: number };
    user: { email: string; name: string | null };
  }>;
};

type Settings = {
  emailFromName: string;
  emailFromAddress: string;
  emailCcList: string[];
  lockTimeoutMinutes: number;
};

export default function AdminPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isSuperAdmin = isSuperAdminRole(session?.user?.role);
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AssignableRole>("OPERATOR");
  const [newSiteId, setNewSiteId] = useState("");

  const [adminPin, setAdminPin] = useState("");
  const [emailFromName, setEmailFromName] = useState("");
  const [emailFromAddress, setEmailFromAddress] = useState("");
  const [emailCcList, setEmailCcList] = useState("");
  const [lockTimeout, setLockTimeout] = useState("30");

  async function loadAll() {
    const [dashRes, usersRes, settingsRes, sitesRes] = await Promise.all([
      fetch("/api/admin/dashboard"),
      fetch("/api/admin/users"),
      fetch("/api/admin/settings"),
      isSuperAdmin ? fetch("/api/sites") : Promise.resolve(null),
    ]);
    setDashboard(await dashRes.json());
    const usersData = await usersRes.json();
    setUsers(usersData.users ?? []);
    if (sitesRes) {
      const sitesData = await sitesRes.json();
      setSites(sitesData.sites ?? []);
    }
    const settingsData = await settingsRes.json();
    const s = settingsData.settings as Settings | undefined;
    if (s) {
      setEmailFromName(s.emailFromName);
      setEmailFromAddress(s.emailFromAddress);
      setEmailCcList(s.emailCcList.join(", "));
      setLockTimeout(String(s.lockTimeoutMinutes));
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAll();
    }, 0);
    return () => clearTimeout(timer);
  }, [session?.user?.activeSiteId, isSuperAdmin]);

  useEffect(() => {
    if (session?.user?.activeSiteId) {
      setNewSiteId(session.user.activeSiteId);
    }
  }, [session?.user?.activeSiteId]);

  async function createUser() {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newEmail,
        name: newName,
        password: newPassword,
        role: newRole,
        ...(isSuperAdmin && newSiteId ? { siteId: newSiteId } : {}),
      }),
    });
    if (res.ok) {
      toast.success("User created");
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      loadAll();
    } else {
      const data = await res.json();
      toast.error(data.error);
    }
  }

  async function toggleUser(id: string, enabled: boolean) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    loadAll();
  }

  async function approveUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "OPERATOR" }),
    });
    if (res.ok) {
      toast.success("User approved as operator");
      loadAll();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Could not approve user");
    }
  }

  async function setUserRole(id: string, role: AssignableRole) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      toast.success("Role updated");
      loadAll();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Could not update role");
    }
  }

  async function setUserSite(id: string, siteId: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId }),
    });
    if (res.ok) {
      toast.success("Site updated");
      loadAll();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Could not update site");
    }
  }

  async function saveSettings() {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(adminPin ? { adminPin } : {}),
        emailFromName,
        emailFromAddress,
        emailCcList: emailCcList.split(",").map((e) => e.trim()).filter(Boolean),
        lockTimeoutMinutes: Number(lockTimeout),
      }),
    });
    if (res.ok) {
      toast.success("Settings saved");
      setAdminPin("");
      loadAll();
    } else {
      const data = await res.json();
      toast.error(data.error);
    }
  }

  async function forceRelease(shipmentNumber: number) {
    const res = await fetch(`/api/admin/locks/${shipmentNumber}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Lock released");
      loadAll();
    }
  }

  return (
    <div className="app-page">
      <AppHeader
        title="Admin Panel"
        actions={
          <>
            <HeaderNavLink href="/scan">Scan App</HeaderNavLink>
          </>
        }
        mobileMenuExtras={
          <div className="mb-2 flex flex-col gap-2 border-b pb-3">
            <p className="px-1 text-xs font-medium text-muted-foreground">Sections</p>
            {ADMIN_SECTIONS.map((item) => (
              <HeaderMenuButton
                key={item.value}
                active={section === item.value}
                onClick={() => setSection(item.value)}
              >
                {item.label}
              </HeaderMenuButton>
            ))}
          </div>
        }
      />

      <main className="app-main">
        <Tabs value={section} onValueChange={(value) => setSection(value as AdminSection)}>
          {/* Desktop / tablet: single-row horizontal tabs */}
          <div className="hidden overflow-x-auto overscroll-x-contain sm:block">
            <TabsList className="inline-flex h-9 w-max min-w-full justify-start gap-1 sm:min-w-0">
              {ADMIN_SECTIONS.map((item) => (
                <TabsTrigger key={item.value} value={item.value} className="px-3">
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Mobile: compact section picker (avoids the clipped 2×2 tab grid) */}
          <label className="flex flex-col gap-1.5 sm:hidden">
            <span className="text-xs font-medium text-muted-foreground">Section</span>
            <select
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={section}
              onChange={(e) => setSection(e.target.value as AdminSection)}
              aria-label="Admin section"
            >
              {ADMIN_SECTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <TabsContent value="dashboard" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <Card>
                <CardHeader className="pb-2"><CardDescription>Active Shipments</CardDescription></CardHeader>
                <CardContent><p className="text-3xl font-bold">{dashboard?.stats.activeShipments ?? 0}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription>Locked Shipments</CardDescription></CardHeader>
                <CardContent><p className="text-3xl font-bold">{dashboard?.stats.lockedCount ?? 0}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription>Total Users</CardDescription></CardHeader>
                <CardContent><p className="text-3xl font-bold">{dashboard?.stats.userCount ?? 0}</p></CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Recent Scans</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Shipment</TableHead>
                        <TableHead>Pallet</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard?.recentScans.map((s) => {
                        const href = `/shipments/${s.shipment.shipmentNumber}?pallet=${s.palletIndex}`;
                        return (
                          <TableRow
                            key={s.id}
                            className="cursor-pointer"
                            onClick={() => router.push(href)}
                          >
                            <TableCell>{s.shipment.shipmentNumber}</TableCell>
                            <TableCell>{s.palletIndex}</TableCell>
                            <TableCell>{s.user.name ?? s.user.email}</TableCell>
                            <TableCell>{new Date(s.createdAt).toLocaleString()}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                nativeButton={false}
                                render={<Link href={href} />}
                              >
                                View details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-4 space-y-4">
            <Card>
              <CardHeader><CardTitle>Create User</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Email</Label><Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="h-11" /></div>
                <div className="space-y-1.5"><Label>Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-11" /></div>
                <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-11" /></div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <select
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as AssignableRole)}
                  >
                    <option value="OPERATOR">Operator</option>
                    <option value="SITE_ADMIN">Site admin</option>
                    {isSuperAdmin && <option value="SUPERADMIN">Superadmin</option>}
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
                {isSuperAdmin && sites.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Site</Label>
                    <select
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3"
                      value={newSiteId}
                      onChange={(e) => setNewSiteId(e.target.value)}
                    >
                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <Button onClick={createUser} className="h-11 sm:col-span-2">Create User</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Users</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        {isSuperAdmin && <TableHead>Site</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.name}</TableCell>
                          <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                          {isSuperAdmin && (
                            <TableCell>
                              <select
                                className="flex h-8 rounded-md border border-input bg-background px-2 text-xs"
                                value={u.siteId}
                                onChange={(e) => setUserSite(u.id, e.target.value)}
                                aria-label={`Site for ${u.email}`}
                              >
                                {sites.map((site) => (
                                  <option key={site.id} value={site.id}>
                                    {site.name}
                                  </option>
                                ))}
                              </select>
                            </TableCell>
                          )}
                          <TableCell>{u.enabled ? "Enabled" : "Disabled"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {u.role === "PENDING" && (
                                <Button size="sm" onClick={() => approveUser(u.id)}>
                                  Approve
                                </Button>
                              )}
                              <select
                                className="flex h-8 rounded-md border border-input bg-background px-2 text-xs"
                                value={u.role}
                                onChange={(e) => setUserRole(u.id, e.target.value as AssignableRole)}
                                aria-label={`Role for ${u.email}`}
                              >
                                <option value="PENDING">Pending</option>
                                <option value="OPERATOR">Operator</option>
                                <option value="SITE_ADMIN">Site admin</option>
                                {(isSuperAdmin || u.role === "SUPERADMIN") && (
                                  <option value="SUPERADMIN">Superadmin</option>
                                )}
                              </select>
                              <Button size="sm" variant="outline" onClick={() => toggleUser(u.id, u.enabled)}>
                                {u.enabled ? "Disable" : "Enable"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader><CardTitle>App Settings</CardTitle></CardHeader>
              <CardContent className="max-w-lg space-y-4">
                <div className="space-y-1.5"><Label>Admin Override PIN (leave blank to keep current)</Label><Input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} className="h-11" /></div>
                <div className="space-y-1.5"><Label>Email From Name</Label><Input value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} className="h-11" /></div>
                <div className="space-y-1.5"><Label>Email From Address</Label><Input value={emailFromAddress} onChange={(e) => setEmailFromAddress(e.target.value)} className="h-11" /></div>
                <div className="space-y-1.5"><Label>Email CC List (comma-separated)</Label><Input value={emailCcList} onChange={(e) => setEmailCcList(e.target.value)} className="h-11" /></div>
                <div className="space-y-1.5"><Label>Lock Timeout (minutes)</Label><Input type="number" value={lockTimeout} onChange={(e) => setLockTimeout(e.target.value)} className="h-11" /></div>
                <Button onClick={saveSettings} className="h-11 w-full sm:w-auto">Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locks" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Locked Shipments</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Shipment</TableHead>
                        <TableHead>Locked By</TableHead>
                        <TableHead>Since</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard?.lockedShipments.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No active locks</TableCell></TableRow>
                      ) : (
                        dashboard?.lockedShipments.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell>{s.shipmentNumber}</TableCell>
                            <TableCell>{s.lockedBy?.name ?? s.lockedBy?.email}</TableCell>
                            <TableCell>{s.lockedAt ? new Date(s.lockedAt).toLocaleString() : "—"}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="destructive" onClick={() => forceRelease(s.shipmentNumber)}>
                                Force Release
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
