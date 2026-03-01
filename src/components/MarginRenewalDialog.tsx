import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatINR, formatDate } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { Loader2, CalendarDays } from "lucide-react";
import { addMonths, format } from "date-fns";

interface MarginRenewalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: any;
}

export default function MarginRenewalDialog({
  open,
  onOpenChange,
  loan,
}: MarginRenewalDialogProps) {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [marginAmount, setMarginAmount] = useState("");
  const [selectedSchemeId, setSelectedSchemeId] = useState(loan.scheme_id || "");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [reference, setReference] = useState("");

  // Fetch SA schemes
  const { data: schemes = [] } = useQuery({
    queryKey: ["loan-schemes-sa", tenantId],
    enabled: !!tenantId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loan_schemes")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("product_type", "SA")
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  const selectedScheme = schemes.find((s: any) => s.id === selectedSchemeId);
  const newExpiry = selectedScheme
    ? format(addMonths(new Date(), selectedScheme.tenure_months), "yyyy-MM-dd")
    : "";

  const renewMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(marginAmount);
      if (amount <= 0) throw new Error("Enter a valid margin amount");
      if (!selectedSchemeId) throw new Error("Select a scheme");

      // 1. Insert margin_renewals
      const { error: mrErr } = await supabase.from("margin_renewals").insert({
        tenant_id: tenantId!,
        loan_id: loan.id,
        margin_amount: amount,
        new_scheme_id: selectedSchemeId,
        old_expiry: loan.maturity_date,
        new_expiry: newExpiry,
        payment_mode: paymentMode,
        payment_reference: reference || null,
        created_by: user?.id,
      });
      if (mrErr) throw mrErr;

      // 2. Update loan
      const { error: loanErr } = await supabase.from("loans").update({
        scheme_id: selectedSchemeId,
        maturity_date: newExpiry,
        rate: selectedScheme?.rate || loan.rate,
        tenure_months: selectedScheme?.tenure_months || loan.tenure_months,
        updated_at: new Date().toISOString(),
      }).eq("id", loan.id);
      if (loanErr) throw loanErr;

      // 3. Post voucher
      await supabase.from("voucher_lines").insert({
        tenant_id: tenantId!,
        voucher_type: "receipt",
        loan_id: loan.id,
        entity_type: "margin_renewal",
        debit_account: paymentMode === "cash" ? "Cash" : "Bank",
        credit_account: "Margin Income",
        amount,
        narration: `Margin renewal for ${loan.loan_number}`,
        created_by: user?.id,
      });

      // 4. Audit log
      await supabase.from("audit_logs").insert({
        tenant_id: tenantId!,
        entity_type: "loan",
        entity_id: loan.id,
        action: "Margin Renewal",
        details: { margin: amount, new_expiry: newExpiry, scheme: selectedScheme?.name },
        performed_by: user?.id,
        performed_by_name: user?.email,
      });

      return amount;
    },
    onSuccess: (amount) => {
      queryClient.invalidateQueries({ queryKey: ["loan-detail", loan.id] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs", "loan", loan.id] });
      toast({ title: "Margin Renewed", description: `${formatINR(amount)} collected. New expiry: ${newExpiry}` });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Margin Renewal
          </DialogTitle>
        </DialogHeader>

        {/* Current agreement summary */}
        <Card className="bg-muted/50">
          <CardContent className="p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agreement</span>
              <span className="font-mono font-medium">{loan.loan_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">{formatINR(loan.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Expiry</span>
              <span>{loan.maturity_date ? formatDate(loan.maturity_date) : "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Margin Payment (₹)</Label>
            <Input
              type="number"
              value={marginAmount}
              onChange={(e) => setMarginAmount(e.target.value)}
              placeholder="Enter margin amount"
            />
          </div>

          <div>
            <Label className="text-xs">New Scheme</Label>
            <Select value={selectedSchemeId} onValueChange={setSelectedSchemeId}>
              <SelectTrigger><SelectValue placeholder="Select scheme" /></SelectTrigger>
              <SelectContent>
                {schemes.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {s.rate}% · {s.tenure_months}mo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {newExpiry && (
            <div className="bg-muted/50 rounded p-3 text-sm flex justify-between">
              <span className="text-muted-foreground">New Expiry</span>
              <span className="font-medium">{formatDate(newExpiry)}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Reference</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Txn ID" />
            </div>
          </div>
        </div>

        <Button
          className="w-full gap-2"
          disabled={!marginAmount || !selectedSchemeId || renewMutation.isPending}
          onClick={() => renewMutation.mutate()}
        >
          {renewMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Renew Margin — {marginAmount ? formatINR(Number(marginAmount)) : "₹0"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
