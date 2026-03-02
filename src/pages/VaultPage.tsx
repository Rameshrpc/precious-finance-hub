import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatINR, formatWeight, formatDate } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { Lock, Package, Grid3X3, Plus, Loader2, Building2, CreditCard, History, XCircle } from "lucide-react";

export default function VaultPage() {
  const { tenantId } = useTenant();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [createPacketOpen, setCreatePacketOpen] = useState(false);
  const [manageSlotOpen, setManageSlotOpen] = useState(false);
  const [repledgeOpen, setRepledgeOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState<any>(null);

  const { data: packets = [], isLoading: packetsLoading } = useQuery({
    queryKey: ["vault-packets", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vault_packets")
        .select("*, slot:vault_slots(slot_name, slot_size)")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["vault-slots", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vault_slots")
        .select("*, packet:vault_packets(packet_number)")
        .eq("tenant_id", tenantId!)
        .order("slot_name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: activeLoans = [] } = useQuery({
    queryKey: ["active-loans-vault", tenantId],
    enabled: !!tenantId && createPacketOpen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("id, loan_number, amount, gold_value, silver_value, customer:customers(name)")
        .eq("tenant_id", tenantId!)
        .eq("status", "active")
        .order("loan_number");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: repledges = [] } = useQuery({
    queryKey: ["repledges", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repledges")
        .select("*, packet:vault_packets(packet_number, gold_weight, silver_weight)")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: repledgePayments = [] } = useQuery({
    queryKey: ["repledge-payments", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repledge_payments")
        .select("*, repledge:repledges(bank_name, packet:vault_packets(packet_number))")
        .eq("tenant_id", tenantId!)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: bankPartners = [] } = useQuery({
    queryKey: ["bank-partners", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_partners")
        .select("id, name, rate")
        .eq("tenant_id", tenantId!)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  const totalGold = packets.reduce((s: number, p: any) => s + Number(p.gold_weight), 0);
  const totalSilver = packets.reduce((s: number, p: any) => s + Number(p.silver_weight), 0);
  const totalPrincipal = packets.reduce((s: number, p: any) => s + Number(p.total_principal), 0);
  const activePackets = packets.filter((p: any) => p.status === "active").length;
  const repledgedAmount = repledges.filter((r: any) => r.status === "active").reduce((s: number, r: any) => s + Number(r.amount), 0);

  const activeRepledges = repledges.filter((r: any) => r.status === "active");
  const closedRepledges = repledges.filter((r: any) => r.status === "closed");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Gold Vault</h1>
        <div className="flex gap-2">
          <Button onClick={() => setCreatePacketOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Create Packet</Button>
          <Button variant="outline" onClick={() => setManageSlotOpen(true)} className="gap-2"><Grid3X3 className="h-4 w-4" /> Manage Slots</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Total Gold</p><p className="text-xl font-bold">{formatWeight(totalGold)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Total Silver</p><p className="text-xl font-bold">{formatWeight(totalSilver)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Packets</p><p className="text-xl font-bold">{activePackets}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Total Principal</p><p className="text-xl font-bold">{formatINR(totalPrincipal)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Repledged</p><p className="text-xl font-bold text-amber-600">{formatINR(repledgedAmount)}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="packets">
        <TabsList>
          <TabsTrigger value="packets" className="gap-1"><Package className="h-3.5 w-3.5" />Packets</TabsTrigger>
          <TabsTrigger value="slots" className="gap-1"><Grid3X3 className="h-3.5 w-3.5" />Vault Slots</TabsTrigger>
          <TabsTrigger value="repledge-active" className="gap-1"><Building2 className="h-3.5 w-3.5" />Repledge Active ({activeRepledges.length})</TabsTrigger>
          <TabsTrigger value="repledge-payments" className="gap-1"><CreditCard className="h-3.5 w-3.5" />Payments ({repledgePayments.length})</TabsTrigger>
          <TabsTrigger value="repledge-closed" className="gap-1"><History className="h-3.5 w-3.5" />Closed ({closedRepledges.length})</TabsTrigger>
        </TabsList>

        {/* PACKETS */}
        <TabsContent value="packets" className="mt-4">
          {packetsLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : packets.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No packets created yet</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Packet No</TableHead>
                    <TableHead className="text-right">Loans</TableHead>
                    <TableHead className="text-right">Gold (g)</TableHead>
                    <TableHead className="text-right">Silver (g)</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Repledge</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packets.map((pkt: any) => {
                    const activeRep = repledges.find((r: any) => r.packet_id === pkt.id && r.status === "active");
                    return (
                      <TableRow key={pkt.id}>
                        <TableCell className="font-mono font-medium">{pkt.packet_number}</TableCell>
                        <TableCell className="text-right">{pkt.loans_count}</TableCell>
                        <TableCell className="text-right">{formatWeight(pkt.gold_weight)}</TableCell>
                        <TableCell className="text-right">{formatWeight(pkt.silver_weight)}</TableCell>
                        <TableCell className="text-right font-medium">{formatINR(pkt.total_principal)}</TableCell>
                        <TableCell>{pkt.slot?.slot_name || "-"}</TableCell>
                        <TableCell>
                          {activeRep ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800">{activeRep.bank_name}</Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={pkt.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}>
                            {pkt.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-3">
            <Button variant="outline" onClick={() => setRepledgeOpen(true)} className="gap-2"><Building2 className="h-4 w-4" />New Repledge</Button>
          </div>
        </TabsContent>

        {/* VAULT SLOTS */}
        <TabsContent value="slots" className="mt-4">
          {slotsLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : slots.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No vault slots configured</CardContent></Card>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {slots.map((slot: any) => (
                <div key={slot.id} className={`border rounded-lg p-3 text-center transition-colors ${slot.is_occupied ? "bg-destructive/10 border-destructive/30" : "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"}`}>
                  <Lock className={`mx-auto h-5 w-5 mb-1 ${slot.is_occupied ? "text-destructive" : "text-emerald-600"}`} />
                  <p className="font-mono text-xs font-bold">{slot.slot_name}</p>
                  <Badge variant="outline" className="text-[9px] mt-1">{slot.slot_size}</Badge>
                  {slot.is_occupied && slot.packet?.packet_number && <p className="text-[10px] text-muted-foreground mt-1 truncate">{slot.packet.packet_number}</p>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* REPLEDGE ACTIVE */}
        <TabsContent value="repledge-active" className="mt-4">
          {activeRepledges.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No active repledges</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank</TableHead><TableHead>Packet</TableHead>
                    <TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Rate</TableHead>
                    <TableHead>Start</TableHead><TableHead>Maturity</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRepledges.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.bank_name}</TableCell>
                      <TableCell className="font-mono text-sm">{r.packet?.packet_number}</TableCell>
                      <TableCell className="text-right font-medium">{formatINR(r.amount)}</TableCell>
                      <TableCell className="text-right">{r.rate}%</TableCell>
                      <TableCell>{formatDate(r.start_date)}</TableCell>
                      <TableCell>{r.maturity_date ? formatDate(r.maturity_date) : "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" onClick={() => setPaymentOpen(r)}>Record Payment</Button>
                          <CloseRepledgeButton repledge={r} tenantId={tenantId} profile={profile} queryClient={queryClient} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* PAYMENTS */}
        <TabsContent value="repledge-payments" className="mt-4">
          {repledgePayments.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No payments recorded</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Bank</TableHead><TableHead>Packet</TableHead>
                    <TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Mode</TableHead><TableHead>Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repledgePayments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.payment_date)}</TableCell>
                      <TableCell>{p.repledge?.bank_name}</TableCell>
                      <TableCell className="font-mono text-sm">{p.repledge?.packet?.packet_number}</TableCell>
                      <TableCell><Badge variant="outline">{p.payment_type}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{formatINR(p.amount)}</TableCell>
                      <TableCell>{p.payment_mode}</TableCell>
                      <TableCell className="text-sm">{p.reference || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* CLOSED */}
        <TabsContent value="repledge-closed" className="mt-4">
          {closedRepledges.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No closed repledges</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank</TableHead><TableHead>Packet</TableHead>
                    <TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Rate</TableHead>
                    <TableHead>Start</TableHead><TableHead>Maturity</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closedRepledges.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.bank_name}</TableCell>
                      <TableCell className="font-mono text-sm">{r.packet?.packet_number}</TableCell>
                      <TableCell className="text-right">{formatINR(r.amount)}</TableCell>
                      <TableCell className="text-right">{r.rate}%</TableCell>
                      <TableCell>{formatDate(r.start_date)}</TableCell>
                      <TableCell>{r.maturity_date ? formatDate(r.maturity_date) : "-"}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-gray-100 text-gray-600">Closed</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreatePacketDialog open={createPacketOpen} onOpenChange={setCreatePacketOpen} loans={activeLoans} slots={slots.filter((s: any) => !s.is_occupied)} tenantId={tenantId} userId={user?.id} queryClient={queryClient} />
      <ManageSlotsDialog open={manageSlotOpen} onOpenChange={setManageSlotOpen} tenantId={tenantId} userId={user?.id} queryClient={queryClient} />
      <NewRepledgeDialog open={repledgeOpen} onOpenChange={setRepledgeOpen} packets={packets.filter((p: any) => p.status === "active")} bankPartners={bankPartners} tenantId={tenantId} profile={profile} queryClient={queryClient} />
      <RecordPaymentDialog open={!!paymentOpen} onOpenChange={() => setPaymentOpen(null)} repledge={paymentOpen} tenantId={tenantId} profile={profile} queryClient={queryClient} />
    </div>
  );
}

// --- Close Repledge Button ---
function CloseRepledgeButton({ repledge, tenantId, profile, queryClient }: any) {
  const mutation = useMutation({
    mutationFn: async () => {
      await supabase.from("repledges").update({ status: "closed" }).eq("id", repledge.id);
      await supabase.from("audit_logs").insert({
        tenant_id: tenantId,
        entity_type: "repledge",
        entity_id: repledge.id,
        action: "Repledge Closed",
        performed_by: profile?.id,
        performed_by_name: profile?.full_name,
        details: { bank: repledge.bank_name, amount: repledge.amount },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repledges"] });
      toast({ title: "Repledge Closed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  return <Button size="sm" variant="destructive" onClick={() => mutation.mutate()} disabled={mutation.isPending}>Close</Button>;
}

// --- New Repledge Dialog ---
function NewRepledgeDialog({ open, onOpenChange, packets, bankPartners, tenantId, profile, queryClient }: any) {
  const [packetId, setPacketId] = useState("");
  const [bankId, setBankId] = useState("");
  const [bankName, setBankName] = useState("");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [maturity, setMaturity] = useState("");

  const handleBankChange = (id: string) => {
    setBankId(id);
    const bank = bankPartners.find((b: any) => b.id === id);
    if (bank) { setBankName(bank.name); setRate(String(bank.rate)); }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!packetId || !bankName || !amount) throw new Error("Fill required fields");
      await supabase.from("repledges").insert({
        tenant_id: tenantId,
        packet_id: packetId,
        bank_partner_id: bankId || null,
        bank_name: bankName,
        amount: parseFloat(amount),
        rate: parseFloat(rate) || 0,
        maturity_date: maturity || null,
        created_by: profile?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repledges"] });
      toast({ title: "Repledge Created" });
      onOpenChange(false);
      setPacketId(""); setBankId(""); setBankName(""); setAmount(""); setRate(""); setMaturity("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Repledge</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Packet</Label>
            <Select value={packetId} onValueChange={setPacketId}>
              <SelectTrigger><SelectValue placeholder="Select packet" /></SelectTrigger>
              <SelectContent>{packets.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.packet_number} - {formatWeight(p.gold_weight)} gold</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Bank Partner</Label>
            <Select value={bankId} onValueChange={handleBankChange}>
              <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
              <SelectContent>{bankPartners.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name} ({b.rate}%)</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount (₹)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div><Label>Rate (%)</Label><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
          </div>
          <div><Label>Maturity Date</Label><Input type="date" value={maturity} onChange={(e) => setMaturity(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Create Repledge</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Record Payment Dialog ---
function RecordPaymentDialog({ open, onOpenChange, repledge, tenantId, profile, queryClient }: any) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("interest");
  const [mode, setMode] = useState("cash");
  const [ref, setRef] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!amount || !repledge) throw new Error("Enter amount");
      await supabase.from("repledge_payments").insert({
        tenant_id: tenantId,
        repledge_id: repledge.id,
        amount: parseFloat(amount),
        payment_type: type,
        payment_mode: mode,
        reference: ref || null,
        created_by: profile?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repledge-payments"] });
      toast({ title: "Payment Recorded" });
      onOpenChange();
      setAmount(""); setRef("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Repledge Payment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {repledge && (
            <Card><CardContent className="p-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Bank</span><span className="font-medium">{repledge.bank_name}</span></div>
              <div className="flex justify-between"><span>Outstanding</span><span className="font-medium">{formatINR(repledge.amount)}</span></div>
            </CardContent></Card>
          )}
          <div><Label>Amount (₹)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="interest">Interest</SelectItem>
                  <SelectItem value="principal">Principal</SelectItem>
                  <SelectItem value="partial_release">Partial Release</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Reference</Label><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Optional" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onOpenChange}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Record Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Create Packet Dialog ---
function CreatePacketDialog({ open, onOpenChange, loans, slots, tenantId, userId, queryClient }: any) {
  const [selectedLoans, setSelectedLoans] = useState<Set<string>>(new Set());
  const [slotId, setSlotId] = useState("");
  const toggle = (id: string) => { const n = new Set(selectedLoans); if (n.has(id)) n.delete(id); else n.add(id); setSelectedLoans(n); };
  const selected = loans.filter((l: any) => selectedLoans.has(l.id));
  const goldW = selected.reduce((s: number, l: any) => s + Number(l.gold_value) / 6000, 0);
  const silverW = selected.reduce((s: number, l: any) => s + Number(l.silver_value) / 80, 0);
  const totalP = selected.reduce((s: number, l: any) => s + Number(l.amount), 0);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (selectedLoans.size === 0) throw new Error("Select at least one loan");
      const packetNumber = `PKT${Date.now().toString().slice(-6)}`;
      const { data: pkt, error: pktErr } = await supabase.from("vault_packets").insert({ tenant_id: tenantId!, packet_number: packetNumber, slot_id: slotId && slotId !== "none" ? slotId : null, gold_weight: goldW, silver_weight: silverW, total_principal: totalP, loans_count: selectedLoans.size, created_by: userId }).select().single();
      if (pktErr) throw pktErr;
      const junctionRows = Array.from(selectedLoans).map((loanId) => ({ packet_id: pkt.id, loan_id: loanId }));
      const { error: jErr } = await supabase.from("vault_packet_loans").insert(junctionRows);
      if (jErr) throw jErr;
      if (slotId && slotId !== "none") await supabase.from("vault_slots").update({ is_occupied: true, packet_id: pkt.id }).eq("id", slotId);
      return packetNumber;
    },
    onSuccess: (pn) => {
      queryClient.invalidateQueries({ queryKey: ["vault-packets"] });
      queryClient.invalidateQueries({ queryKey: ["vault-slots"] });
      toast({ title: "Packet Created", description: `${pn} with ${selectedLoans.size} loan(s)` });
      setSelectedLoans(new Set()); setSlotId(""); onOpenChange(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Vault Packet</DialogTitle></DialogHeader>
        <div className="text-sm text-muted-foreground mb-2">Select active loans to bundle:</div>
        <div className="border rounded-lg max-h-60 overflow-y-auto">
          <Table>
            <TableHeader><TableRow><TableHead className="w-8"></TableHead><TableHead>Loan</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>{loans.map((l: any) => (
              <TableRow key={l.id} className="cursor-pointer" onClick={() => toggle(l.id)}>
                <TableCell><Checkbox checked={selectedLoans.has(l.id)} /></TableCell>
                <TableCell className="font-mono text-sm">{l.loan_number}</TableCell>
                <TableCell className="text-sm">{l.customer?.name || "-"}</TableCell>
                <TableCell className="text-right text-sm">{formatINR(l.amount)}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
        {selectedLoans.size > 0 && (
          <Card className="bg-muted/50"><CardContent className="p-3 grid grid-cols-4 gap-2 text-center text-sm">
            <div><p className="text-xs text-muted-foreground">Loans</p><p className="font-bold">{selectedLoans.size}</p></div>
            <div><p className="text-xs text-muted-foreground">Gold</p><p className="font-bold">{goldW.toFixed(1)}g</p></div>
            <div><p className="text-xs text-muted-foreground">Silver</p><p className="font-bold">{silverW.toFixed(1)}g</p></div>
            <div><p className="text-xs text-muted-foreground">Principal</p><p className="font-bold">{formatINR(totalP)}</p></div>
          </CardContent></Card>
        )}
        <div><Label className="text-xs">Assign Vault Slot (optional)</Label>
          <Select value={slotId} onValueChange={setSlotId}>
            <SelectTrigger><SelectValue placeholder="Select available slot" /></SelectTrigger>
            <SelectContent><SelectItem value="none">None</SelectItem>{slots.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.slot_name} ({s.slot_size})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button className="w-full gap-2" disabled={selectedLoans.size === 0 || createMutation.isPending} onClick={() => createMutation.mutate()}>
          {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Create Packet ({selectedLoans.size} loans)
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// --- Manage Slots Dialog ---
function ManageSlotsDialog({ open, onOpenChange, tenantId, userId, queryClient }: any) {
  const [name, setName] = useState("");
  const [size, setSize] = useState("M");
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Enter slot name");
      const { error } = await supabase.from("vault_slots").insert({ tenant_id: tenantId!, slot_name: name.trim().toUpperCase(), slot_size: size });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-slots"] });
      toast({ title: "Slot Added", description: `${name.toUpperCase()} (${size})` });
      setName("");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Manage Vault Slots</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Slot Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. A1, B2" /></div>
          <div><Label className="text-xs">Size</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="S">Small</SelectItem><SelectItem value="M">Medium</SelectItem><SelectItem value="L">Large</SelectItem></SelectContent>
            </Select>
          </div>
          <Button className="w-full gap-2" disabled={!name.trim() || addMutation.isPending} onClick={() => addMutation.mutate()}>
            {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Add Slot
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
