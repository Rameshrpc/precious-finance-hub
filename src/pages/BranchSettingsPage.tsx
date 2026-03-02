import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, GitBranch, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BranchForm {
  id?: string;
  name: string;
  address: string;
  phone: string;
}

const BranchSettingsPage = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<BranchForm>({ name: "", address: "", phone: "" });

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches_settings_full"],
    queryFn: async () => {
      const { data } = await supabase
        .from("branches")
        .select("*")
        .eq("tenant_id", profile?.tenant_id || "")
        .order("name");
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });

  // Get active loan counts per branch
  const { data: loanCounts = {} } = useQuery({
    queryKey: ["branch_loan_counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("loans")
        .select("branch_id")
        .eq("tenant_id", profile?.tenant_id || "")
        .eq("status", "active");
      const counts: Record<string, number> = {};
      (data || []).forEach((l: any) => {
        if (l.branch_id) counts[l.branch_id] = (counts[l.branch_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!profile?.tenant_id,
  });

  const saveBranch = useMutation({
    mutationFn: async () => {
      if (!profile?.tenant_id) throw new Error("No tenant");
      const payload = {
        tenant_id: profile.tenant_id,
        name: form.name,
        address: form.address || null,
        phone: form.phone || null,
      };
      if (form.id) {
        const { error } = await supabase.from("branches").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("branches").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches_settings_full"] });
      setDialogOpen(false);
      resetForm();
      toast.success(form.id ? "Branch updated" : "Branch created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => setForm({ name: "", address: "", phone: "" });

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (branch: any) => {
    setForm({
      id: branch.id,
      name: branch.name || "",
      address: branch.address || "",
      phone: branch.phone || "",
    });
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-accent" />
            Branch Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your company branches and locations</p>
        </div>
        <Button onClick={openAdd} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-1" /> Add Branch
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Branches</p>
            <p className="text-2xl font-bold">{branches.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Active Loans</p>
            <p className="text-2xl font-bold">{Object.values(loanCounts).reduce((a: number, b: number) => a + b, 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="h-5 w-5 text-accent" /> All Branches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-center">Active Loans</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{b.address || "—"}</TableCell>
                  <TableCell className="text-sm">{b.phone || "—"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{(loanCounts as any)[b.id] || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(b)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!branches.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No branches yet. Click "Add Branch" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Branch" : "Add Branch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Branch Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Branch" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
            </div>
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => saveBranch.mutate()}
              disabled={!form.name.trim() || saveBranch.isPending}
            >
              {saveBranch.isPending ? "Saving..." : form.id ? "Update Branch" : "Create Branch"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BranchSettingsPage;
