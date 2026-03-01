import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR, formatDate } from "@/lib/formatters";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Shield, User } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  new_loan: "New Loan",
  gold_release: "Gold Release",
  charge_waiver: "Charge Waiver",
  scheme_change: "Scheme Change",
  forfeiture: "Forfeiture",
};

const TYPE_COLORS: Record<string, string> = {
  new_loan: "bg-blue-100 text-blue-800",
  gold_release: "bg-amber-100 text-amber-800",
  charge_waiver: "bg-purple-100 text-purple-800",
  scheme_change: "bg-teal-100 text-teal-800",
  forfeiture: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function ApprovalsPage() {
  const { tenantId } = useTenant();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [actionDialog, setActionDialog] = useState<{ request: any; action: "approve" | "reject" } | null>(null);
  const [comment, setComment] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["approval-requests", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const pendingForMe = requests.filter((r: any) => r.status === "pending");
  const allPending = requests.filter((r: any) => r.status === "pending");
  const approved = requests.filter((r: any) => r.status === "approved");
  const rejected = requests.filter((r: any) => r.status === "rejected");

  const handleAction = async () => {
    if (!actionDialog || !tenantId) return;
    const { request, action } = actionDialog;
    try {
      await supabase
        .from("approval_requests")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          reviewed_by: profile?.id,
          reviewed_by_name: profile?.full_name,
          review_comment: comment || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);
      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      toast.success(`Request ${action === "approve" ? "approved" : "rejected"}`);
      setActionDialog(null);
      setComment("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const ApprovalCard = ({ req, showActions = false }: { req: any; showActions?: boolean }) => (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={TYPE_COLORS[req.request_type] || ""}>{TYPE_LABELS[req.request_type] || req.request_type}</Badge>
              <Badge variant="outline" className={STATUS_COLORS[req.status] || ""}>{req.status}</Badge>
            </div>
            <div className="text-sm space-y-1">
              {req.details?.loan_number && <p className="font-mono text-xs">{req.details.loan_number}</p>}
              {req.details?.customer_name && <p className="font-medium">{req.details.customer_name}</p>}
              <p className="text-lg font-bold">{formatINR(req.amount)}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{req.requested_by_name || "Unknown"}</span>
              <span>·</span>
              <span>{formatDate(req.created_at)}</span>
            </div>
            {req.review_comment && (
              <p className="text-xs bg-muted p-2 rounded mt-1">
                <span className="font-medium">{req.reviewed_by_name}:</span> {req.review_comment}
              </p>
            )}
          </div>
          {showActions && req.status === "pending" && (
            <div className="flex flex-col gap-1">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => { setActionDialog({ request: req, action: "approve" }); setComment(""); }}>
                <CheckCircle2 className="h-3.5 w-3.5" />Approve
              </Button>
              <Button size="sm" variant="destructive" className="gap-1" onClick={() => { setActionDialog({ request: req, action: "reject" }); setComment(""); }}>
                <XCircle className="h-3.5 w-3.5" />Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" />{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold font-serif">Approval Queue</h1>
      </div>

      <Tabs defaultValue="pending-me">
        <TabsList>
          <TabsTrigger value="pending-me">Pending for Me ({pendingForMe.length})</TabsTrigger>
          <TabsTrigger value="all-pending">All Pending ({allPending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending-me" className="mt-4 space-y-3">
          {pendingForMe.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground"><Clock className="mx-auto h-8 w-8 mb-2 opacity-40" /><p>No pending approvals</p></CardContent></Card>
          ) : pendingForMe.map((req: any) => <ApprovalCard key={req.id} req={req} showActions />)}
        </TabsContent>

        <TabsContent value="all-pending" className="mt-4 space-y-3">
          {allPending.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No pending approvals</CardContent></Card>
          ) : allPending.map((req: any) => <ApprovalCard key={req.id} req={req} showActions />)}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-3">
          {approved.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No approved requests</CardContent></Card>
          ) : approved.map((req: any) => <ApprovalCard key={req.id} req={req} />)}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4 space-y-3">
          {rejected.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No rejected requests</CardContent></Card>
          ) : rejected.map((req: any) => <ApprovalCard key={req.id} req={req} />)}
        </TabsContent>
      </Tabs>

      {/* Approve/Reject Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog?.action === "approve" ? "Approve Request" : "Reject Request"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Card>
              <CardContent className="p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Type</span><span className="font-medium">{TYPE_LABELS[actionDialog?.request?.request_type] || ""}</span></div>
                <div className="flex justify-between"><span>Amount</span><span className="font-medium">{formatINR(actionDialog?.request?.amount || 0)}</span></div>
                <div className="flex justify-between"><span>Requested by</span><span className="font-medium">{actionDialog?.request?.requested_by_name}</span></div>
              </CardContent>
            </Card>
            <div>
              <Label>{actionDialog?.action === "approve" ? "Comment (optional)" : "Reason for rejection"}</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={actionDialog?.action === "reject" ? "Enter reason..." : "Add a comment..."} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button
              variant={actionDialog?.action === "approve" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={actionDialog?.action === "reject" && !comment.trim()}
            >
              {actionDialog?.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
