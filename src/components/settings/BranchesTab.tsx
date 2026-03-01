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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, GitBranch } from "lucide-react";

const BranchesTab = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("branches").select("*").eq("tenant_id", profile?.tenant_id || "").order("name");
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });

  const createBranch = useMutation({
    mutationFn: async () => {
      if (!profile?.tenant_id) throw new Error("No tenant");
      const { error } = await supabase.from("branches").insert({ tenant_id: profile.tenant_id, name: form.name, address: form.address || null, phone: form.phone || null });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["branches_settings"] }); setDialogOpen(false); setForm({ name: "", address: "", phone: "" }); toast.success("Branch created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5" /> Branches</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Branch</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Branch</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Branch Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <Button className="w-full" onClick={() => createBranch.mutate()} disabled={!form.name || createBranch.isPending}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Address</TableHead><TableHead>Phone</TableHead></TableRow></TableHeader>
            <TableBody>
              {branches.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-sm">{b.address || "—"}</TableCell>
                  <TableCell className="text-sm">{b.phone || "—"}</TableCell>
                </TableRow>
              ))}
              {!branches.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No branches</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchesTab;
