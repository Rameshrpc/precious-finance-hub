import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { formatINR } from "@/lib/formatters";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

interface BulkCollectDialogProps {
  open: boolean;
  onClose: () => void;
  loans: any[];
}

export default function BulkCollectDialog({ open, onClose, loans }: BulkCollectDialogProps) {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(0);

  const totalDue = loans.reduce((s, l) => s + Number(l.dueAmount || 0), 0);

  const handleCollect = async () => {
    setProcessing(true);
    setProgress(0);
    setCompleted(0);
    let done = 0;
    for (const loan of loans) {
      try {
        // Mark pending interest records as paid
        await supabase.from("interest_records")
          .update({ status: "paid", payment_date: new Date().toISOString(), payment_mode: "cash", paid: loan.dueAmount || 0 })
          .eq("loan_id", loan.id).in("status", ["pending", "overdue"]);
        done++;
      } catch (e) {
        console.error("Failed for", loan.loan_number, e);
      }
      setCompleted(done);
      setProgress(Math.round((done / loans.length) * 100));
    }
    setProcessing(false);
    toast.success(`Collected ${done}/${loans.length} loans`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Bulk Collect — {loans.length} Loans</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-center py-4">
            <p className="text-3xl font-bold">{formatINR(totalDue)}</p>
            <p className="text-sm text-muted-foreground">Total due from {loans.length} loans</p>
          </div>
          {processing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-center text-muted-foreground">{completed}/{loans.length} processed</p>
            </div>
          )}
          {!processing && completed > 0 && (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{completed} loans collected successfully</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {!processing && completed === 0 && (
            <Button onClick={handleCollect}>Confirm & Collect</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
