import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatWeight } from "@/lib/formatters";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: any;
  pledgeItems: any[];
}

export default function PartialReleaseDialog({ open, onOpenChange, loan, pledgeItems }: Props) {
  const { tenantId } = useTenant();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [paymentMode, setPaymentMode] = useState("cash");
  const [reference, setReference] = useState("");

  const unreleased = pledgeItems.filter((i) => !i.is_released);

  const toggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const selectedItems = unreleased.filter((i) => selectedIds.has(i.id));
  const releasedValue = selectedItems.reduce((s, i) => s + Number(i.value), 0);
  const remainingValue = unreleased.filter((i) => !selectedIds.has(i.id)).reduce((s, i) => s + Number(i.value), 0);
  const newLTV = remainingValue > 0 ? Math.round((loan.amount / remainingValue) * 100) : 0;
  const ltvOk = remainingValue > 0 && newLTV <= 100;

  const handleRelease = async () => {
    if (selectedIds.size === 0) return;
    if (!ltvOk) { toast.error("Cannot release: LTV would exceed 100%"); return; }

    // Check if any pledge item's packet has an active repledge
    const packetIds = [...new Set(pledgeItems.filter(i => selectedIds.has(i.id) && i.packet_id).map(i => i.packet_id))];
    if (packetIds.length > 0) {
      const { data: activeRepledges } = await supabase
        .from("repledges")
        .select("bank_name, packet:vault_packets(packet_number)")
        .in("packet_id", packetIds)
        .eq("status", "active");
      if (activeRepledges && activeRepledges.length > 0) {
        const rep = activeRepledges[0] as any;
        toast.error(`Cannot release. Packet repledged to ${rep.bank_name}. Close repledge first.`);
        return;
      }
    }
    try {
      for (const id of selectedIds) {
        await supabase.from("pledge_items").update({ is_released: true, released_at: new Date().toISOString() }).eq("id", id);
      }
      // Recalc loan totals
      const remainingItems = unreleased.filter((i) => !selectedIds.has(i.id));
      const goldValue = remainingItems.filter((i) => i.metal_type === "gold").reduce((s, i) => s + Number(i.value), 0);
      const silverValue = remainingItems.filter((i) => i.metal_type === "silver").reduce((s, i) => s + Number(i.value), 0);
      const totalPledge = goldValue + silverValue;
      await supabase.from("loans").update({
        gold_value: goldValue,
        silver_value: silverValue,
        total_pledge_value: totalPledge,
        gold_ltv: goldValue > 0 ? Math.round((loan.amount / goldValue) * 100) : 0,
        silver_ltv: silverValue > 0 ? Math.round((loan.amount / silverValue) * 100) : 0,
        overall_ltv: totalPledge > 0 ? Math.round((loan.amount / totalPledge) * 100) : 0,
      }).eq("id", loan.id);

      await supabase.from("audit_logs").insert({
        tenant_id: tenantId!,
        entity_type: "loan",
        entity_id: loan.id,
        action: "Partial Release",
        performed_by: profile?.id,
        performed_by_name: profile?.full_name,
        details: { items_released: selectedIds.size, remaining_value: remainingValue, new_ltv: newLTV },
      });

      queryClient.invalidateQueries({ queryKey: ["loan-detail"] });
      queryClient.invalidateQueries({ queryKey: ["pledge-items"] });
      toast.success(`${selectedIds.size} item(s) released. New LTV: ${newLTV}%`);
      onOpenChange(false);
      setSelectedIds(new Set());
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Partial Item Release</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-auto">
          <p className="text-sm text-muted-foreground">Select items to release from loan {loan.loan_number}</p>
          {unreleased.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleItem(item.id)} />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.item_name}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className={item.metal_type === "gold" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}>{item.metal_type}</Badge>
                  <span>{formatWeight(item.net_weight)}</span>
                </div>
              </div>
              <span className="text-sm font-bold">{formatINR(item.value)}</span>
            </div>
          ))}

          {selectedIds.size > 0 && (
            <Card className={!ltvOk ? "border-destructive" : ""}>
              <CardContent className="p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Released Value</span><span className="font-medium">{formatINR(releasedValue)}</span></div>
                <div className="flex justify-between"><span>Remaining Value</span><span className="font-medium">{formatINR(remainingValue)}</span></div>
                <div className="flex justify-between"><span>New LTV</span>
                  <span className={`font-bold ${newLTV > 80 ? "text-red-600" : "text-emerald-600"}`}>{newLTV}%</span>
                </div>
                {!ltvOk && <p className="text-xs text-destructive font-medium">⚠ LTV would exceed 100%. Cannot release.</p>}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleRelease} disabled={selectedIds.size === 0 || !ltvOk}>
            Release {selectedIds.size} Item(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
