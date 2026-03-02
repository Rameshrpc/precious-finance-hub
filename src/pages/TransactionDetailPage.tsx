import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLoanDetail } from "@/hooks/useLoans";
import { useLabels } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatINR, formatWeight, formatDate } from "@/lib/formatters";
import CustomerQuickCard from "@/components/CustomerQuickCard";
import ChargeCollectionDialog from "@/components/ChargeCollectionDialog";
import ClosureDialog from "@/components/ClosureDialog";
import ReloanDialog from "@/components/ReloanDialog";
import MarginRenewalDialog from "@/components/MarginRenewalDialog";
import PartialReleaseDialog from "@/components/PartialReleaseDialog";
import LoanRestructureDialog from "@/components/LoanRestructureDialog";
import {
  ArrowLeft, IndianRupee, TrendingUp, Clock, FileText, Printer,
  RefreshCw, Download, CircleDot, CalendarDays, Wrench, Phone
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-[hsl(142,70%,45%,0.15)] text-[hsl(142,70%,35%)] border-[hsl(142,70%,45%,0.3)]",
  overdue: "bg-destructive/15 text-destructive border-destructive/30",
  matured: "bg-[hsl(30,90%,50%,0.15)] text-[hsl(30,90%,40%)] border-[hsl(30,90%,50%,0.3)]",
  closed: "bg-muted text-muted-foreground border-border",
  pending: "bg-primary/15 text-primary border-primary/30",
};

const PRODUCT_COLORS: Record<string, string> = {
  GL: "bg-accent/15 text-accent border-accent/30",
  PO: "bg-primary/15 text-primary border-primary/30",
  SA: "bg-[hsl(270,60%,55%,0.15)] text-[hsl(270,60%,45%)] border-[hsl(270,60%,55%,0.3)]",
};

const CHARGE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-[hsl(30,90%,50%,0.15)] text-[hsl(30,90%,40%)]",
  paid: "bg-[hsl(142,70%,45%,0.15)] text-[hsl(142,70%,35%)]",
  overdue: "bg-destructive/15 text-destructive",
  partial: "bg-[hsl(45,90%,50%,0.15)] text-[hsl(45,90%,35%)]",
};

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loan, loanLoading, pledgeItems, interestRecords, auditLogs, scheme } = useLoanDetail(id);
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [closureDialogOpen, setClosureDialogOpen] = useState(false);
  const [reloanDialogOpen, setReloanDialogOpen] = useState(false);
  const [marginRenewalOpen, setMarginRenewalOpen] = useState(false);
  const [partialReleaseOpen, setPartialReleaseOpen] = useState(false);
  const [restructureOpen, setRestructureOpen] = useState(false);

  const labels = useLabels(loan?.product_type || "GL");

  // Metal summary from pledge items
  const metalSummary = useMemo(() => {
    const gold = { count: 0, weight: 0, value: 0 };
    const silver = { count: 0, weight: 0, value: 0 };
    (pledgeItems || []).forEach((item: any) => {
      if (item.is_released) return;
      const bucket = item.metal_type === "silver" ? silver : gold;
      bucket.count++;
      bucket.weight += Number(item.net_weight) || 0;
      bucket.value += Number(item.value) || 0;
    });
    return { gold, silver };
  }, [pledgeItems]);

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
  const ltvPercent = Math.min(Number(loan.overall_ltv) || 0, 100);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/transactions")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold font-mono tracking-tight">{loan.loan_number}</h1>
        <Badge variant="outline" className={STATUS_COLORS[loan.status] || ""}>{loan.status}</Badge>
        <Badge variant="outline" className={PRODUCT_COLORS[loan.product_type] || ""}>
          {labels.product}
        </Badge>
        <div className="ml-auto flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setChargeDialogOpen(true)} disabled={loan.status === "closed"}>
            <IndianRupee className="h-3.5 w-3.5" />Collect {labels.charge}
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setClosureDialogOpen(true)} disabled={loan.status === "closed"}>
            {labels.closeVerb}
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setReloanDialogOpen(true)} disabled={loan.status === "closed"}>
            <RefreshCw className="h-3.5 w-3.5" />Reloan
          </Button>
          <Button size="sm" variant="outline" className="gap-1"><Printer className="h-3.5 w-3.5" />Print</Button>
        </div>
      </div>

      {/* Customer line with QuickCard */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Customer:</span>
        {loan.customer ? (
          <CustomerQuickCard customerId={loan.customer_id}>
            <span className="font-medium text-foreground cursor-pointer hover:text-accent transition-colors">{loan.customer.name}</span>
          </CustomerQuickCard>
        ) : <span>—</span>}
        {loan.customer?.phone && (
          <a href={`tel:${loan.customer.phone}`} className="flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors">
            <Phone className="h-3 w-3" />{loan.customer.phone}
          </a>
        )}
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
            <p className="text-xs text-muted-foreground mb-1">{labels.charge} Outstanding</p>
            <p className={cn("text-xl font-bold", outstanding > 0 && "text-destructive")}>{formatINR(outstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">LTV</p>
            <p className="text-xl font-bold">{Number(loan.overall_ltv).toFixed(1)}%</p>
            <Progress
              value={ltvPercent}
              className={cn("mt-2 h-2", ltvPercent > 80 ? "[&>div]:bg-destructive" : ltvPercent > 60 ? "[&>div]:bg-[hsl(var(--warning))]" : "[&>div]:bg-[hsl(var(--success))]")}
            />
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
          <TabsTrigger value="charges">{labels.charge}s ({interestRecords.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Loan Details</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Product" value={labels.product} />
                <Row label={labels.amount} value={formatINR(loan.amount)} />
                <Row label={labels.chargeRate} value={`${loan.rate}% p.m.`} />
                <Row label="Tenure" value={`${loan.tenure_months} months`} />
                <Row label="Maturity" value={loan.maturity_date ? formatDate(loan.maturity_date) : "—"} />
                <Row label="Disbursement" value={loan.disbursement_mode} />
                <Row label="Created" value={formatDate(loan.created_at)} />
                {loan.purpose && <Row label="Purpose" value={loan.purpose} />}
              </CardContent>
            </Card>

            {/* Metal Summary */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Metal Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {metalSummary.gold.count > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-accent text-accent-foreground">Gold</Badge>
                      <span className="text-sm">{metalSummary.gold.count} items · {formatWeight(metalSummary.gold.weight)}</span>
                    </div>
                    <span className="font-bold text-sm">{formatINR(metalSummary.gold.value)}</span>
                  </div>
                )}
                {metalSummary.silver.count > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Silver</Badge>
                      <span className="text-sm">{metalSummary.silver.count} items · {formatWeight(metalSummary.silver.weight)}</span>
                    </div>
                    <span className="font-bold text-sm">{formatINR(metalSummary.silver.value)}</span>
                  </div>
                )}
                <Separator />
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div><p className="text-xs text-muted-foreground">Gold LTV</p><p className="font-bold">{Number(loan.gold_ltv).toFixed(1)}%</p></div>
                  <div><p className="text-xs text-muted-foreground">Silver LTV</p><p className="font-bold">{Number(loan.silver_ltv).toFixed(1)}%</p></div>
                  <div><p className="text-xs text-muted-foreground">Total Pledge</p><p className="font-bold">{formatINR(loan.total_pledge_value)}</p></div>
                </div>
              </CardContent>
            </Card>

            {/* Scheme */}
            {scheme && (
              <Card className="md:col-span-2">
                <CardHeader className="pb-3"><CardTitle className="text-base">Scheme & Disbursement</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Row label="Scheme" value={scheme.name} />
                  <Row label={`${labels.charge} Type`} value={scheme.interest_type} />
                  <Row label="Gold LTV Cap" value={`${scheme.gold_ltv_cap}%`} />
                  <Row label="Silver LTV Cap" value={`${scheme.silver_ltv_cap}%`} />
                  {loan.disbursement_bank_name && <Row label="Bank" value={loan.disbursement_bank_name} />}
                  {loan.disbursement_account && <Row label="Account" value={loan.disbursement_account} />}
                  {loan.disbursement_upi_id && <Row label="UPI" value={loan.disbursement_upi_id} />}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ITEMS */}
        <TabsContent value="items" className="mt-4">
          {pledgeItems.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No items recorded</CardContent></Card>
          ) : (
            <>
              {loan.status !== "closed" && (
                <div className="flex justify-end mb-2">
                  <Button size="sm" variant="outline" onClick={() => setPartialReleaseOpen(true)}>Partial Release</Button>
                </div>
              )}
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
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pledgeItems.map((item: any) => (
                      <TableRow key={item.id} className={item.is_released ? "opacity-50" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.photo_url && <img src={item.photo_url} className="h-8 w-8 rounded object-cover" alt="" />}
                            <div>
                              <p className={cn("font-medium text-sm", item.is_released && "line-through")}>{item.item_name}</p>
                              {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={item.metal_type === "gold" ? "border-accent/30 text-accent" : ""}>{item.metal_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{item.purity_name || `${item.purity_percentage}%`}</TableCell>
                        <TableCell className="text-right">{formatWeight(item.gross_weight)}</TableCell>
                        <TableCell className="text-right font-medium">{formatWeight(item.net_weight)}</TableCell>
                        <TableCell className="text-right">{formatINR(item.rate_per_gram)}</TableCell>
                        <TableCell className="text-right font-bold">{formatINR(item.value)}</TableCell>
                        <TableCell>
                          {item.is_released ? (
                            <Badge variant="outline" className="bg-muted text-muted-foreground">Released</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-[hsl(142,70%,45%,0.15)] text-[hsl(142,70%,35%)]">Pledged</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        {/* CHARGES */}
        <TabsContent value="charges" className="mt-4 space-y-4">
          {interestRecords.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No {labels.charge.toLowerCase()} records yet</CardContent></Card>
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
                        <TableCell className="text-sm">{formatDate(rec.period_start)} – {formatDate(rec.period_end)}</TableCell>
                        <TableCell className="text-sm">{formatDate(rec.due_date)}</TableCell>
                        <TableCell className="text-right font-medium">{formatINR(rec.amount)}</TableCell>
                        <TableCell className="text-right">{formatINR(rec.paid)}</TableCell>
                        <TableCell className="text-right">{rec.penalty > 0 ? formatINR(rec.penalty) : "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={CHARGE_STATUS_COLORS[rec.status] || ""}>{rec.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono">{rec.receipt_number || "—"}</TableCell>
                        <TableCell className="text-sm">{rec.payment_date ? formatDate(rec.payment_date) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Due</p>
                  <p className="text-lg font-bold">{formatINR(totalInterestDue)}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-bold text-[hsl(142,70%,35%)]">{formatINR(totalInterestPaid)}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className="text-lg font-bold text-destructive">{formatINR(outstanding)}</p>
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
              <p className="text-xs mt-1">{labels.document}, Receipts, and {labels.close} documents will appear here</p>
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

      {/* Dialogs */}
      <ChargeCollectionDialog open={chargeDialogOpen} onOpenChange={setChargeDialogOpen} loan={loan} interestRecords={interestRecords} />
      <ClosureDialog open={closureDialogOpen} onOpenChange={setClosureDialogOpen} loan={loan} pledgeItems={pledgeItems} interestRecords={interestRecords} />
      <ReloanDialog open={reloanDialogOpen} onOpenChange={setReloanDialogOpen} loan={loan} pledgeItems={pledgeItems} interestRecords={interestRecords} />
      {loan.product_type === "SA" && <MarginRenewalDialog open={marginRenewalOpen} onOpenChange={setMarginRenewalOpen} loan={loan} />}
      <PartialReleaseDialog open={partialReleaseOpen} onOpenChange={setPartialReleaseOpen} loan={loan} pledgeItems={pledgeItems} />
      <LoanRestructureDialog open={restructureOpen} onOpenChange={setRestructureOpen} loan={loan} />
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
