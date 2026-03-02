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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatINR, formatDate } from "@/lib/formatters";
import { getLabel } from "@/lib/labels";
import { toast } from "@/hooks/use-toast";
import { IndianRupee, Loader2 } from "lucide-react";

interface ChargeCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: any;
  interestRecords: any[];
}

export default function ChargeCollectionDialog({
  open,
  onOpenChange,
  loan,
  interestRecords,
}: ChargeCollectionDialogProps) {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const chargeLabel = getLabel(loan.product_type, "charge");
  const receiptPrefix = getLabel(loan.product_type, "receiptPrefix");

  const unpaidRecords = useMemo(
    () => interestRecords.filter((r: any) => r.status !== "paid"),
    [interestRecords]
  );

  const [selected, setSelected] = useState<Set<string>>(new Set(unpaidRecords.map((r: any) => r.id)));
  const [partialEnabled, setPartialEnabled] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [reference, setReference] = useState("");

  const selectedTotal = useMemo(() => {
    return unpaidRecords
      .filter((r: any) => selected.has(r.id))
      .reduce((s: number, r: any) => s + Number(r.amount) + Number(r.penalty) - Number(r.paid), 0);
  }, [unpaidRecords, selected]);

  const finalAmount = partialEnabled && partialAmount ? Number(partialAmount) : selectedTotal;

  const toggleAll = () => {
    if (selected.size === unpaidRecords.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unpaidRecords.map((r: any) => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const collectMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const receiptNumber = `${receiptPrefix}${Date.now().toString().slice(-6)}`;

      // Update selected interest records
      const selectedRecords = unpaidRecords.filter((r: any) => selected.has(r.id));
      let remaining = finalAmount;

      for (const rec of selectedRecords) {
        const due = Number(rec.amount) + Number(rec.penalty) - Number(rec.paid);
        const paying = Math.min(remaining, due);
        remaining -= paying;

        const newPaid = Number(rec.paid) + paying;
        const newStatus = newPaid >= Number(rec.amount) + Number(rec.penalty) ? "paid" : "partial";

        const { error } = await supabase
          .from("interest_records")
          .update({
            paid: newPaid,
            status: newStatus,
            payment_date: now,
            receipt_number: receiptNumber,
            payment_mode: paymentMode,
          })
          .eq("id", rec.id);
        if (error) throw error;
        if (remaining <= 0) break;
      }

      // Insert voucher line
      await supabase.from("voucher_lines").insert({
        tenant_id: tenantId!,
        voucher_type: "receipt",
        voucher_number: receiptNumber,
        loan_id: loan.id,
        entity_type: "interest_collection",
        debit_account: paymentMode === "cash" ? "Cash" : "Bank",
        credit_account: `${chargeLabel} Income`,
        amount: finalAmount,
        narration: `${chargeLabel} collection for ${loan.loan_number}`,
        created_by: user?.id,
      });

      // Audit log
      await supabase.from("audit_logs").insert({
        tenant_id: tenantId!,
        entity_type: "loan",
        entity_id: loan.id,
        action: `${chargeLabel} collected`,
        details: { amount: finalAmount, receipt: receiptNumber, mode: paymentMode },
        performed_by: user?.id,
        performed_by_name: user?.email,
      });

      return receiptNumber;
    },
    onSuccess: (receiptNumber) => {
      queryClient.invalidateQueries({ queryKey: ["interest-records", loan.id] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs", "loan", loan.id] });
      toast({
        title: `${chargeLabel} Collected`,
        description: `Receipt ${receiptNumber} generated for ${formatINR(finalAmount)}`,
      });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const isOverdue = (rec: any) => new Date(rec.due_date) < new Date() && rec.status !== "paid";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Collect {chargeLabel}</DialogTitle>
        </DialogHeader>

        {/* Loan summary */}
        <Card className="bg-muted/50">
          <CardContent className="p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <div>
                <span className="font-mono font-medium">{loan.loan_number}</span>
                <span className="text-muted-foreground ml-2">{loan.customer?.name}</span>
              </div>
              <Badge variant="outline">{loan.product_type}</Badge>
            </div>
            <div className="flex gap-4 text-muted-foreground">
              <span>Principal: <span className="text-foreground font-medium">{formatINR(loan.amount)}</span></span>
              {loan.scheme?.name && <span>Scheme: <span className="text-foreground">{loan.scheme.name}</span></span>}
              <span>Rate: <span className="text-foreground">{loan.rate}% p.m.</span></span>
            </div>
          </CardContent>
        </Card>

        {/* Charge Due Table */}
        {unpaidRecords.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">No pending {chargeLabel.toLowerCase()} records</div>
        ) : (
          <>
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selected.size === unpaidRecords.length}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">Penalty</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unpaidRecords.map((rec: any) => {
                    const balance = Number(rec.amount) + Number(rec.penalty) - Number(rec.paid);
                    return (
                      <TableRow
                        key={rec.id}
                        className={isOverdue(rec) ? "bg-destructive/5" : rec.status === "pending" ? "bg-warning/5" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selected.has(rec.id)}
                            onCheckedChange={() => toggleOne(rec.id)}
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(rec.period_start)} – {formatDate(rec.period_end)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(rec.due_date)}
                          {isOverdue(rec) && (
                            <Badge variant="outline" className="ml-1 text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                              Overdue
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{formatINR(Number(rec.amount))}</TableCell>
                        <TableCell className="text-right">
                          {Number(rec.penalty) > 0 ? formatINR(Number(rec.penalty)) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatINR(balance)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <Separator />

            {/* Payment Total */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected Total</span>
                <span className="text-lg font-bold">{formatINR(selectedTotal)}</span>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={partialEnabled} onCheckedChange={setPartialEnabled} />
                <Label className="text-sm">Partial payment</Label>
                {partialEnabled && (
                  <Input
                    type="number"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-36"
                  />
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
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Txn ID / Cheque No"
                  />
                </div>
              </div>

              {/* Receipt preview */}
              <div className="bg-muted/50 rounded p-3 text-sm">
                <span className="text-muted-foreground">Receipt: </span>
                <span className="font-mono font-medium">{receiptPrefix}XXXXXX</span>
                <span className="text-muted-foreground ml-2">(auto-generated)</span>
              </div>

              {/* Collect Button */}
              <Button
                className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={selected.size === 0 || finalAmount <= 0 || collectMutation.isPending}
                onClick={() => collectMutation.mutate()}
              >
                {collectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IndianRupee className="h-4 w-4" />
                )}
                Collect {formatINR(finalAmount)}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
