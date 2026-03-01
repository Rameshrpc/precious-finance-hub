import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR, formatDate } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import {
  Play, Loader2, CheckCircle2, AlertTriangle, XCircle,
  Clock, TrendingUp, AlertOctagon, CalendarCheck,
} from "lucide-react";

const STATUS_ICONS: Record<string, any> = {
  completed: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  completed_with_errors: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
  failed: <XCircle className="h-4 w-4 text-red-600" />,
  running: <Loader2 className="h-4 w-4 animate-spin text-blue-600" />,
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-800",
  completed_with_errors: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
  running: "bg-blue-100 text-blue-800",
};

export default function CronStatusPage() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  // Fetch recent cron runs
  const { data: cronRuns, isLoading } = useQuery({
    queryKey: ["cron-runs", tenantId],
    enabled: !!tenantId,
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cron_runs")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch today's stats
  const { data: stats } = useQuery({
    queryKey: ["cron-stats", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const [pendingRes, overdueRes, maturedRes] = await Promise.all([
        supabase
          .from("interest_records")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId!)
          .in("status", ["pending", "due"]),
        supabase
          .from("interest_records")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId!)
          .eq("status", "overdue"),
        supabase
          .from("loans")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId!)
          .eq("status", "matured"),
      ]);

      return {
        pendingCharges: pendingRes.count || 0,
        overdueCount: overdueRes.count || 0,
        maturedLoans: maturedRes.count || 0,
      };
    },
  });

  // Run Now mutation
  const runNowMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("daily-cron", {
        body: { tenant_id: tenantId, triggered_by: "manual" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cron-runs"] });
      queryClient.invalidateQueries({ queryKey: ["cron-stats"] });
      toast({ title: "Cron Job Completed", description: "Daily processing finished successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Cron Error", description: err.message, variant: "destructive" });
    },
  });

  const lastRun = cronRuns?.[0];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cron Status</h1>
          <p className="text-sm text-muted-foreground">Daily charge accrual, overdue marking & loan status engine</p>
        </div>
        <Button
          onClick={() => runNowMutation.mutate()}
          disabled={runNowMutation.isPending}
          className="gap-2"
        >
          {runNowMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run Now
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Last Run</span>
            </div>
            {lastRun ? (
              <>
                <p className="text-sm font-medium">
                  {new Date(lastRun.started_at).toLocaleString("en-IN", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {STATUS_ICONS[lastRun.status]}
                  <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[lastRun.status] || ""}`}>
                    {lastRun.status}
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Never run</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Pending Charges</span>
            </div>
            <p className="text-2xl font-bold">{stats?.pendingCharges ?? 0}</p>
            <p className="text-xs text-muted-foreground">Due today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertOctagon className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{stats?.overdueCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Unpaid past due</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Matured Loans</span>
            </div>
            <p className="text-2xl font-bold">{stats?.maturedLoans ?? 0}</p>
            <p className="text-xs text-muted-foreground">Past maturity</p>
          </CardContent>
        </Card>
      </div>

      {/* Last Run Details */}
      {lastRun && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Last Run Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{lastRun.charges_accrued}</p>
                <p className="text-xs text-muted-foreground">Charges Accrued</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{lastRun.overdue_marked}</p>
                <p className="text-xs text-muted-foreground">Marked Overdue</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{lastRun.loans_updated}</p>
                <p className="text-xs text-muted-foreground">Loans Updated</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{lastRun.errors}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
            {lastRun.errors > 0 && lastRun.error_details && (
              <div className="mt-3 p-3 bg-destructive/5 rounded text-xs max-h-32 overflow-y-auto">
                {(lastRun.error_details as any[]).slice(0, 10).map((e: any, i: number) => (
                  <p key={i} className="text-destructive">{e.step}: {e.error}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Run History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Run History</CardTitle>
        </CardHeader>
        <CardContent>
          {(!cronRuns || cronRuns.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-6">No runs yet. Click "Run Now" to execute the daily cron job.</p>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Started</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Triggered By</TableHead>
                    <TableHead className="text-right">Accrued</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                    <TableHead className="text-right">Errors</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cronRuns.map((run: any) => {
                    const duration = run.completed_at
                      ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                      : null;
                    return (
                      <TableRow key={run.id}>
                        <TableCell className="text-sm">
                          {new Date(run.started_at).toLocaleString("en-IN", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {STATUS_ICONS[run.status]}
                            <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[run.status] || ""}`}>
                              {run.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm capitalize">{run.triggered_by}</TableCell>
                        <TableCell className="text-right">{run.charges_accrued}</TableCell>
                        <TableCell className="text-right">{run.overdue_marked}</TableCell>
                        <TableCell className="text-right">{run.loans_updated}</TableCell>
                        <TableCell className="text-right">
                          {run.errors > 0 ? (
                            <span className="text-destructive font-medium">{run.errors}</span>
                          ) : (
                            "0"
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {duration !== null ? `${duration}s` : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
