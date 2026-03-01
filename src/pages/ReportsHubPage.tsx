import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ReportFilters, { ReportFilterValues } from "@/components/ReportFilters";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useQuery } from "@tanstack/react-query";
import { formatINR, formatDate } from "@/lib/formatters";
import {
  Calendar, FileText, Users, ClipboardList, Package, AlertTriangle,
  BarChart3, TrendingUp, Receipt, Building2, Phone, Clock, Gavel,
  Layers, UserCheck, Activity
} from "lucide-react";

const REPORTS = [
  { key: "dayHistory", title: "Day History", desc: "All transactions for a single day", icon: Calendar, live: true },
  { key: "txnSummary", title: "Transaction Summary", desc: "Summary of transactions by type and period", icon: FileText, live: true },
  { key: "customerHistory", title: "Customer History", desc: "Complete history for a customer", icon: Users, live: true },
  { key: "txnDetail", title: "Transaction Detail", desc: "Detailed transaction report with items", icon: ClipboardList, live: true },
  { key: "holdings", title: "Holdings Book", desc: "Current gold/silver holdings in vault", icon: Package, live: false },
  { key: "overdue", title: "Overdue Report", desc: "All overdue loans with amounts", icon: AlertTriangle, live: false },
  { key: "ageAnalysis", title: "Age Analysis", desc: "DPD buckets: 0-30, 31-60, 61-90, 90+", icon: BarChart3, live: false },
  { key: "valueAnalysis", title: "Value Analysis", desc: "LTV distribution and scatter", icon: TrendingUp, live: false },
  { key: "chargeStatement", title: "Charge Statement", desc: "Interest/charges per loan", icon: Receipt, live: false },
  { key: "businessRegister", title: "Business Register", desc: "All active loans register", icon: Building2, live: false },
  { key: "collectionList", title: "Collection List", desc: "Upcoming and overdue collections", icon: Phone, live: false },
  { key: "accruedCharges", title: "Accrued Charges", desc: "Unrealized interest accruals", icon: Clock, live: false },
  { key: "forfeiture", title: "Forfeiture Report", desc: "Forfeited and sold items", icon: Gavel, live: false },
  { key: "typeSummary", title: "Type Summary", desc: "GL/PO/SA side-by-side comparison", icon: Layers, live: false },
  { key: "agentCommission", title: "Agent Commission", desc: "Commission earned and payable", icon: UserCheck, live: false },
  { key: "npaMovement", title: "NPA Movement", desc: "Quarterly NPA classification changes", icon: Activity, live: false },
];

export default function ReportsHubPage() {
  const { tenantId } = useTenant();
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilterValues | null>(null);

  if (!activeReport) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">Business analytics and reports hub</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REPORTS.map((r) => (
            <Card key={r.key} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveReport(r.key)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <r.icon className="h-5 w-5 text-primary" />
                  {r.live ? <Badge variant="default" className="text-[10px]">Live</Badge> : <Badge variant="secondary" className="text-[10px]">Soon</Badge>}
                </div>
                <CardTitle className="text-sm mt-2">{r.title}</CardTitle>
                <CardDescription className="text-xs">{r.desc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button size="sm" variant="outline" className="w-full text-xs">View Report</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const report = REPORTS.find((r) => r.key === activeReport)!;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setActiveReport(null)}>← Back</Button>
        <h1 className="text-xl font-display font-bold">{report.title}</h1>
      </div>
      <ReportFilters onFilter={setFilters} onExport={() => {}} />
      {report.live && filters ? (
        <ReportContent reportKey={activeReport} filters={filters} tenantId={tenantId} />
      ) : (
        <Card><CardContent className="p-16 text-center text-muted-foreground">
          {!filters ? "Apply filters to generate the report" : "Coming soon — this report is under development."}
        </CardContent></Card>
      )}
    </div>
  );
}

function ReportContent({ reportKey, filters, tenantId }: { reportKey: string; filters: ReportFilterValues; tenantId: string }) {
  if (reportKey === "dayHistory") return <DayHistoryReport filters={filters} tenantId={tenantId} />;
  if (reportKey === "txnSummary") return <TxnSummaryReport filters={filters} tenantId={tenantId} />;
  if (reportKey === "customerHistory") return <CustomerHistoryReport filters={filters} tenantId={tenantId} />;
  if (reportKey === "txnDetail") return <TxnDetailReport filters={filters} tenantId={tenantId} />;
  return null;
}

function DayHistoryReport({ filters, tenantId }: { filters: ReportFilterValues; tenantId: string }) {
  const { data: loans } = useQuery({
    queryKey: ["report-day-history", filters, tenantId],
    queryFn: async () => {
      let q = supabase.from("loans").select("*, customers(name, code)").eq("tenant_id", tenantId)
        .gte("created_at", filters.dateFrom).lte("created_at", filters.dateTo + "T23:59:59");
      if (filters.productType !== "all") q = q.eq("product_type", filters.productType);
      const { data } = await q.order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Day History — {filters.dateFrom} to {filters.dateTo}</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead><TableHead>Loan #</TableHead><TableHead>Customer</TableHead>
              <TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(loans || []).map((l: any) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs">{formatDate(l.created_at)}</TableCell>
                <TableCell className="font-mono text-xs">{l.loan_number}</TableCell>
                <TableCell className="text-xs">{l.customers?.name}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{l.product_type}</Badge></TableCell>
                <TableCell className="text-xs font-medium">{formatINR(l.amount)}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px]">{l.status}</Badge></TableCell>
              </TableRow>
            ))}
            {(!loans || loans.length === 0) && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No transactions found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TxnSummaryReport({ filters, tenantId }: { filters: ReportFilterValues; tenantId: string }) {
  const { data: loans } = useQuery({
    queryKey: ["report-txn-summary", filters, tenantId],
    queryFn: async () => {
      let q = supabase.from("loans").select("product_type, amount, status").eq("tenant_id", tenantId)
        .gte("created_at", filters.dateFrom).lte("created_at", filters.dateTo + "T23:59:59");
      if (filters.productType !== "all") q = q.eq("product_type", filters.productType);
      const { data } = await q.limit(1000);
      return data || [];
    },
  });

  const summary = (loans || []).reduce((acc: any, l: any) => {
    if (!acc[l.product_type]) acc[l.product_type] = { count: 0, total: 0, active: 0, closed: 0 };
    acc[l.product_type].count++;
    acc[l.product_type].total += Number(l.amount);
    if (l.status === "active") acc[l.product_type].active++;
    else acc[l.product_type].closed++;
    return acc;
  }, {} as Record<string, any>);

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Transaction Summary</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead><TableHead>Count</TableHead><TableHead>Total Amount</TableHead>
              <TableHead>Active</TableHead><TableHead>Closed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(summary).map(([k, v]: [string, any]) => (
              <TableRow key={k}>
                <TableCell><Badge variant="outline">{k}</Badge></TableCell>
                <TableCell>{v.count}</TableCell>
                <TableCell className="font-medium">{formatINR(v.total)}</TableCell>
                <TableCell>{v.active}</TableCell>
                <TableCell>{v.closed}</TableCell>
              </TableRow>
            ))}
            {Object.keys(summary).length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No data</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CustomerHistoryReport({ filters, tenantId }: { filters: ReportFilterValues; tenantId: string }) {
  const { data: loans } = useQuery({
    queryKey: ["report-customer-history", filters, tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("loans").select("*, customers(name, code, phone)")
        .eq("tenant_id", tenantId)
        .gte("created_at", filters.dateFrom).lte("created_at", filters.dateTo + "T23:59:59")
        .order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
  });

  const grouped = (loans || []).reduce((acc: any, l: any) => {
    const cid = l.customer_id;
    if (!acc[cid]) acc[cid] = { customer: l.customers, loans: [] };
    acc[cid].loans.push(l);
    return acc;
  }, {} as Record<string, any>);

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Customer History</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(grouped).map(([cid, g]: [string, any]) => (
          <div key={cid} className="border rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <div><span className="font-medium text-sm">{g.customer?.name}</span> <span className="text-xs text-muted-foreground ml-2">{g.customer?.code}</span></div>
              <Badge variant="secondary">{g.loans.length} loans</Badge>
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Loan #</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {g.loans.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.loan_number}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{l.product_type}</Badge></TableCell>
                    <TableCell className="text-xs">{formatINR(l.amount)}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{l.status}</Badge></TableCell>
                    <TableCell className="text-xs">{formatDate(l.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && <p className="text-center text-muted-foreground py-8">No data</p>}
      </CardContent>
    </Card>
  );
}

function TxnDetailReport({ filters, tenantId }: { filters: ReportFilterValues; tenantId: string }) {
  const { data: loans } = useQuery({
    queryKey: ["report-txn-detail", filters, tenantId],
    queryFn: async () => {
      let q = supabase.from("loans").select("*, customers(name, code), pledge_items(*)")
        .eq("tenant_id", tenantId)
        .gte("created_at", filters.dateFrom).lte("created_at", filters.dateTo + "T23:59:59");
      if (filters.productType !== "all") q = q.eq("product_type", filters.productType);
      const { data } = await q.order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Transaction Detail</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {(loans || []).map((l: any) => (
          <div key={l.id} className="border rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="font-mono text-sm font-medium">{l.loan_number}</span>
                <span className="text-xs text-muted-foreground ml-2">{l.customers?.name}</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{l.product_type}</Badge>
                <Badge variant="secondary">{l.status}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs mb-2">
              <div><span className="text-muted-foreground">Amount:</span> {formatINR(l.amount)}</div>
              <div><span className="text-muted-foreground">Rate:</span> {l.rate}%</div>
              <div><span className="text-muted-foreground">LTV:</span> {l.overall_ltv}%</div>
              <div><span className="text-muted-foreground">Date:</span> {formatDate(l.created_at)}</div>
            </div>
            {l.pledge_items?.length > 0 && (
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Item</TableHead><TableHead className="text-xs">Metal</TableHead>
                  <TableHead className="text-xs">Weight</TableHead><TableHead className="text-xs">Value</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {l.pledge_items.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{p.item_name}</TableCell>
                      <TableCell className="text-xs">{p.metal_type}</TableCell>
                      <TableCell className="text-xs">{p.net_weight}g</TableCell>
                      <TableCell className="text-xs">{formatINR(p.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ))}
        {(!loans || loans.length === 0) && <p className="text-center text-muted-foreground py-8">No data</p>}
      </CardContent>
    </Card>
  );
}
