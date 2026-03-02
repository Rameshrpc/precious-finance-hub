import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { formatINR, formatCompact, formatDate } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  IndianRupee, Landmark, TrendingUp, TrendingDown,
  ArrowUpRight, AlertTriangle, Target, FilePlus, Receipt, Gavel, XCircle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const DashboardHome = () => {
  const { profile } = useAuth();
  const { tenantId } = useTenant();
  const navigate = useNavigate();

  // Active loans
  const { data: loans = [] } = useQuery({
    queryKey: ["dashboard-loans", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("loans")
        .select("*, customers(name, code)")
        .eq("tenant_id", tenantId).eq("status", "active").limit(500);
      return data || [];
    },
    enabled: !!tenantId,
  });

  // Overdue loans count
  const { data: overdueLoans = [] } = useQuery({
    queryKey: ["dashboard-overdue", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("interest_records")
        .select("loan_id")
        .eq("tenant_id", tenantId).eq("status", "overdue");
      // unique loan ids
      const ids = [...new Set((data || []).map((r: any) => r.loan_id))];
      return ids;
    },
    enabled: !!tenantId,
  });

  // Collections today
  const { data: collectionsToday = 0 } = useQuery({
    queryKey: ["dashboard-collections-today", tenantId],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase.from("interest_records")
        .select("paid")
        .eq("tenant_id", tenantId).eq("status", "paid")
        .gte("payment_date", today + "T00:00:00")
        .lte("payment_date", today + "T23:59:59");
      return (data || []).reduce((s: number, r: any) => s + Number(r.paid), 0);
    },
    enabled: !!tenantId,
  });

  // Recent loan applications (last 5)
  const { data: recentApps = [] } = useQuery({
    queryKey: ["dashboard-recent-apps", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("loan_applications")
        .select("*, customers(name)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!tenantId,
  });

  // Upcoming interest due (next 7 days)
  const { data: upcomingDue = [] } = useQuery({
    queryKey: ["dashboard-upcoming-due", tenantId],
    queryFn: async () => {
      const now = new Date();
      const in7 = new Date(now.getTime() + 7 * 86400000);
      const { data } = await supabase.from("interest_records")
        .select("*, loans(loan_number, customers(name))")
        .eq("tenant_id", tenantId).eq("status", "pending")
        .gte("due_date", now.toISOString().slice(0, 10))
        .lte("due_date", in7.toISOString().slice(0, 10))
        .order("due_date").limit(10);
      return data || [];
    },
    enabled: !!tenantId,
  });

  // Loan applications by stage for funnel
  const { data: appsByStage = [] } = useQuery({
    queryKey: ["dashboard-funnel", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("loan_applications")
        .select("stage")
        .eq("tenant_id", tenantId);
      const counts: Record<string, number> = {};
      (data || []).forEach((a: any) => { counts[a.stage] = (counts[a.stage] || 0) + 1; });
      return ["applied", "docs_pending", "valuation", "approved", "disbursed"].map((s) => ({
        stage: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        count: counts[s] || 0,
      }));
    },
    enabled: !!tenantId,
  });

  const totalPrincipal = loans.reduce((s: number, l: any) => s + Number(l.amount), 0);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const stageBadgeColor = (stage: string) => {
    const s = stage.toLowerCase();
    if (s === "applied") return "bg-blue-100 text-blue-800 border-blue-200";
    if (s === "approved") return "bg-green-100 text-green-800 border-green-200";
    if (s === "disbursed") return "bg-accent/20 text-accent border-accent/30";
    if (s.includes("doc")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (s.includes("valuation")) return "bg-purple-100 text-purple-800 border-purple-200";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {greeting()}, {profile?.full_name || "User"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Portfolio overview</p>
      </div>

      {/* Row 1: Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-accent/30">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Landmark className="h-3.5 w-3.5" /> Total Active Loans
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold">{loans.length}</p>
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <IndianRupee className="h-3.5 w-3.5" /> Principal Outstanding
            </div>
            <p className="text-2xl font-bold mt-1">{formatCompact(totalPrincipal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Target className="h-3.5 w-3.5" /> Collections Today
            </div>
            <p className="text-2xl font-bold mt-1">{formatINR(collectionsToday)}</p>
          </CardContent>
        </Card>
        <Card className={overdueLoans.length > 0 ? "border-destructive/50" : ""}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <AlertTriangle className="h-3.5 w-3.5" /> Overdue Loans
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className={`text-2xl font-bold ${overdueLoans.length > 0 ? "text-destructive" : ""}`}>
                {overdueLoans.length}
              </p>
              {overdueLoans.length > 0 && (
                <Badge variant="destructive" className="text-[10px]">Action needed</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Recent Applications + Upcoming Due */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FilePlus className="h-4 w-4 text-accent" /> Recent Loan Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">App #</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Stage</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentApps.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.application_number}</TableCell>
                    <TableCell className="text-xs">{a.customers?.name || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{a.product_type}</Badge></TableCell>
                    <TableCell className="text-xs">{formatINR(a.amount_requested)}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${stageBadgeColor(a.stage)}`}>{a.stage}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(a.created_at)}</TableCell>
                  </TableRow>
                ))}
                {!recentApps.length && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6 text-xs">No recent applications</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" /> Upcoming Interest Due (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Loan #</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Due Date</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingDue.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.loans?.loan_number || "—"}</TableCell>
                    <TableCell className="text-xs">{r.loans?.customers?.name || "—"}</TableCell>
                    <TableCell className="text-xs">{formatDate(r.due_date)}</TableCell>
                    <TableCell className="text-xs font-medium">{formatINR(r.amount)}</TableCell>
                  </TableRow>
                ))}
                {!upcomingDue.length && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-xs">No dues in next 7 days</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Quick Actions + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-16 flex flex-col gap-1 border-accent/30 hover:bg-accent/10" onClick={() => navigate("/transactions/los/new")}>
                <FilePlus className="h-5 w-5 text-accent" />
                <span className="text-xs">New Application</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1 border-accent/30 hover:bg-accent/10" onClick={() => navigate("/transactions")}>
                <Receipt className="h-5 w-5 text-accent" />
                <span className="text-xs">Collect Charges</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1 border-accent/30 hover:bg-accent/10" onClick={() => navigate("/transactions")}>
                <XCircle className="h-5 w-5 text-accent" />
                <span className="text-xs">Close Loan</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1 border-accent/30 hover:bg-accent/10" onClick={() => navigate("/transactions/auctions")}>
                <Gavel className="h-5 w-5 text-accent" />
                <span className="text-xs">Auction</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Application Funnel</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={appsByStage} layout="vertical">
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="stage" type="category" width={90} className="text-xs" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [v, "Applications"]} />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
