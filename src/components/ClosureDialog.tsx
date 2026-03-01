import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatINR, formatWeight, formatDate } from "@/lib/formatters";
import { getLabel } from "@/lib/labels";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";

const CLOSE_LABELS: Record<string, string> = {
  GL: "Complete Redemption",
  PO: "Complete Buyback",
  SA: "Complete Repurchase",
};

const RECEIPT_PREFIX: Record<string, string> = {
  GL: "RED",
  PO: "BP",
  SA: "SAR",
};

interface ClosureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: any;
  pledgeItems: any[];
  interestRecords: any[];
}

export default function ClosureDialog({
  open,
  onOpenChange,
  loan,
  pledgeItems,
  interestRecords,
}: ClosureDialogProps) {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const chargeLabel = getLabel(loan.product_type, "charge");

  // Items to release
  const [releasedItems, setReleasedItems] = useState<Set<string>>(
    new Set(pledgeItems.map((p: any) => p.id))
  );

  // Settlement adjustments
  const [otherCharges, setOtherCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // Calculations
  const principal = Number(loan.amount);
  const unpaidCharges = useMemo(
    () =>
      interestRecords.reduce(
        (s: number, r: any) => s + Number(r.amount) + Number(r.penalty) - Number(r.paid),
        0
      ),
    [interestRecords]
  );
  const penalty = useMemo(
    () =>
      interestRecords
        .filter((r: any) => new Date(r.due_date) < new Date() && r.status !== "paid")
        .reduce((s: number, r: any) => s + Number(r.penalty), 0),
    [interestRecords]
  );

  const total = principal + unpaidCharges + otherCharges - discount;
  const isPartialRelease = releasedItems.size < pledgeItems.length;

  const toggleItem = (id: string) => {
    const next = new Set(releasedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setReleasedItems(next);
  };

  const toggleAll = () => {
    if (releasedItems.size === pledgeItems.length) {
      setReleasedItems(new Set());
    } else {
      setReleasedItems(new Set(pledgeItems.map((p: any) => p.id)));
    }
  };

  const closeMutation = useMutation({
    mutationFn: async () => {
      const receiptPrefix = RECEIPT_PREFIX[loan.product_type] || "CLS";
      const redemptionNumber = `${receiptPrefix}${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();
      const releasedIds = Array.from(releasedItems);

      // 1. Insert redemption
      const { error: redErr } = await supabase.from("redemptions").insert({
        tenant_id: tenantId!,
        loan_id: loan.id,
        redemption_number: redemptionNumber,
        principal,
        unpaid_charges: unpaidCharges,
        penalty,
        other_charges: otherCharges,
        discount,
        total,
        payment_mode: paymentMode,
        payment_reference: reference || null,
        items_released: releasedIds,
        partial_release: isPartialRelease,
        notes: notes || null,
        created_by: user?.id,
      });
      if (redErr) throw redErr;

      // 2. Update loan status
      const { error: loanErr } = await supabase
        .from("loans")
        .update({ status: "closed", updated_at: now })
        .eq("id", loan.id);
      if (loanErr) throw loanErr;

      // 3. Mark pledge items as released
      for (const itemId of releasedIds) {
        const { error } = await supabase
          .from("pledge_items")
          .update({ is_released: true, released_at: now })
          .eq("id", itemId);
        if (error) throw error;
      }

      // 4. Mark all unpaid interest as paid
      for (const rec of interestRecords.filter((r: any) => r.status !== "paid")) {
        await supabase
          .from("interest_records")
          .update({ paid: Number(rec.amount) + Number(rec.penalty), status: "paid", payment_date: now })
          .eq("id", rec.id);
      }

      // 5. Post voucher
      await supabase.from("voucher_lines").insert({
        tenant_id: tenantId!,
        voucher_type: "closure",
        voucher_number: redemptionNumber,
        loan_id: loan.id,
        entity_type: "redemption",
        debit_account: paymentMode === "cash" ? "Cash" : "Bank",
        credit_account: "Loan Principal",
        amount: total,
        narration: `${getLabel(loan.product_type, "close")} for ${loan.loan_number}`,
        created_by: user?.id,
      });

      // 6. Audit log
      await supabase.from("audit_logs").insert({
        tenant_id: tenantId!,
        entity_type: "loan",
        entity_id: loan.id,
        action: getLabel(loan.product_type, "close"),
        details: {
          redemption_number: redemptionNumber,
          total,
          items_released: releasedIds.length,
          partial: isPartialRelease,
        },
        performed_by: user?.id,
        performed_by_name: user?.email,
      });

      return redemptionNumber;
    },
    onSuccess: (redemptionNumber) => {
      queryClient.invalidateQueries({ queryKey: ["loan-detail", loan.id] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["pledge-items", loan.id] });
      queryClient.invalidateQueries({ queryKey: ["interest-records", loan.id] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs", "loan", loan.id] });
      toast({
        title: getLabel(loan.product_type, "close"),
        description: `${redemptionNumber} completed. Total: ${formatINR(total)}`,
      });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getLabel(loan.product_type, "close")}</DialogTitle>
        </DialogHeader>

        {/* Settlement Calculation */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Principal</span>
              <span className="font-medium">{formatINR(principal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Unpaid {chargeLabel}s</span>
              <span className="font-medium">{formatINR(unpaidCharges)}</span>
            </div>
            {penalty > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Penalty (included above)</span>
                <span>{formatINR(penalty)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm items-center">
              <span>Other Charges</span>
              <Input
                type="number"
                value={otherCharges || ""}
                onChange={(e) => setOtherCharges(Number(e.target.value) || 0)}
                className="w-28 h-8 text-right"
              />
            </div>
            <div className="flex justify-between text-sm items-center">
              <span>Discount (−)</span>
              <Input
                type="number"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-28 h-8 text-right"
              />
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-bold text-lg">TOTAL</span>
              <span className="font-bold text-lg">{formatINR(total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Gold Release */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Items to Release</Label>
            <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs">
              {releasedItems.size === pledgeItems.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
          {isPartialRelease && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 p-2 rounded mb-2">
              <AlertTriangle className="h-4 w-4" />
              Partial release — {pledgeItems.length - releasedItems.size} item(s) will remain pledged
            </div>
          )}
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={releasedItems.size === pledgeItems.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Metal</TableHead>
                  <TableHead className="text-right">Net Wt</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pledgeItems.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={releasedItems.has(item.id)}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                    </TableCell>
                    <TableCell className="text-sm font-medium">{item.item_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={item.metal_type === "gold" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}>
                        {item.metal_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{formatWeight(item.net_weight)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatINR(item.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Payment */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Payment Mode</Label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Reference</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Txn ID / Cheque No"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional closure notes..."
            rows={2}
          />
        </div>

        {/* Complete Button */}
        <Button
          className="w-full gradient-gold text-accent-foreground font-semibold gap-2"
          disabled={releasedItems.size === 0 || total <= 0 || closeMutation.isPending}
          onClick={() => closeMutation.mutate()}
        >
          {closeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {CLOSE_LABELS[loan.product_type] || "Complete Closure"} — {formatINR(total)}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
