import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Users, Shield } from "lucide-react";
import { ROLE_LABELS } from "@/lib/indian-locale";

const ROLES = ["tenant_admin", "manager", "staff"];
const MODULES = ["Dashboard", "Customers", "Transactions", "Vault", "Accounting", "Reports", "Approvals", "Collection", "Communications", "Settings"];
const ACTIONS = ["View", "Create", "Edit", "Delete"];

const UsersRolesTab = () => {
  const { profile } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("staff");
  const [showMatrix, setShowMatrix] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ["all_profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("tenant_id", profile?.tenant_id || "");
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ["all_user_roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("*");
      return data || [];
    },
  });

  const getRoles = (userId: string) => userRoles.filter((r: any) => r.user_id === userId).map((r: any) => r.role);

  const handleInvite = () => {
    toast.success(`Invitation sent to ${inviteEmail} as ${inviteRole}`);
    setInviteOpen(false);
    setInviteEmail("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Users</CardTitle>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Invite User</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleInvite} disabled={!inviteEmail}>Send Invitation</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell className="flex gap-1 flex-wrap">
                    {getRoles(p.id).map((r: string) => <Badge key={r} variant="secondary" className="text-[10px]">{ROLE_LABELS[r] || r}</Badge>)}
                    {getRoles(p.id).length === 0 && <span className="text-xs text-muted-foreground">No roles</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Permission Matrix</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowMatrix(!showMatrix)}>{showMatrix ? "Hide" : "Show"} Matrix</Button>
        </CardHeader>
        {showMatrix && (
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    {ROLES.map((r) => (
                      <TableHead key={r} colSpan={4} className="text-center border-l">{ROLE_LABELS[r] || r}</TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableHead></TableHead>
                    {ROLES.map((r) => ACTIONS.map((a) => (
                      <TableHead key={`${r}-${a}`} className="text-[10px] text-center px-1 border-l">{a.charAt(0)}</TableHead>
                    )))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULES.map((mod) => (
                    <TableRow key={mod}>
                      <TableCell className="font-medium text-sm">{mod}</TableCell>
                      {ROLES.map((r) => ACTIONS.map((a) => (
                        <TableCell key={`${r}-${a}-${mod}`} className="text-center px-1 border-l">
                          <Checkbox defaultChecked={r === "tenant_admin" || (r === "manager" && a !== "Delete") || (r === "staff" && a === "View")} />
                        </TableCell>
                      )))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button className="mt-4" onClick={() => toast.success("Permissions saved")}>Save Permissions</Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default UsersRolesTab;
