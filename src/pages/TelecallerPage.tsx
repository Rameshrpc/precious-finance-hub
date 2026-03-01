import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatINR, formatDate } from "@/lib/formatters";
import { toast } from "sonner";
import { Phone, User, Clock } from "lucide-react";

const DISPOSITIONS = [
  { value: "connected_ptp", label: "Connected - PTP" },
  { value: "connected_refused", label: "Connected - Refused" },
  { value: "not_reachable", label: "Not Reachable" },
  { value: "wrong_number", label: "Wrong Number" },
  { value: "callback", label: "Callback" },
];

export default function TelecallerPage() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [disposition, setDisposition] = useState("");
  const [notes, setNotes] = useState("");
  const [ptpDate, setPtpDate] = useState("");
  const [ptpAmount, setPtpAmount] = useState("");
  const [nextFollowup, setNextFollowup] = useState("");

  const { data: tasks } = useQuery({
    queryKey: ["telecaller-tasks", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("collection_tasks")
        .select("*, loans(loan_number, amount, product_type), customers(name, phone, code, address, city)")
        .eq("tenant_id", tenantId).in("task_type", ["call"]).in("status", ["open", "ptp"])
        .order("dpd", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const { data: history } = useQuery({
    queryKey: ["telecaller-history", selectedTask?.id],
    enabled: !!selectedTask,
    queryFn: async () => {
      if (!selectedTask) return [];
      const { data } = await supabase.from("collection_interactions")
        .select("*").eq("task_id", selectedTask.id).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const logCall = useMutation({
    mutationFn: async () => {
      if (!selectedTask || !disposition) return;
      // Insert interaction
      await supabase.from("collection_interactions").insert({
        tenant_id: tenantId,
        task_id: selectedTask.id,
        loan_id: selectedTask.loan_id,
        customer_id: selectedTask.customer_id,
        interaction_type: "call",
        disposition,
        ptp_date: ptpDate || null,
        ptp_amount: ptpAmount ? Number(ptpAmount) : 0,
        notes,
        next_followup: nextFollowup || null,
        created_by: user?.id,
      });
      // Update task
      const updates: any = { disposition, notes, updated_at: new Date().toISOString() };
      if (disposition === "connected_ptp") { updates.ptp_date = ptpDate; updates.ptp_amount = Number(ptpAmount); updates.status = "ptp"; }
      if (nextFollowup) updates.next_followup = nextFollowup;
      await supabase.from("collection_tasks").update(updates).eq("id", selectedTask.id);
    },
    onSuccess: () => {
      toast.success("Call logged");
      qc.invalidateQueries({ queryKey: ["telecaller-tasks"] });
      qc.invalidateQueries({ queryKey: ["telecaller-history"] });
      setDisposition(""); setNotes(""); setPtpDate(""); setPtpAmount(""); setNextFollowup("");
    },
  });

  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="text-2xl font-display font-bold">Telecaller Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left - Customer Card */}
        <div className="lg:col-span-3 space-y-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Queue ({(tasks || []).length})</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-auto">
              {(tasks || []).map((t: any) => (
                <div key={t.id}
                  className={`p-2 rounded-md border cursor-pointer text-xs hover:bg-muted/50 ${selectedTask?.id === t.id ? 'bg-primary/10 border-primary' : ''}`}
                  onClick={() => setSelectedTask(t)}>
                  <div className="flex justify-between"><span className="font-medium">{t.customers?.name}</span><Badge variant="destructive" className="text-[9px]">{t.dpd}D</Badge></div>
                  <div className="text-muted-foreground">{t.loans?.loan_number} • {formatINR(t.loans?.amount)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          {selectedTask && (
            <Card><CardContent className="pt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{selectedTask.customers?.name}</span></div>
              <a href={`tel:${selectedTask.customers?.phone}`} className="flex items-center gap-2 text-primary"><Phone className="h-4 w-4" />{selectedTask.customers?.phone}</a>
              <p className="text-muted-foreground">{selectedTask.customers?.address}, {selectedTask.customers?.city}</p>
              <div className="flex gap-2"><Badge variant="outline">{selectedTask.loans?.product_type}</Badge><Badge variant="secondary">{formatINR(selectedTask.loans?.amount)}</Badge></div>
            </CardContent></Card>
          )}
        </div>

        {/* Center - Call Entry */}
        <div className="lg:col-span-5">
          <Card><CardHeader><CardTitle className="text-sm">Log Call</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {!selectedTask ? <p className="text-center text-muted-foreground py-8">Select a task from the queue</p> : (
                <>
                  <Select value={disposition} onValueChange={setDisposition}>
                    <SelectTrigger><SelectValue placeholder="Disposition" /></SelectTrigger>
                    <SelectContent>{DISPOSITIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                  {disposition === "connected_ptp" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" value={ptpDate} onChange={(e) => setPtpDate(e.target.value)} placeholder="PTP Date" />
                      <Input type="number" value={ptpAmount} onChange={(e) => setPtpAmount(e.target.value)} placeholder="PTP Amount" />
                    </div>
                  )}
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Call notes..." rows={4} />
                  <Input type="date" value={nextFollowup} onChange={(e) => setNextFollowup(e.target.value)} placeholder="Next Follow-up" />
                  <Button className="w-full" onClick={() => logCall.mutate()} disabled={!disposition || logCall.isPending}>
                    <Phone className="h-4 w-4 mr-2" /> Log Call
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right - History */}
        <div className="lg:col-span-4">
          <Card><CardHeader><CardTitle className="text-sm">Interaction History</CardTitle></CardHeader>
            <CardContent>
              {!selectedTask ? <p className="text-center text-muted-foreground py-8">Select a task</p> : (
                <div className="space-y-2 max-h-[60vh] overflow-auto">
                  {(history || []).length === 0 && <p className="text-center text-muted-foreground text-xs py-4">No interactions yet</p>}
                  {(history || []).map((h: any) => (
                    <div key={h.id} className="border rounded-md p-2 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-[9px]">{h.disposition?.replace(/_/g, " ")}</Badge>
                        <span className="text-muted-foreground text-[10px]">{formatDate(h.created_at)}</span>
                      </div>
                      {h.notes && <p className="text-muted-foreground">{h.notes}</p>}
                      {h.ptp_date && <p className="text-primary">PTP: {h.ptp_date} — {formatINR(h.ptp_amount)}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
