import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatters";
import { Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const CATEGORIES = ["general", "loan_issue", "payment_issue", "staff_behavior", "documentation", "other"];
const PRIORITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["open", "acknowledged", "in_progress", "resolved", "closed"];

const priorityColor: Record<string, string> = { low: "secondary", medium: "default", high: "destructive", critical: "destructive" };
const statusColor: Record<string, string> = { open: "secondary", acknowledged: "default", in_progress: "default", resolved: "outline", closed: "outline" };

const GrievancePage = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ category: "general", description: "", priority: "medium", customer_id: "" });

  const { data: grievances = [], isLoading } = useQuery({
    queryKey: ["grievances"],
    queryFn: async () => {
      const { data } = await supabase.from("grievances").select("*, customers(name, phone)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.tenant_id) throw new Error("No tenant");
      const { error } = await supabase.from("grievances").insert({
        tenant_id: profile.tenant_id,
        category: form.category,
        description: form.description,
        priority: form.priority,
        customer_id: form.customer_id || null,
        created_by: profile.id,
        sla_ack_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        sla_resolve_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grievances"] });
      setDialogOpen(false);
      setForm({ category: "general", description: "", priority: "medium", customer_id: "" });
      toast.success("Grievance created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCount = grievances.filter((g: any) => ["open", "acknowledged", "in_progress"].includes(g.status)).length;
  const resolvedCount = grievances.filter((g: any) => ["resolved", "closed"].includes(g.status)).length;
  const breachedCount = grievances.filter((g: any) => g.status === "open" && g.sla_ack_at && new Date(g.sla_ack_at) < new Date()).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Grievance Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Grievance Ticket</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea placeholder="Describe the issue..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!form.description || createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Ticket"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3"><Clock className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{openCount}</p><p className="text-xs text-muted-foreground">Open Tickets</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><CheckCircle className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{resolvedCount}</p><p className="text-xs text-muted-foreground">Resolved</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">{breachedCount}</p><p className="text-xs text-muted-foreground">SLA Breached</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Tickets</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Escalation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grievances.map((g: any) => (
                <TableRow key={g.id}>
                  <TableCell className="text-xs">{formatDate(g.created_at)}</TableCell>
                  <TableCell className="capitalize text-sm">{g.category.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-sm max-w-[300px] truncate">{g.description}</TableCell>
                  <TableCell><Badge variant={priorityColor[g.priority] as any}>{g.priority}</Badge></TableCell>
                  <TableCell><Badge variant={statusColor[g.status] as any}>{g.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{g.escalation_level}</Badge></TableCell>
                </TableRow>
              ))}
              {!grievances.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No grievance tickets yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GrievancePage;
