import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatINR } from "@/lib/formatters";
import { toast } from "sonner";
import { Phone, Calendar, AlertTriangle, CheckCircle } from "lucide-react";

export default function CollectionQueuePage() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [actionTask, setActionTask] = useState<any>(null);
  const [actionType, setActionType] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [ptpDate, setPtpDate] = useState("");
  const [ptpAmount, setPtpAmount] = useState("");

  const { data: tasks } = useQuery({
    queryKey: ["collection-tasks", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("collection_tasks")
        .select("*, loans(loan_number, amount, product_type), customers(name, phone, code)")
        .eq("tenant_id", tenantId).order("dpd", { ascending: false }).limit(200);
      return data || [];
    },
  });

  const updateTask = useMutation({
    mutationFn: async (params: { taskId: string; updates: any }) => {
      const { error } = await supabase.from("collection_tasks").update(params.updates).eq("id", params.taskId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["collection-tasks"] }); toast.success("Task updated"); setActionTask(null); },
  });

  const handleAction = () => {
    if (!actionTask) return;
    const updates: any = { notes, disposition: actionType, updated_at: new Date().toISOString() };
    if (actionType === "ptp") { updates.ptp_date = ptpDate; updates.ptp_amount = Number(ptpAmount); updates.status = "ptp"; }
    if (actionType === "close") updates.status = "closed";
    if (actionType === "escalate") updates.status = "escalated";
    if (actionType === "followup") updates.next_followup = ptpDate;
    updateTask.mutate({ taskId: actionTask.id, updates });
  };

  const allTasks = tasks || [];
  const myTasks = allTasks.filter((t: any) => t.assigned_to === user?.id);
  const openTasks = allTasks.filter((t: any) => t.status === "open" || t.status === "ptp");

  const TaskCard = ({ task }: { task: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-mono text-sm font-medium">{task.loans?.loan_number}</p>
            <p className="text-xs text-muted-foreground">{task.customers?.name}</p>
          </div>
          <Badge variant={task.dpd > 90 ? "destructive" : task.dpd > 60 ? "default" : "secondary"}>{task.dpd} DPD</Badge>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <a href={`tel:${task.customers?.phone}`} className="text-primary flex items-center gap-1"><Phone className="h-3 w-3" />{task.customers?.phone}</a>
          <Badge variant="outline" className="text-[10px]">{task.task_type}</Badge>
          <Badge variant="secondary" className="text-[10px]">{task.status}</Badge>
        </div>
        {task.loans && <p className="text-xs">{task.loans.product_type} — {formatINR(task.loans.amount)}</p>}
        <div className="flex gap-1 pt-1">
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setActionTask(task); setActionType("call"); setNotes(""); }}>Log Call</Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setActionTask(task); setActionType("followup"); setNotes(""); setPtpDate(""); }}>Follow-up</Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setActionTask(task); setActionType("ptp"); setNotes(""); setPtpDate(""); setPtpAmount(""); }}>PTP</Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setActionTask(task); setActionType("escalate"); setNotes(""); }}>Escalate</Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setActionTask(task); setActionType("close"); setNotes(""); }}>Close</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="text-2xl font-display font-bold">Collection Queue</h1>
      <Tabs defaultValue="my">
        <TabsList><TabsTrigger value="my">My Tasks ({myTasks.length})</TabsTrigger><TabsTrigger value="all">All Tasks ({openTasks.length})</TabsTrigger></TabsList>
        <TabsContent value="my" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {myTasks.length === 0 && <p className="text-muted-foreground col-span-3 text-center py-8">No tasks assigned to you</p>}
          {myTasks.map((t: any) => <TaskCard key={t.id} task={t} />)}
        </TabsContent>
        <TabsContent value="all" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {openTasks.length === 0 && <p className="text-muted-foreground col-span-3 text-center py-8">No open tasks</p>}
          {openTasks.map((t: any) => <TaskCard key={t.id} task={t} />)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!actionTask} onOpenChange={() => setActionTask(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="capitalize">{actionType} — {actionTask?.loans?.loan_number}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {(actionType === "ptp" || actionType === "followup") && (
              <Input type="date" value={ptpDate} onChange={(e) => setPtpDate(e.target.value)} placeholder="Date" />
            )}
            {actionType === "ptp" && (
              <Input type="number" value={ptpAmount} onChange={(e) => setPtpAmount(e.target.value)} placeholder="PTP Amount" />
            )}
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionTask(null)}>Cancel</Button>
            <Button onClick={handleAction} disabled={updateTask.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
