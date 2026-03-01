import { useState, useMemo, useCallback } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR, formatWeight } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { Lock, Package, Grid3X3, Plus, Loader2 } from "lucide-react";

export default function VaultPage() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createPacketOpen, setCreatePacketOpen] = useState(false);
  const [manageSlotOpen, setManageSlotOpen] = useState(false);

  // Fetch packets
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

  // Fetch slots
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

  // Fetch active loans for packet creation
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

  // Totals
  const totalGold = packets.reduce((s: number, p: any) => s + Number(p.gold_weight), 0);
  const totalSilver = packets.reduce((s: number, p: any) => s + Number(p.silver_weight), 0);
  const totalPrincipal = packets.reduce((s: number, p: any) => s + Number(p.total_principal), 0);
  const activePackets = packets.filter((p: any) => p.status === "active").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Gold Vault</h1>
        <div className="flex gap-2">
          <Button onClick={() => setCreatePacketOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Packet
          </Button>
          <Button variant="outline" onClick={() => setManageSlotOpen(true)} className="gap-2">
            <Grid3X3 className="h-4 w-4" /> Manage Slots
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Gold</p>
            <p className="text-xl font-bold">{formatWeight(totalGold)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Silver</p>
            <p className="text-xl font-bold">{formatWeight(totalSilver)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Packets</p>
            <p className="text-xl font-bold">{activePackets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Principal</p>
            <p className="text-xl font-bold">{formatINR(totalPrincipal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="packets">
        <TabsList>
          <TabsTrigger value="packets" className="gap-1"><Package className="h-3.5 w-3.5" />Packets</TabsTrigger>
          <TabsTrigger value="slots" className="gap-1"><Grid3X3 className="h-3.5 w-3.5" />Vault Slots</TabsTrigger>
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
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packets.map((pkt: any) => (
                    <TableRow key={pkt.id}>
                      <TableCell className="font-mono font-medium">{pkt.packet_number}</TableCell>
                      <TableCell className="text-right">{pkt.loans_count}</TableCell>
                      <TableCell className="text-right">{formatWeight(pkt.gold_weight)}</TableCell>
                      <TableCell className="text-right">{formatWeight(pkt.silver_weight)}</TableCell>
                      <TableCell className="text-right font-medium">{formatINR(pkt.total_principal)}</TableCell>
                      <TableCell>{pkt.slot?.slot_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={pkt.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}>
                          {pkt.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* VAULT SLOTS */}
        <TabsContent value="slots" className="mt-4">
          {slotsLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : slots.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No vault slots configured. Click "Manage Slots" to add.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {slots.map((slot: any) => (
                <div
                  key={slot.id}
                  className={`border rounded-lg p-3 text-center transition-colors ${
                    slot.is_occupied
                      ? "bg-destructive/10 border-destructive/30"
                      : "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                  }`}
                >
                  <Lock className={`mx-auto h-5 w-5 mb-1 ${slot.is_occupied ? "text-destructive" : "text-emerald-600"}`} />
                  <p className="font-mono text-xs font-bold">{slot.slot_name}</p>
                  <Badge variant="outline" className="text-[9px] mt-1">
                    {slot.slot_size}
                  </Badge>
                  {slot.is_occupied && slot.packet?.packet_number && (
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">{slot.packet.packet_number}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Packet Dialog */}
      <CreatePacketDialog
        open={createPacketOpen}
        onOpenChange={setCreatePacketOpen}
        loans={activeLoans}
        slots={slots.filter((s: any) => !s.is_occupied)}
        tenantId={tenantId}
        userId={user?.id}
        queryClient={queryClient}
      />

      {/* Manage Slots Dialog */}
      <ManageSlotsDialog
        open={manageSlotOpen}
        onOpenChange={setManageSlotOpen}
        tenantId={tenantId}
        userId={user?.id}
        queryClient={queryClient}
      />
    </div>
  );
}

// --- Create Packet Dialog ---
function CreatePacketDialog({
  open, onOpenChange, loans, slots, tenantId, userId, queryClient,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loans: any[];
  slots: any[];
  tenantId: string | null;
  userId: string | undefined;
  queryClient: any;
}) {
  const [selectedLoans, setSelectedLoans] = useState<Set<string>>(new Set());
  const [slotId, setSlotId] = useState("");

  const toggle = (id: string) => {
    const next = new Set(selectedLoans);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedLoans(next);
  };

  const selected = loans.filter((l: any) => selectedLoans.has(l.id));
  const goldW = selected.reduce((s, l) => s + Number(l.gold_value) / 6000, 0);
  const silverW = selected.reduce((s, l) => s + Number(l.silver_value) / 80, 0);
  const totalP = selected.reduce((s, l) => s + Number(l.amount), 0);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (selectedLoans.size === 0) throw new Error("Select at least one loan");
      const packetNumber = `PKT${Date.now().toString().slice(-6)}`;

      // Insert packet
      const { data: pkt, error: pktErr } = await supabase.from("vault_packets").insert({
        tenant_id: tenantId!,
        packet_number: packetNumber,
        slot_id: slotId || null,
        gold_weight: goldW,
        silver_weight: silverW,
        total_principal: totalP,
        loans_count: selectedLoans.size,
        created_by: userId,
      }).select().single();
      if (pktErr) throw pktErr;

      // Insert junction rows
      const junctionRows = Array.from(selectedLoans).map((loanId) => ({
        packet_id: pkt.id,
        loan_id: loanId,
      }));
      const { error: jErr } = await supabase.from("vault_packet_loans").insert(junctionRows);
      if (jErr) throw jErr;

      // If slot selected, mark occupied
      if (slotId) {
        await supabase.from("vault_slots").update({ is_occupied: true, packet_id: pkt.id }).eq("id", slotId);
      }

      return packetNumber;
    },
    onSuccess: (pn) => {
      queryClient.invalidateQueries({ queryKey: ["vault-packets"] });
      queryClient.invalidateQueries({ queryKey: ["vault-slots"] });
      toast({ title: "Packet Created", description: `${pn} with ${selectedLoans.size} loan(s)` });
      setSelectedLoans(new Set());
      setSlotId("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Vault Packet</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-2">Select active loans to bundle into a packet:</div>

        <div className="border rounded-lg max-h-60 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Loan</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((l: any) => (
                <TableRow key={l.id} className="cursor-pointer" onClick={() => toggle(l.id)}>
                  <TableCell><Checkbox checked={selectedLoans.has(l.id)} /></TableCell>
                  <TableCell className="font-mono text-sm">{l.loan_number}</TableCell>
                  <TableCell className="text-sm">{l.customer?.name || "-"}</TableCell>
                  <TableCell className="text-right text-sm">{formatINR(l.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {selectedLoans.size > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="p-3 grid grid-cols-4 gap-2 text-center text-sm">
              <div><p className="text-xs text-muted-foreground">Loans</p><p className="font-bold">{selectedLoans.size}</p></div>
              <div><p className="text-xs text-muted-foreground">Gold</p><p className="font-bold">{goldW.toFixed(1)}g</p></div>
              <div><p className="text-xs text-muted-foreground">Silver</p><p className="font-bold">{silverW.toFixed(1)}g</p></div>
              <div><p className="text-xs text-muted-foreground">Principal</p><p className="font-bold">{formatINR(totalP)}</p></div>
            </CardContent>
          </Card>
        )}

        <div>
          <Label className="text-xs">Assign Vault Slot (optional)</Label>
          <Select value={slotId} onValueChange={setSlotId}>
            <SelectTrigger><SelectValue placeholder="Select available slot" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {slots.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.slot_name} ({s.slot_size})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full gap-2"
          disabled={selectedLoans.size === 0 || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Packet ({selectedLoans.size} loans)
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// --- Manage Slots Dialog ---
function ManageSlotsDialog({
  open, onOpenChange, tenantId, userId, queryClient,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string | null;
  userId: string | undefined;
  queryClient: any;
}) {
  const [name, setName] = useState("");
  const [size, setSize] = useState("M");

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Enter slot name");
      const { error } = await supabase.from("vault_slots").insert({
        tenant_id: tenantId!,
        slot_name: name.trim().toUpperCase(),
        slot_size: size,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-slots"] });
      toast({ title: "Slot Added", description: `${name.toUpperCase()} (${size})` });
      setName("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Manage Vault Slots</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Slot Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. A1, B2, LOCKER-01" />
          </div>
          <div>
            <Label className="text-xs">Size</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="S">Small (S)</SelectItem>
                <SelectItem value="M">Medium (M)</SelectItem>
                <SelectItem value="L">Large (L)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full gap-2"
            disabled={!name.trim() || addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Slot
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
