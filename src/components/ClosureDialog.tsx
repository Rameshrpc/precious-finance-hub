import { useState, useMemo } from "react";
import { format } from "date-fns";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatINR, formatWeight, formatDate } from "@/lib/formatters";
import { getLabel } from "@/lib/labels";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const chargeLabel = getLabel(loan.product_type, "charge");

  // Closure form state
  const [closureDate, setClosureDate] = useState<Date>(new Date());
  const [closureType, setClosureType] = useState("full");
  const [releasedItems, setReleasedItems] = useState<Set<string>>(
    new Set(pledgeItems.filter((p: any) => !p.is_released).map((p: any) => p.id))
  );
  const [otherCharges, setOtherCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // Items available for release (not already released)
  const availableItems = useMemo(() => pledgeItems.filter((p: any) => !p.is_released), [pledgeItems]);

  // Calculations
  const principal = Number(loan.amount);
  const unpaidCharges = useMemo(
    () =>
      interestRecords
        .filter((r: any) => r.status !== "paid")
        .reduce((s: number, r: any) => s + Number(r.amount) + Number(r.penalty) - Number(r.paid), 0),
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
  const isPartialRelease = closureType === "partial" || releasedItems.size < availableItems.length;

  const toggleItem = (id: string) => {
    const next = new Set(releasedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setReleasedItems(next);
  };

  const toggleAll = () => {
    if (releasedItems.size === availableItems.length) {
      setReleasedItems(new Set());
    } else {
      setReleasedItems(new Set(availableItems.map((p: any) => p.id)));
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

      // 2. Update loan status (only full closure)
      if (!isPartialRelease || closureType === "full" || closureType === "auction") {
        const { error: loanErr } = await supabase
          .from("loans")
          .update({ status: "closed", updated_at: now })
          .eq("id", loan.id);
        if (loanErr) throw loanErr;
      }

      // 3. Mark pledge items as released
      for (const itemId of releasedIds) {
        const { error } = await supabase
          .from("pledge_items")
          .update({ is_released: true, released_at: now })
          .eq("id", itemId);
        if (error) throw error;
      }

      // 4. Mark all unpaid interest as paid (for full closure)
      if (closureType !== "partial") {
        for (const rec of interestRecords.filter((r: any) => r.status !== "paid")) {
          await supabase
            .from("interest_records")
            .update({ paid: Number(rec.amount) + Number(rec.penalty), status: "paid", payment_date: now })
            .eq("id", rec.id);
        }
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
          closure_type: closureType,
          closure_date: format(closureDate, "yyyy-MM-dd"),
          total,
          items_released: releasedIds.length,
          partial: isPartialRelease,
        },
        performed_by: user?.id,
        performed_by_name: profile?.full_name || user?.email,
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
        description: `${redemptionNumber} completed. Total: ${formatINR(total)}. Loan status updated to Closed.`,
      });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const releasedItemsList = availableItems.filter((i: any) => releasedItems.has(i.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getLabel(loan.product_type, "close")}</DialogTitle>
        </DialogHeader>

        {/* Loan Summary (read-only) */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold">{loan.loan_number}</span>
                <Badge variant="outline" className="bg-accent/15 text-accent border-accent/30">{loan.product_type}</Badge>
              </div>
              <span className="text-sm text-muted-foreground">{loan.customer?.name}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Principal</p>
                <p className="font-medium">{formatINR(principal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding {chargeLabel}</p>
                <p className="font-medium text-destructive">{formatINR(unpaidCharges)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scheme</p>
                <p className="font-medium">{loan.scheme?.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rate</p>
                <p className="font-medium">{loan.rate}% p.m.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Closure Details Form */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Closure Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !closureDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {closureDate ? format(closureDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={closureDate}
                  onSelect={(d) => d && setClosureDate(d)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="text-xs">Closure Type</Label>
            <Select value={closureType} onValueChange={setClosureType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Closure</SelectItem>
                <SelectItem value="partial">Partial Redemption</SelectItem>
                <SelectItem value="auction">Auction Closure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Items to Release */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Items to Release</Label>
            <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs">
              {releasedItems.size === availableItems.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
          {isPartialRelease && closureType !== "partial" && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 p-2 rounded mb-2">
              <AlertTriangle className="h-4 w-4" />
              Partial release — {availableItems.length - releasedItems.size} item(s) will remain pledged
            </div>
          )}
          {availableItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">No items to release</p>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={releasedItems.size === availableItems.length} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Metal</TableHead>
                    <TableHead className="text-right">Net Wt</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox checked={releasedItems.has(item.id)} onCheckedChange={() => toggleItem(item.id)} />
                      </TableCell>
                      <TableCell className="text-sm font-medium">{item.item_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={item.metal_type === "gold" ? "bg-accent/15 text-accent border-accent/30" : "bg-muted text-muted-foreground"}>
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
          )}
        </div>

        {/* Payment Mode */}
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
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Txn ID / Cheque No" />
          </div>
        </div>

        <div>
          <Label className="text-xs">Remarks</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional closure remarks..." rows={2} />
        </div>

        {/* Calculation Summary */}
        <Card className="border-accent/30">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm text-accent">Settlement Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span>Principal Repaid</span>
              <span className="font-medium">{formatINR(principal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{chargeLabel} Cleared</span>
              <span className="font-medium">{formatINR(unpaidCharges)}</span>
            </div>
            {penalty > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Penalty (incl. above)</span>
                <span>{formatINR(penalty)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm items-center">
              <span>Other Charges</span>
              <Input
                type="number"
                value={otherCharges || ""}
                onChange={(e) => setOtherCharges(Number(e.target.value) || 0)}
                className="w-28 h-7 text-right text-sm"
              />
            </div>
            <div className="flex justify-between text-sm items-center">
              <span>Discount (−)</span>
              <Input
                type="number"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-28 h-7 text-right text-sm"
              />
            </div>
            <Separator />
            <div className="flex justify-between pt-1">
              <span className="font-bold text-lg">Total Amount</span>
              <span className="font-bold text-lg">{formatINR(total)}</span>
            </div>
            {releasedItemsList.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Items Released:</p>
                  <div className="flex flex-wrap gap-1">
                    {releasedItemsList.map((item: any) => (
                      <Badge key={item.id} variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                        {item.item_name} ({formatWeight(item.net_weight)})
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2"
            disabled={releasedItems.size === 0 || total <= 0 || closeMutation.isPending}
            onClick={() => closeMutation.mutate()}
          >
            {closeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {CLOSE_LABELS[loan.product_type] || "Confirm Closure"} — {formatINR(total)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}