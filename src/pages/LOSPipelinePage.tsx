import { useState, useMemo } from "react";
import { useLoanApplications, useStageCounts, STAGE_CONFIG, FUNNEL_STAGES } from "@/hooks/useLoanApplications";
import { useBranches } from "@/hooks/useMasters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Clock, CheckCircle2, UserCheck } from "lucide-react";
import { formatINR, formatDateIN, PRODUCT_LABELS } from "@/lib/indian-locale";
import { useNavigate } from "react-router-dom";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";

export default function LOSPipelinePage() {
  const navigate = useNavigate();
  const { data: branches } = useBranches();
  const [stageFilter, setStageFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const { data: stageCounts, isLoading: countsLoading } = useStageCounts();
  const { data: applications, isLoading } = useLoanApplications({
    stage: stageFilter,
    product: productFilter,
    branch: branchFilter,
  });

  // Funnel data
  const funnelData = useMemo(() => {
    if (!stageCounts) return [];
    let cumulative = 0;
    // Count applications that reached at least this stage
    const stageOrder = ["applied", "docs_collected", "valued", "checked", "approved", "disbursed"];
    const atLeast: Record<string, number> = {};
    stageOrder.forEach((s) => {
      atLeast[s] = 0;
    });
    // Sum: an app at "approved" has also passed "applied", "docs_collected", etc.
    Object.entries(stageCounts).forEach(([stage, count]) => {
      if (stage === "rejected") return;
      const idx = stageOrder.indexOf(stage);
      if (idx >= 0) {
        for (let i = 0; i <= idx; i++) {
          atLeast[stageOrder[i]] += count;
        }
      }
    });
    return stageOrder.map((s, i) => ({
      stage: s,
      count: atLeast[s],
      conversion: i > 0 && atLeast[stageOrder[i - 1]] > 0
        ? Math.round((atLeast[s] / atLeast[stageOrder[i - 1]]) * 100)
        : 100,
    }));
  }, [stageCounts]);

  // Metric cards
  const todayApps = useMemo(() =>
    (applications || []).filter((a: any) => isToday(new Date(a.created_at))).length,
    [applications]
  );
  const approvalRate = useMemo(() => {
    if (!stageCounts) return 0;
    const total = Object.values(stageCounts).reduce((s, v) => s + v, 0);
    const approved = (stageCounts.approved || 0) + (stageCounts.disbursed || 0);
    return total > 0 ? Math.round((approved / total) * 100) : 0;
  }, [stageCounts]);
  const totalApps = stageCounts ? Object.values(stageCounts).reduce((s, v) => s + v, 0) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">LOS Pipeline</h1>
        <Button onClick={() => navigate("/transactions/los/new")} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-1" />New Application
        </Button>
      </div>

      {/* Funnel */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-1 overflow-x-auto pb-2">
            {funnelData.map((f, i) => {
              const cfg = STAGE_CONFIG[f.stage];
              const maxCount = funnelData[0]?.count || 1;
              const height = Math.max(20, (f.count / maxCount) * 100);
              return (
                <div key={f.stage} className="flex flex-col items-center min-w-[80px] flex-1">
                  <span className="text-xs font-medium text-muted-foreground mb-1">
                    {i > 0 && <span className="text-[10px]">{f.conversion}% →</span>}
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{ height: `${height}px`, backgroundColor: cfg.color }}
                  />
                  <div className="text-center mt-1">
                    <p className="text-lg font-bold text-foreground">{f.count}</p>
                    <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Apps", value: todayApps, icon: FileText, color: "text-blue-500" },
          { label: "Avg Processing", value: "—", icon: Clock, color: "text-orange-500" },
          { label: "Approval Rate", value: `${approvalRate}%`, icon: CheckCircle2, color: "text-green-500" },
          { label: "Total Pipeline", value: totalApps, icon: UserCheck, color: "text-purple-500" },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{m.value}</p>
                </div>
                <m.icon className={cn("h-8 w-8", m.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(STAGE_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Product" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="GL">Gold Loan</SelectItem>
            <SelectItem value="PO">Purchase Order</SelectItem>
            <SelectItem value="SA">Sale Agreement</SelectItem>
          </SelectContent>
        </Select>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Branch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {(branches || []).map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Applications table */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(applications || []).map((app: any) => (
                <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/transactions/los/${app.id}`)}>
                  <TableCell className="font-mono font-medium">{app.application_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{app.customers?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{app.customers?.code}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{app.product_type}</Badge></TableCell>
                  <TableCell>{formatINR(Number(app.amount_requested), 0)}</TableCell>
                  <TableCell><Badge className={STAGE_CONFIG[app.stage]?.bgClass}>{STAGE_CONFIG[app.stage]?.label}</Badge></TableCell>
                  <TableCell>{app.branches?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{formatDateIN(app.created_at)}</TableCell>
                </TableRow>
              ))}
              {(!applications || applications.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    No applications yet. Click "New Application" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
