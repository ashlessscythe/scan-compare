"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
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

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  enabled: boolean;
  lastLogin: string | null;
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
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"OPERATOR" | "ADMIN">("OPERATOR");

  const [adminPin, setAdminPin] = useState("");
  const [emailFromName, setEmailFromName] = useState("");
  const [emailFromAddress, setEmailFromAddress] = useState("");
  const [emailCcList, setEmailCcList] = useState("");
  const [lockTimeout, setLockTimeout] = useState("30");

  async function loadAll() {
    const [dashRes, usersRes, settingsRes] = await Promise.all([
      fetch("/api/admin/dashboard"),
      fetch("/api/admin/users"),
      fetch("/api/admin/settings"),
    ]);
    setDashboard(await dashRes.json());
    const usersData = await usersRes.json();
    setUsers(usersData.users ?? []);
    const settingsData = await settingsRes.json();
    const s = settingsData.settings;
    setSettings(s);
    setEmailFromName(s.emailFromName);
    setEmailFromAddress(s.emailFromAddress);
    setEmailCcList(s.emailCcList.join(", "));
    setLockTimeout(String(s.lockTimeoutMinutes));
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAll();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function createUser() {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, name: newName, password: newPassword, role: newRole }),
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-semibold">Admin Panel</h1>
          <div className="flex gap-2">
            <Link
              href="/scan"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-2.5 text-sm font-medium hover:bg-muted"
            >
              Scan App
            </Link>
            <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4">
        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="locks">Locks</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-3">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shipment</TableHead>
                      <TableHead>Pallet</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard?.recentScans.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.shipment.shipmentNumber}</TableCell>
                        <TableCell>{s.palletIndex}</TableCell>
                        <TableCell>{s.user.name ?? s.user.email}</TableCell>
                        <TableCell>{new Date(s.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Create User</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div><Label>Email</Label><Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></div>
                <div><Label>Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
                <div><Label>Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                <div>
                  <Label>Role</Label>
                  <select className="flex h-9 w-full rounded-md border px-3" value={newRole} onChange={(e) => setNewRole(e.target.value as "OPERATOR" | "ADMIN")}>
                    <option value="OPERATOR">Operator</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <Button onClick={createUser} className="md:col-span-2">Create User</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Users</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
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
                        <TableCell>{u.enabled ? "Enabled" : "Disabled"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => toggleUser(u.id, u.enabled)}>
                            {u.enabled ? "Disable" : "Enable"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader><CardTitle>App Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4 max-w-lg">
                <div><Label>Admin Override PIN (leave blank to keep current)</Label><Input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} /></div>
                <div><Label>Email From Name</Label><Input value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} /></div>
                <div><Label>Email From Address</Label><Input value={emailFromAddress} onChange={(e) => setEmailFromAddress(e.target.value)} /></div>
                <div><Label>Email CC List (comma-separated)</Label><Input value={emailCcList} onChange={(e) => setEmailCcList(e.target.value)} /></div>
                <div><Label>Lock Timeout (minutes)</Label><Input type="number" value={lockTimeout} onChange={(e) => setLockTimeout(e.target.value)} /></div>
                <Button onClick={saveSettings}>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locks" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Locked Shipments</CardTitle></CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
