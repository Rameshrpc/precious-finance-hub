import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatINR, formatWeight, formatDate } from "@/lib/formatters";
import { getLabel } from "@/lib/labels";
import { toast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, ArrowRight } from "lucide-react";

interface ReloanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: any;
  pledgeItems: any[];
  interestRecords: any[];
}

export default function ReloanDialog({
  open,
  onOpenChange,
  loan,
  pledgeItems,
  interestRecords,
}: ReloanDialogProps) {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const unpaidCharges = useMemo(
    () => interestRecords.reduce(
      (s: number, r: any) => s + Number(r.amount) + Number(r.penalty) - Number(r.paid), 0
    ),
    [interestRecords]
  );

  const totalGold = pledgeItems.filter((i: any) => i.metal_type === "gold").reduce((s: number, i: any) => s + Number(i.net_weight), 0);
  const totalSilver = pledgeItems.filter((i: any) => i.metal_type === "silver").reduce((s: number, i: any) => s + Number(i.net_weight), 0);

  const reloanMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const redemptionNumber = `RL${Date.now().toString().slice(-6)}`;

      // 1. Close existing loan
      await supabase.from("loans").update({ status: "closed", updated_at: now }).eq("id", loan.id);

      // 2. Mark all unpaid interest as paid (settled via reloan)
      for (const rec of interestRecords.filter((r: any) => r.status !== "paid")) {
        await supabase.from("interest_records").update({
          paid: Number(rec.amount) + Number(rec.penalty),
          status: "paid",
          payment_date: now,
        }).eq("id", rec.id);
      }

      // 3. Insert redemption record
      await supabase.from("redemptions").insert({
        tenant_id: tenantId!,
        loan_id: loan.id,
        redemption_number: redemptionNumber,
        principal: loan.amount,
        unpaid_charges: unpaidCharges,
        total: Number(loan.amount) + unpaidCharges,
        payment_mode: "reloan",
        notes: "Auto-closed via reloan",
        created_by: user?.id,
      });

      // 4. Audit log
      await supabase.from("audit_logs").insert({
        tenant_id: tenantId!,
        entity_type: "loan",
        entity_id: loan.id,
        action: "Reloan initiated",
        details: { redemption: redemptionNumber, old_loan: loan.loan_number },
        performed_by: user?.id,
        performed_by_name: user?.email,
      });

      return loan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loan-detail", loan.id] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast({
        title: "Old loan closed",
        description: `${loan.loan_number} closed. Creating new transaction with same items...`,
      });
      onOpenChange(false);
      // Navigate to new transaction with pre-filled data
      const params = new URLSearchParams({
        reloanFrom: loan.id,
        customerId: loan.customer_id,
        productType: loan.product_type,
      });
      navigate(`/transactions/new?${params.toString()}`);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" /> Reloan
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          This will close <strong>{loan.loan_number}</strong> and create a new transaction
          with the same customer and pledge items pre-filled.
        </p>

        {/* Current Loan Summary */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan Number</span>
              <span className="font-mono font-medium">{loan.loan_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium">{loan.customer?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Principal</span>
              <span className="font-medium">{formatINR(loan.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unpaid {getLabel(loan.product_type, "charge")}s</span>
              <span className="font-medium">{formatINR(unpaidCharges)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gold</span>
              <span>{formatWeight(totalGold)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Silver</span>
              <span>{formatWeight(totalSilver)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items</span>
              <span>{pledgeItems.length} items</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="bg-destructive/10 text-destructive">Close {loan.loan_number}</Badge>
          <ArrowRight className="h-4 w-4" />
          <Badge variant="outline" className="bg-emerald-100 text-emerald-800">New Transaction</Badge>
        </div>

        <Button
          className="w-full gradient-gold text-accent-foreground font-semibold gap-2"
          disabled={reloanMutation.isPending}
          onClick={() => reloanMutation.mutate()}
        >
          {reloanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Close & Create New Transaction
        </Button>
      </DialogContent>
    </Dialog>
  );
}
