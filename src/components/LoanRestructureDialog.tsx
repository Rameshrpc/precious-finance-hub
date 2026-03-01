import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatINR } from "@/lib/formatters";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: any;
}

export default function LoanRestructureDialog({ open, onOpenChange, loan }: Props) {
  const { tenantId } = useTenant();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [newRate, setNewRate] = useState(String(loan?.rate || ""));
  const [newTenure, setNewTenure] = useState(String(loan?.tenure_months || ""));
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) { toast.error("Reason is required"); return; }
    setSubmitting(true);
    try {
      // Create approval request for maker-checker
      await supabase.from("approval_requests").insert({
        tenant_id: tenantId!,
        request_type: "scheme_change",
        entity_type: "loan",
        entity_id: loan.id,
        amount: loan.amount,
        requested_by: profile?.id,
        requested_by_name: profile?.full_name,
        details: {
          loan_number: loan.loan_number,
          customer_name: loan.customer?.name,
          old_rate: loan.rate,
          new_rate: parseFloat(newRate),
          old_tenure: loan.tenure_months,
          new_tenure: parseInt(newTenure),
          reason,
        },
      });

      await supabase.from("audit_logs").insert({
        tenant_id: tenantId!,
        entity_type: "loan",
        entity_id: loan.id,
        action: "Restructure Requested",
        performed_by: profile?.id,
        performed_by_name: profile?.full_name,
        details: { old_rate: loan.rate, new_rate: parseFloat(newRate), old_tenure: loan.tenure_months, new_tenure: parseInt(newTenure), reason },
      });

      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      toast.success("Restructure request submitted for approval");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
    setSubmitting(false);
  };

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Loan Restructuring</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-3 text-sm space-y-1">
              <p className="font-medium text-base">{loan.loan_number}</p>
              <div className="flex justify-between"><span>Current Rate</span><span className="font-medium">{loan.rate}% p.m.</span></div>
              <div className="flex justify-between"><span>Current Tenure</span><span className="font-medium">{loan.tenure_months} months</span></div>
              <div className="flex justify-between"><span>Principal</span><span className="font-medium">{formatINR(loan.amount)}</span></div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>New Rate (% p.m.)</Label>
              <Input type="number" step="0.01" value={newRate} onChange={(e) => setNewRate(e.target.value)} />
            </div>
            <div>
              <Label>New Tenure (months)</Label>
              <Input type="number" value={newTenure} onChange={(e) => setNewTenure(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Reason for Restructuring *</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this restructuring is needed..." />
          </div>

          <p className="text-xs text-muted-foreground">⚠ This will create an approval request. Changes apply to future charges only after approval.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>Submit for Approval</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
