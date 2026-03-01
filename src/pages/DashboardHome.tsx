import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { formatINR, formatCompact } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/formatters";
import { classifyLoan, isNPA } from "@/lib/npaEngine";
import {
  IndianRupee, Landmark, ShoppingCart, ScrollText, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Target, BarChart3
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const DashboardHome = () => {
  const { profile, roles } = useAuth();
  const { tenantId } = useTenant();

  // Market rates
  const { data: rates } = useQuery({
    queryKey: ["dashboard-rates", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("market_rates").select("*")
        .eq("tenant_id", tenantId).order("rate_date", { ascending: false }).limit(2);
      return data || [];
    },
  });

  // All active loans
  const { data: loans } = useQuery({
    queryKey: ["dashboard-loans", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("loans")
        .select("*, customers(name, code, phone), interest_records(status, due_date)")
        .eq("tenant_id", tenantId).eq("status", "active").limit(500);
      return data || [];
    },
  });

  // Recent loans
  const { data: recentLoans } = useQuery({
    queryKey: ["dashboard-recent", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("loans").select("*, customers(name)")
        .eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
  });

  // Interest collected this month
  const { data: collections } = useQuery({
    queryKey: ["dashboard-collections", tenantId],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data } = await supabase.from("interest_records").select("paid, status")
        .eq("tenant_id", tenantId).eq("status", "paid")
        .gte("payment_date", startOfMonth.toISOString()).limit(1000);
      return data || [];
    },
  });

  const allLoans = loans || [];
  const todayRate = rates?.[0];
  const yesterdayRate = rates?.[1];

  // KPIs
  const totalAUM = allLoans.reduce((s, l: any) => s + Number(l.amount), 0);
  const goldAUM = allLoans.filter((l: any) => l.gold_value > 0).reduce((s, l: any) => s + Number(l.gold_value), 0);
  const silverAUM = allLoans.filter((l: any) => l.silver_value > 0).reduce((s, l: any) => s + Number(l.silver_value), 0);
  const glCount = allLoans.filter((l: any) => l.product_type === "GL").length;
  const poCount = allLoans.filter((l: any) => l.product_type === "PO").length;
  const saCount = allLoans.filter((l: any) => l.product_type === "SA").length;
  const collectedThisMonth = (collections || []).reduce((s, r: any) => s + Number(r.paid), 0);

  // Overdue + NPA
  const loansWithDPD = allLoans.map((l: any) => {
    const overdue = (l.interest_records || []).filter((r: any) => r.status === "overdue" || r.status === "pending");
    const oldestDue = overdue.length > 0 ? overdue.sort((a: any, b: any) => a.due_date.localeCompare(b.due_date))[0]?.due_date : null;
    const dpd = oldestDue ? Math.max(0, Math.floor((Date.now() - new Date(oldestDue).getTime()) / 86400000)) : 0;
    return { ...l, dpd, ...classifyLoan(dpd) };
  });
  const overdueLoans = loansWithDPD.filter((l: any) => l.dpd > 0);
  const overdueAmount = overdueLoans.reduce((s, l: any) => s + Number(l.amount), 0);
  const npaLoans = loansWithDPD.filter((l: any) => isNPA(l.classification));
  const npaPercent = totalAUM > 0 ? ((npaLoans.reduce((s, l: any) => s + Number(l.amount), 0) / totalAUM) * 100).toFixed(1) : "0";

  // Rate changes
  const goldChange = todayRate && yesterdayRate ? ((todayRate.gold_22k - yesterdayRate.gold_22k) / yesterdayRate.gold_22k * 100).toFixed(1) : "0";
  const silverChange = todayRate && yesterdayRate ? ((todayRate.silver_per_kg - yesterdayRate.silver_per_kg) / yesterdayRate.silver_per_kg * 100).toFixed(1) : "0";

  // Top 10 overdue
  const top10Overdue = [...overdueLoans].sort((a: any, b: any) => b.dpd - a.dpd).slice(0, 10);

  // Mock AUM trend data
  const aumTrend = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    return { month: d.toLocaleString("en", { month: "short" }), GL: Math.round(totalAUM * 0.6 * (0.8 + i * 0.02)), PO: Math.round(totalAUM * 0.25 * (0.8 + i * 0.02)), SA: Math.round(totalAUM * 0.15 * (0.8 + i * 0.02)) };
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {greeting()}, {profile?.full_name || "User"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Portfolio overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="border-gold/30">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><IndianRupee className="h-3.5 w-3.5" /> Total AUM</div>
            <p className="text-xl font-bold mt-1">{formatCompact(totalAUM)}</p>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">Au {formatCompact(goldAUM)}</Badge>
              <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-600 border-slate-200">Ag {formatCompact(silverAUM)}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><Landmark className="h-3.5 w-3.5" /> Active Txns</div>
            <p className="text-xl font-bold mt-1">{allLoans.length}</p>
            <div className="flex gap-1 mt-1">
              <Badge variant="secondary" className="text-[9px]">GL {glCount}</Badge>
              <Badge variant="secondary" className="text-[9px]">PO {poCount}</Badge>
              <Badge variant="secondary" className="text-[9px]">SA {saCount}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><Target className="h-3.5 w-3.5" /> Collection (Month)</div>
            <p className="text-xl font-bold mt-1">{formatCompact(collectedThisMonth)}</p>
          </CardContent>
        </Card>
        <Card className={overdueAmount > totalAUM * 0.1 ? "border-destructive/50" : ""}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><AlertTriangle className="h-3.5 w-3.5" /> Overdue</div>
            <p className={`text-xl font-bold mt-1 ${overdueAmount > totalAUM * 0.1 ? "text-destructive" : ""}`}>{formatCompact(overdueAmount)}</p>
            <p className="text-[10px] text-muted-foreground">{overdueLoans.length} loans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><BarChart3 className="h-3.5 w-3.5" /> NPA %</div>
            <p className={`text-xl font-bold mt-1 ${Number(npaPercent) > 5 ? "text-destructive" : ""}`}>{npaPercent}%</p>
            <p className="text-[10px] text-muted-foreground">{npaLoans.length} NPA loans</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">AUM Trend (12 months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={aumTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(v) => formatCompact(v)} className="text-xs" />
                <Tooltip formatter={(v: number) => formatINR(v)} />
                <Legend />
                <Area type="monotone" dataKey="GL" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" />
                <Area type="monotone" dataKey="PO" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.3)" />
                <Area type="monotone" dataKey="SA" stackId="1" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.1)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Today's Rates</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">Au 22K</Badge>
                  <span className="font-bold">{formatINR(todayRate?.gold_22k || 6842)}/g</span>
                </div>
                <span className={`text-xs flex items-center gap-0.5 ${Number(goldChange) >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {Number(goldChange) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {goldChange}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-[10px]">Au 24K</Badge>
                  <span className="font-bold">{formatINR(todayRate?.gold_24k || 7250)}/g</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-100 text-gray-600 border-gray-300 text-[10px]">Ag</Badge>
                  <span className="font-bold">{formatINR(todayRate?.silver_per_kg || 92)}/g</span>
                </div>
                <span className={`text-xs flex items-center gap-0.5 ${Number(silverChange) >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {Number(silverChange) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {silverChange}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Tabs + Tables */}
      <Tabs defaultValue="overdue">
        <TabsList>
          <TabsTrigger value="overdue">Top 10 Overdue</TabsTrigger>
          <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
          {glCount > 0 && <TabsTrigger value="gl">GL Metrics</TabsTrigger>}
          {poCount > 0 && <TabsTrigger value="po">PO Metrics</TabsTrigger>}
          {saCount > 0 && <TabsTrigger value="sa">SA Metrics</TabsTrigger>}
        </TabsList>
        <TabsContent value="overdue">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Loan #</TableHead><TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>DPD</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {top10Overdue.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.loan_number}</TableCell>
                    <TableCell className="text-xs">{l.customers?.name}</TableCell>
                    <TableCell className="text-xs">{formatINR(l.amount)}</TableCell>
                    <TableCell><Badge variant="destructive" className="text-[10px]">{l.dpd}</Badge></TableCell>
                  </TableRow>
                ))}
                {top10Overdue.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No overdue loans</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="recent">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Loan #</TableHead><TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(recentLoans || []).map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.loan_number}</TableCell>
                    <TableCell className="text-xs">{l.customers?.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{l.product_type}</Badge></TableCell>
                    <TableCell className="text-xs">{formatINR(l.amount)}</TableCell>
                    <TableCell className="text-xs">{formatDate(l.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        {["gl", "po", "sa"].map((pt) => {
          const ptLoans = loansWithDPD.filter((l: any) => l.product_type === pt.toUpperCase());
          const ptAUM = ptLoans.reduce((s, l: any) => s + Number(l.amount), 0);
          const ptOverdue = ptLoans.filter((l: any) => l.dpd > 0).length;
          const ptNPA = ptLoans.filter((l: any) => isNPA(l.classification)).length;
          return (
            <TabsContent key={pt} value={pt}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Active</p><p className="text-lg font-bold">{ptLoans.length}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">AUM</p><p className="text-lg font-bold">{formatCompact(ptAUM)}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Overdue</p><p className="text-lg font-bold">{ptOverdue}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">NPA</p><p className="text-lg font-bold text-destructive">{ptNPA}</p></CardContent></Card>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default DashboardHome;
