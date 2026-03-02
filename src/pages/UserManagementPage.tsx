import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Users, Shield, Pencil, UserCheck, UserX, Search } from "lucide-react";
import { ROLE_LABELS } from "@/lib/indian-locale";
import { formatDate } from "@/lib/formatters";

const ASSIGNABLE_ROLES = ["tenant_admin", "manager", "staff", "viewer"] as const;

export default function UserManagementPage() {
  const { profile } = useAuth();
  const { tenantId } = useTenant();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<string>("staff");
  const [formBranch, setFormBranch] = useState<string>("none");

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("tenant_id", tenantId);
      return data || [];
    },
    enabled: !!tenantId,
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("*");
      return data || [];
    },
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["admin-branches", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("branches").select("id, name").eq("tenant_id", tenantId);
      return data || [];
    },
    enabled: !!tenantId,
  });

  const getRoles = (userId: string) => userRoles.filter((r: any) => r.user_id === userId).map((r: any) => r.role);
  const getBranch = (branchId: string | null) => branches.find((b: any) => b.id === branchId)?.name || "—";

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      // Remove existing roles for this user (except super_admin)
      await supabase.from("user_roles").delete().eq("user_id", userId).neq("role", "super_admin");
      // Insert new role
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Role updated");
    },
    onError: () => toast.error("Failed to update role"),
  });

  const updateBranchMutation = useMutation({
    mutationFn: async ({ userId, branchId }: { userId: string; branchId: string | null }) => {
      const { error } = await supabase.from("profiles").update({ branch_id: branchId }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success("Branch updated");
    },
    onError: () => toast.error("Failed to update branch"),
  });

  const handleInvite = () => {
    // In production this would call a Supabase Edge Function to send invite
    toast.success(`Invitation sent to ${formEmail} as ${ROLE_LABELS[formRole] || formRole}`);
    setAddOpen(false);
    resetForm();
  };

  const handleEditSave = () => {
    if (!editUser) return;
    updateRoleMutation.mutate({ userId: editUser.id, newRole: formRole });
    const bid = formBranch === "none" ? null : formBranch;
    updateBranchMutation.mutate({ userId: editUser.id, branchId: bid });
    setEditUser(null);
    resetForm();
  };

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormRole("staff");
    setFormBranch("none");
  };

  const openEdit = (p: any) => {
    const roles = getRoles(p.id);
    setFormName(p.full_name || "");
    setFormEmail(p.email || "");
    setFormRole(roles[0] || "staff");
    setFormBranch(p.branch_id || "none");
    setEditUser(p);
  };

  const filtered = profiles.filter((p: any) => {
    const q = search.toLowerCase();
    return !q || (p.full_name || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q);
  });

  const roleBadgeVariant = (role: string) => {
    if (role === "super_admin" || role === "tenant_admin") return "default";
    if (role === "manager") return "secondary";
    return "outline";
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage users, roles, and branch assignments</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-1" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite New User</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Full Name</Label><Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="John Doe" /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="user@company.com" /></div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSIGNABLE_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={formBranch} onValueChange={setFormBranch}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Branch</SelectItem>
                    {branches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={!formEmail}>Send Invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Users} label="Total Users" value={profiles.length} />
        <SummaryCard icon={Shield} label="Admins" value={profiles.filter((p: any) => getRoles(p.id).some((r: string) => r === "tenant_admin" || r === "super_admin")).length} />
        <SummaryCard icon={UserCheck} label="Active" value={profiles.length} />
        <SummaryCard icon={UserX} label="No Role" value={profiles.filter((p: any) => getRoles(p.id).length === 0).length} variant="warning" />
      </div>

      {/* User table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/10">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p: any) => {
                const roles = getRoles(p.id);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-sm">{p.full_name || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {roles.map((r: string) => (
                          <Badge key={r} variant={roleBadgeVariant(r)} className="text-[10px]">
                            {ROLE_LABELS[r] || r}
                          </Badge>
                        ))}
                        {roles.length === 0 && <span className="text-xs text-muted-foreground italic">None</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{getBranch(p.branch_id)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(p.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User — {editUser?.full_name || editUser?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ASSIGNABLE_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={formBranch} onValueChange={setFormBranch}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Branch</SelectItem>
                  {branches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, variant }: { icon: any; label: string; value: number; variant?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`rounded-lg p-2 ${variant === "warning" ? "bg-warning/10" : "bg-accent/10"}`}>
          <Icon className={`h-5 w-5 ${variant === "warning" ? "text-orange-600" : "text-accent"}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
