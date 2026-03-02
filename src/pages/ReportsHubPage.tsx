import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useQuery } from "@tanstack/react-query";
import { formatINR, formatDate, formatCompact } from "@/lib/formatters";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Download, TrendingUp, AlertTriangle, Building2, IndianRupee,
  Landmark, BarChart3, PieChart as PieIcon,
} from "lucide-react";
import { differenceInDays, format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";

const CHART_COLORS = [
  "hsl(204, 62%, 28%)", // navy
  "hsl(49, 89%, 38%)",  // gold
  "hsl(145, 63%, 42%)", // success
  "hsl(36, 100%, 50%)", // warning
  "hsl(0, 72%, 51%)",   // destructive
  "hsl(200, 5%, 53%)",  // silver
];

function exportCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${r[h] ?? ""}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.csv`;
  a.click();
}

export default function ReportsHubPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Business intelligence dashboard</p>
      </div>
      <Tabs defaultValue="portfolio" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="portfolio" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Portfolio Summary</TabsTrigger>
          <TabsTrigger value="collection" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Collection Report</TabsTrigger>
          <TabsTrigger value="overdue" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Overdue Report</TabsTrigger>
          <TabsTrigger value="branch" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Branch Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="portfolio"><PortfolioTab /></TabsContent>
        <TabsContent value="collection"><CollectionTab /></TabsContent>
        <TabsContent value="overdue"><OverdueTab /></TabsContent>
        <TabsContent value="branch"><BranchTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ────────────────────── TAB 1: Portfolio Summary ────────────────────── */
function PortfolioTab() {
  const { tenantId } = useTenant();

  const { data: loans } = useQuery({
    queryKey: ["rpt-portfolio-loans", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("loans").select("id, amount, product_type, status, created_at").eq("tenant_id", tenantId).limit(5000);
      return data || [];
    },
  });

  const { data: interest } = useQuery({
    queryKey: ["rpt-portfolio-interest", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("interest_records").select("amount, paid, status").eq("tenant_id", tenantId).limit(10000);
      return data || [];
    },
  });

  const { data: npa } = useQuery({
    queryKey: ["rpt-portfolio-npa", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("npa_classifications").select("id, classification").eq("tenant_id", tenantId);
      return data || [];
    },
  });

  const { data: applications } = useQuery({
    queryKey: ["rpt-portfolio-apps", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("loan_applications").select("id, stage").eq("tenant_id", tenantId).limit(5000);
      return data || [];
    },
  });

  const activeLoans = (loans || []).filter((l: any) => l.status === "active");
  const totalPrincipal = activeLoans.reduce((s: number, l: any) => s + Number(l.amount), 0);
  const totalInterestDue = (interest || []).filter((i: any) => i.status === "pending" || i.status === "overdue").reduce((s: number, i: any) => s + (Number(i.amount) - Number(i.paid)), 0);
  const npaCount = (npa || []).filter((n: any) => n.classification !== "standard").length;

  // Bar chart: loans by product type
  const byProduct = useMemo(() => {
    const map: Record<string, number> = {};
    activeLoans.forEach((l: any) => { map[l.product_type] = (map[l.product_type] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [activeLoans]);

  // Pie chart: applications by stage
  const byStage = useMemo(() => {
    const map: Record<string, number> = {};
    (applications || []).forEach((a: any) => { map[a.stage] = (map[a.stage] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [applications]);

  // Line chart: new loans this month (daily)
  const dailyLoans = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const days = eachDayOfInterval({ start, end: end > now ? now : end });
    const dayMap: Record<string, number> = {};
    days.forEach(d => { dayMap[format(d, "dd")] = 0; });
    (loans || []).forEach((l: any) => {
      const d = new Date(l.created_at);
      if (d >= start && d <= end) {
        const key = format(d, "dd");
        dayMap[key] = (dayMap[key] || 0) + 1;
      }
    });
    return Object.entries(dayMap).map(([day, count]) => ({ day, count }));
  }, [loans]);

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Landmark} label="Active Loans" value={activeLoans.length.toString()} />
        <MetricCard icon={IndianRupee} label="Principal Outstanding" value={formatCompact(totalPrincipal)} />
        <MetricCard icon={TrendingUp} label="Interest Due" value={formatCompact(totalInterestDue)} />
        <MetricCard icon={AlertTriangle} label="NPA Count" value={npaCount.toString()} variant="destructive" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" />Loans by Product</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byProduct}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(49, 89%, 38%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><PieIcon className="h-4 w-4 text-accent" />Applications by Stage</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byStage} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {byStage.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" />New Loans This Month (Daily)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyLoans}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="hsl(204, 62%, 28%)" strokeWidth={2} dot={{ fill: "hsl(49, 89%, 38%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

/* ────────────────────── TAB 2: Collection Report ────────────────────── */
function CollectionTab() {
  const { tenantId } = useTenant();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  const [branchId, setBranchId] = useState("all");

  const { data: branches } = useQuery({
    queryKey: ["rpt-branches", tenantId],
    queryFn: async () => { const { data } = await supabase.from("branches").select("id, name").eq("tenant_id", tenantId); return data || []; },
  });

  const { data: loans } = useQuery({
    queryKey: ["rpt-collection", tenantId, dateFrom, dateTo, branchId],
    queryFn: async () => {
      let q = supabase.from("loans").select("id, loan_number, amount, status, customer_id, customers(name), interest_records(amount, paid, status, payment_date)")
        .eq("tenant_id", tenantId).eq("status", "active");
      if (branchId !== "all") q = q.eq("branch_id", branchId);
      const { data } = await q.limit(500);
      return data || [];
    },
  });

  const rows = useMemo(() => (loans || []).map((l: any) => {
    const recs = (l.interest_records || []);
    const interestDue = recs.filter((r: any) => r.status === "pending" || r.status === "overdue").reduce((s: number, r: any) => s + Number(r.amount) - Number(r.paid), 0);
    const collected = recs.filter((r: any) => r.status === "paid" && r.payment_date && r.payment_date >= dateFrom && r.payment_date <= dateTo + "T23:59:59").reduce((s: number, r: any) => s + Number(r.paid), 0);
    const totalDue = Number(l.amount) + interestDue;
    return {
      loanNumber: l.loan_number,
      customer: l.customers?.name || "—",
      principal: Number(l.amount),
      interestDue,
      storageDue: 0,
      totalDue,
      collected,
      balance: totalDue - collected,
    };
  }), [loans, dateFrom, dateTo]);

  const totals = useMemo(() => rows.reduce((acc, r) => ({
    principal: acc.principal + r.principal,
    interestDue: acc.interestDue + r.interestDue,
    totalDue: acc.totalDue + r.totalDue,
    collected: acc.collected + r.collected,
    balance: acc.balance + r.balance,
  }), { principal: 0, interestDue: 0, totalDue: 0, collected: 0, balance: 0 }), [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div><label className="text-xs text-muted-foreground">From</label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" /></div>
        <div><label className="text-xs text-muted-foreground">To</label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" /></div>
        <Select value={branchId} onValueChange={setBranchId}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Branches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {(branches || []).map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => exportCSV(rows, "collection-report")}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/10">
                <TableHead>Loan No</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Interest Due</TableHead><TableHead className="text-right">Total Due</TableHead>
                <TableHead className="text-right">Collected</TableHead><TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{r.loanNumber}</TableCell>
                  <TableCell className="text-xs">{r.customer}</TableCell>
                  <TableCell className="text-right text-xs">{formatINR(r.principal)}</TableCell>
                  <TableCell className="text-right text-xs">{formatINR(r.interestDue)}</TableCell>
                  <TableCell className="text-right text-xs font-medium">{formatINR(r.totalDue)}</TableCell>
                  <TableCell className="text-right text-xs text-green-600">{formatINR(r.collected)}</TableCell>
                  <TableCell className="text-right text-xs text-destructive">{formatINR(r.balance)}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>}
              {rows.length > 0 && (
                <TableRow className="bg-muted font-semibold">
                  <TableCell colSpan={2}>Totals</TableCell>
                  <TableCell className="text-right text-xs">{formatINR(totals.principal)}</TableCell>
                  <TableCell className="text-right text-xs">{formatINR(totals.interestDue)}</TableCell>
                  <TableCell className="text-right text-xs">{formatINR(totals.totalDue)}</TableCell>
                  <TableCell className="text-right text-xs">{formatINR(totals.collected)}</TableCell>
                  <TableCell className="text-right text-xs">{formatINR(totals.balance)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ────────────────────── TAB 3: Overdue Report ────────────────────── */
function OverdueTab() {
  const { tenantId } = useTenant();

  const { data: loans } = useQuery({
    queryKey: ["rpt-overdue", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("loans")
        .select("id, loan_number, amount, product_type, status, created_at, maturity_date, customer_id, customers(name), interest_records(amount, paid, status, due_date)")
        .eq("tenant_id", tenantId).eq("status", "active").limit(1000);
      return data || [];
    },
  });

  const rows = useMemo(() => {
    const now = new Date();
    return (loans || []).map((l: any) => {
      const overdueRecs = (l.interest_records || []).filter((r: any) => (r.status === "pending" || r.status === "overdue") && new Date(r.due_date) < now);
      if (overdueRecs.length === 0) return null;
      const overdueAmount = overdueRecs.reduce((s: number, r: any) => s + Number(r.amount) - Number(r.paid), 0);
      const oldestDue = overdueRecs.reduce((min: string, r: any) => r.due_date < min ? r.due_date : min, overdueRecs[0].due_date);
      const daysOverdue = differenceInDays(now, new Date(oldestDue));
      return {
        loanNumber: l.loan_number,
        customer: l.customers?.name || "—",
        productType: l.product_type,
        disbursementDate: l.created_at,
        daysOverdue,
        principal: Number(l.amount),
        overdueAmount,
        status: l.status,
      };
    }).filter(Boolean).sort((a: any, b: any) => b.daysOverdue - a.daysOverdue);
  }, [loans]);

  const dpdColor = (dpd: number) => {
    if (dpd > 90) return "bg-destructive/15 text-destructive";
    if (dpd > 30) return "bg-warning/15 text-orange-700";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => exportCSV(rows.map((r: any) => ({ ...r, disbursementDate: formatDate(r.disbursementDate) })), "overdue-report")}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/10">
                <TableHead>Loan No</TableHead><TableHead>Customer</TableHead><TableHead>Product</TableHead>
                <TableHead>Disbursement</TableHead><TableHead className="text-right">Days Overdue</TableHead>
                <TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Overdue Amt</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any, i: number) => (
                <TableRow key={i} className={dpdColor(r.daysOverdue)}>
                  <TableCell className="font-mono text-xs">{r.loanNumber}</TableCell>
                  <TableCell className="text-xs">{r.customer}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{r.productType}</Badge></TableCell>
                  <TableCell className="text-xs">{formatDate(r.disbursementDate)}</TableCell>
                  <TableCell className="text-right text-xs font-bold">{r.daysOverdue}</TableCell>
                  <TableCell className="text-right text-xs">{formatINR(r.principal)}</TableCell>
                  <TableCell className="text-right text-xs font-medium">{formatINR(r.overdueAmount)}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{r.status}</Badge></TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No overdue loans</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ────────────────────── TAB 4: Branch Performance ────────────────────── */
function BranchTab() {
  const { tenantId } = useTenant();
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const { data: branches } = useQuery({
    queryKey: ["rpt-branch-list", tenantId],
    queryFn: async () => { const { data } = await supabase.from("branches").select("id, name").eq("tenant_id", tenantId); return data || []; },
  });

  const { data: loans } = useQuery({
    queryKey: ["rpt-branch-loans", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("loans").select("id, branch_id, amount, status, created_at").eq("tenant_id", tenantId).limit(5000);
      return data || [];
    },
  });

  const { data: redemptions } = useQuery({
    queryKey: ["rpt-branch-redemptions", tenantId, monthStart],
    queryFn: async () => {
      const { data } = await supabase.from("redemptions").select("id, loan_id, total, created_at").eq("tenant_id", tenantId).gte("created_at", monthStart);
      return data || [];
    },
  });

  const { data: interestRecs } = useQuery({
    queryKey: ["rpt-branch-interest", tenantId, monthStart],
    queryFn: async () => {
      const { data } = await supabase.from("interest_records").select("loan_id, paid, payment_date, status").eq("tenant_id", tenantId).eq("status", "paid").gte("payment_date", monthStart);
      return data || [];
    },
  });

  const branchPerf = useMemo(() => {
    const loansByBranch: Record<string, any[]> = {};
    (loans || []).forEach((l: any) => {
      const bid = l.branch_id || "unassigned";
      if (!loansByBranch[bid]) loansByBranch[bid] = [];
      loansByBranch[bid].push(l);
    });

    // Build loan->branch map for interest aggregation
    const loanBranchMap: Record<string, string> = {};
    (loans || []).forEach((l: any) => { loanBranchMap[l.id] = l.branch_id || "unassigned"; });

    const collectionsByBranch: Record<string, number> = {};
    (interestRecs || []).forEach((i: any) => {
      const bid = loanBranchMap[i.loan_id] || "unassigned";
      collectionsByBranch[bid] = (collectionsByBranch[bid] || 0) + Number(i.paid);
    });

    const closuresByBranch: Record<string, number> = {};
    (redemptions || []).forEach((r: any) => {
      const bid = loanBranchMap[r.loan_id] || "unassigned";
      closuresByBranch[bid] = (closuresByBranch[bid] || 0) + 1;
    });

    return (branches || []).map((b: any) => {
      const bLoans = loansByBranch[b.id] || [];
      const active = bLoans.filter((l: any) => l.status === "active");
      return {
        name: b.name,
        activeLoans: active.length,
        principal: active.reduce((s: number, l: any) => s + Number(l.amount), 0),
        collections: collectionsByBranch[b.id] || 0,
        closures: closuresByBranch[b.id] || 0,
      };
    });
  }, [branches, loans, interestRecs, redemptions]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {branchPerf.slice(0, 4).map((b, i) => (
          <Card key={i}>
            <CardHeader className="pb-1">
              <p className="text-xs text-muted-foreground">{b.name}</p>
              <CardTitle className="text-lg">{b.activeLoans} <span className="text-xs font-normal text-muted-foreground">loans</span></CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Principal</span><span className="font-medium">{formatCompact(b.principal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Collections</span><span className="font-medium text-green-600">{formatCompact(b.collections)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Closures</span><span className="font-medium">{b.closures}</span></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/10">
                <TableHead>Branch</TableHead><TableHead className="text-right">Active Loans</TableHead>
                <TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Collections (Month)</TableHead>
                <TableHead className="text-right">Closures (Month)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchPerf.map((b, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-sm">{b.name}</TableCell>
                  <TableCell className="text-right text-sm">{b.activeLoans}</TableCell>
                  <TableCell className="text-right text-sm">{formatINR(b.principal)}</TableCell>
                  <TableCell className="text-right text-sm text-green-600">{formatINR(b.collections)}</TableCell>
                  <TableCell className="text-right text-sm">{b.closures}</TableCell>
                </TableRow>
              ))}
              {branchPerf.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No branches configured</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ────────────────────── Shared Metric Card ────────────────────── */
function MetricCard({ icon: Icon, label, value, variant }: { icon: any; label: string; value: string; variant?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`rounded-lg p-2 ${variant === "destructive" ? "bg-destructive/10" : "bg-accent/10"}`}>
          <Icon className={`h-5 w-5 ${variant === "destructive" ? "text-destructive" : "text-accent"}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
