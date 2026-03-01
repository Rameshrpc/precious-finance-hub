import { useParams, useNavigate } from "react-router-dom";
import { useLoanDetail } from "@/hooks/useLoans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatINR, formatWeight, formatDate } from "@/lib/formatters";
import { getLabel } from "@/lib/labels";
import {
  ArrowLeft, IndianRupee, TrendingUp, Clock, FileText, Printer,
  RefreshCw, Download, CircleDot
} from "lucide-react";
import { differenceInDays } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  matured: "bg-orange-100 text-orange-800 border-orange-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const PRODUCT_COLORS: Record<string, string> = {
  GL: "bg-amber-100 text-amber-800 border-amber-200",
  PO: "bg-blue-100 text-blue-800 border-blue-200",
  SA: "bg-purple-100 text-purple-800 border-purple-200",
};

const METAL_COLORS: Record<string, string> = {
  gold: "bg-amber-100 text-amber-800",
  silver: "bg-slate-100 text-slate-700",
};

const CHARGE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-orange-100 text-orange-800",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-red-100 text-red-800",
  partial: "bg-yellow-100 text-yellow-800",
};

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loan, loanLoading, pledgeItems, interestRecords, auditLogs, scheme } = useLoanDetail(id);

  if (loanLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Loan not found</p>
        <Button variant="link" onClick={() => navigate("/transactions")}>Back to Transactions</Button>
      </div>
    );
  }

  const daysActive = differenceInDays(new Date(), new Date(loan.created_at));
  const totalInterestDue = interestRecords.reduce((s: number, r: any) => s + Number(r.amount) + Number(r.penalty), 0);
  const totalInterestPaid = interestRecords.reduce((s: number, r: any) => s + Number(r.paid), 0);
  const outstanding = totalInterestDue - totalInterestPaid;
  const ltvPercent = Math.min(loan.overall_ltv, 100);
  const ltvColor = ltvPercent > 80 ? "bg-red-500" : ltvPercent > 60 ? "bg-yellow-500" : "bg-emerald-500";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/transactions")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold font-serif">{loan.loan_number}</h1>
        <Badge variant="outline" className={STATUS_COLORS[loan.status] || ""}>{loan.status}</Badge>
        <Badge variant="outline" className={PRODUCT_COLORS[loan.product_type] || ""}>
          {getLabel(loan.product_type, "product")}
        </Badge>
        <div className="ml-auto flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="gap-1"><IndianRupee className="h-3.5 w-3.5" />Collect {getLabel(loan.product_type, "charge")}</Button>
          <Button size="sm" variant="outline" className="gap-1"><RefreshCw className="h-3.5 w-3.5" />Reloan</Button>
          <Button size="sm" variant="destructive" className="gap-1">{getLabel(loan.product_type, "closeVerb")}</Button>
          <Button size="sm" variant="outline" className="gap-1"><Printer className="h-3.5 w-3.5" />Print</Button>
        </div>
      </div>

      {/* Customer info */}
      <div className="text-sm text-muted-foreground">
        Customer: <span className="font-medium text-foreground">{loan.customer?.name}</span> · {loan.customer?.phone}
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Principal</p>
            <p className="text-xl font-bold">{formatINR(loan.amount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{getLabel(loan.product_type, "charge")} Outstanding</p>
            <p className="text-xl font-bold">{formatINR(outstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">LTV</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{loan.overall_ltv}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div className={`h-full rounded-full transition-all ${ltvColor}`} style={{ width: `${ltvPercent}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Days Active</p>
            <p className="text-xl font-bold">{daysActive}</p>
            <p className="text-xs text-muted-foreground mt-1">{loan.tenure_months}mo tenure</p>
          </CardContent>
        </Card>
      </div>

      {/* 5 Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items ({pledgeItems.length})</TabsTrigger>
          <TabsTrigger value="charges">{getLabel(loan.product_type, "charge")}s ({interestRecords.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Loan Details</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Product" value={getLabel(loan.product_type, "product")} />
                <Row label="Amount" value={formatINR(loan.amount)} />
                <Row label="Rate" value={`${loan.rate}% p.m.`} />
                <Row label="Tenure" value={`${loan.tenure_months} months`} />
                <Row label="Maturity" value={loan.maturity_date ? formatDate(loan.maturity_date) : "-"} />
                <Row label="Created" value={formatDate(loan.created_at)} />
                {loan.purpose && <Row label="Purpose" value={loan.purpose} />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Scheme & Disbursement</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Scheme" value={scheme?.name || "-"} />
                <Row label={`${getLabel(loan.product_type, "charge")} Type`} value={scheme?.interest_type || "-"} />
                <Row label="Gold LTV Cap" value={scheme ? `${scheme.gold_ltv_cap}%` : "-"} />
                <Row label="Silver LTV Cap" value={scheme ? `${scheme.silver_ltv_cap}%` : "-"} />
                <Separator />
                <Row label="Mode" value={loan.disbursement_mode} />
                {loan.disbursement_bank_name && <Row label="Bank" value={loan.disbursement_bank_name} />}
                {loan.disbursement_account && <Row label="Account" value={loan.disbursement_account} />}
                {loan.disbursement_upi_id && <Row label="UPI" value={loan.disbursement_upi_id} />}
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader className="pb-3"><CardTitle className="text-base">Metal Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Gold Value</p>
                    <p className="text-lg font-bold">{formatINR(loan.gold_value)}</p>
                    <p className="text-xs text-muted-foreground">LTV {loan.gold_ltv}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Silver Value</p>
                    <p className="text-lg font-bold">{formatINR(loan.silver_value)}</p>
                    <p className="text-xs text-muted-foreground">LTV {loan.silver_ltv}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Pledge</p>
                    <p className="text-lg font-bold">{formatINR(loan.total_pledge_value)}</p>
                    <p className="text-xs text-muted-foreground">Overall LTV {loan.overall_ltv}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ITEMS */}
        <TabsContent value="items" className="mt-4">
          {pledgeItems.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No items recorded</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Metal</TableHead>
                    <TableHead>Purity</TableHead>
                    <TableHead className="text-right">Gross (g)</TableHead>
                    <TableHead className="text-right">Net (g)</TableHead>
                    <TableHead className="text-right">Rate/g</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pledgeItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.photo_url && <img src={item.photo_url} className="h-8 w-8 rounded object-cover" />}
                          <div>
                            <p className="font-medium text-sm">{item.item_name}</p>
                            {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={METAL_COLORS[item.metal_type] || ""}>{item.metal_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{item.purity_name || `${item.purity_percentage}%`}</TableCell>
                      <TableCell className="text-right">{formatWeight(item.gross_weight)}</TableCell>
                      <TableCell className="text-right font-medium">{formatWeight(item.net_weight)}</TableCell>
                      <TableCell className="text-right">{formatINR(item.rate_per_gram)}</TableCell>
                      <TableCell className="text-right font-bold">{formatINR(item.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* CHARGES */}
        <TabsContent value="charges" className="mt-4 space-y-4">
          {interestRecords.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No {getLabel(loan.product_type, "charge").toLowerCase()} records yet</CardContent></Card>
          ) : (
            <>
              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Penalty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Payment Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interestRecords.map((rec: any) => (
                      <TableRow key={rec.id}>
                        <TableCell className="text-sm">{formatDate(rec.period_start)} - {formatDate(rec.period_end)}</TableCell>
                        <TableCell className="text-sm">{formatDate(rec.due_date)}</TableCell>
                        <TableCell className="text-right font-medium">{formatINR(rec.amount)}</TableCell>
                        <TableCell className="text-right">{formatINR(rec.paid)}</TableCell>
                        <TableCell className="text-right">{rec.penalty > 0 ? formatINR(rec.penalty) : "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={CHARGE_STATUS_COLORS[rec.status] || ""}>{rec.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono">{rec.receipt_number || "-"}</TableCell>
                        <TableCell className="text-sm">{rec.payment_date ? formatDate(rec.payment_date) : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Due</p>
                  <p className="text-lg font-bold">{formatINR(totalInterestDue)}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-bold text-emerald-600">{formatINR(totalInterestPaid)}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className="text-lg font-bold text-red-600">{formatINR(outstanding)}</p>
                </CardContent></Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto h-8 w-8 mb-2 opacity-40" />
              <p>Document generation coming soon</p>
              <p className="text-xs mt-1">Pledge Card, Receipts, and Closure documents will be generated here</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT TRAIL */}
        <TabsContent value="audit" className="mt-4">
          {auditLogs.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No audit entries yet</CardContent></Card>
          ) : (
            <div className="space-y-0 border-l-2 border-border ml-4 pl-6">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="relative pb-6">
                  <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                  <div>
                    <p className="font-medium text-sm">{log.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.performed_by_name || "System"} · {formatDate(log.created_at)}
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-24">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
