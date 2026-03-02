import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLoans, LoanWithCustomer } from "@/hooks/useLoans";
import { useTenant } from "@/contexts/TenantContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import CustomerQuickCard from "@/components/CustomerQuickCard";
import { formatINR, formatDate } from "@/lib/formatters";
import { getLabel } from "@/lib/labels";
import { Plus, Search, LayoutList, LayoutGrid, Calendar } from "lucide-react";

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

export default function TransactionsListPage() {
  const navigate = useNavigate();
  const { enabledProducts, enableSilver } = useTenant();
  const { data: loans = [], isLoading } = useLoans();

  const [productTab, setProductTab] = useState("ALL");
  const [statusTab, setStatusTab] = useState("all");
  const [metalFilter, setMetalFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Counts
  const productCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: loans.length, GL: 0, PO: 0, SA: 0 };
    loans.forEach((l) => { if (l.product_type in c) c[l.product_type]++; });
    return c;
  }, [loans]);

  const statusCounts = useMemo(() => {
    const base = productTab === "ALL" ? loans : loans.filter((l) => l.product_type === productTab);
    const c: Record<string, number> = { all: base.length, active: 0, overdue: 0, matured: 0, closed: 0 };
    base.forEach((l) => { if (l.status in c) c[l.status]++; });
    return c;
  }, [loans, productTab]);

  const filtered = useMemo(() => {
    let result = loans;
    if (productTab !== "ALL") result = result.filter((l) => l.product_type === productTab);
    if (statusTab !== "all") result = result.filter((l) => l.status === statusTab);
    if (metalFilter === "gold") result = result.filter((l) => (l as any).metal_composition === "gold" || (l.gold_value > 0 && l.silver_value === 0));
    if (metalFilter === "silver") result = result.filter((l) => (l as any).metal_composition === "silver" || (l.silver_value > 0 && l.gold_value === 0));
    if (metalFilter === "mixed") result = result.filter((l) => (l as any).metal_composition === "mixed" || (l.gold_value > 0 && l.silver_value > 0));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        l.loan_number.toLowerCase().includes(q) ||
        l.customer?.name?.toLowerCase().includes(q) ||
        l.customer?.phone?.includes(q)
      );
    }
    return result;
  }, [loans, productTab, statusTab, metalFilter, search]);

  const goldWeightDisplay = (loan: LoanWithCustomer) => loan.gold_value > 0 ? `${(loan.gold_value / 6000).toFixed(1)}g` : "—";
  const silverWeightDisplay = (loan: LoanWithCustomer) => loan.silver_value > 0 ? `${(loan.silver_value / 80).toFixed(1)}g` : "—";

  const metalBadge = (loan: LoanWithCustomer) => {
    const comp = (loan as any).metal_composition;
    if (comp === "mixed" || (loan.gold_value > 0 && loan.silver_value > 0)) return <Badge variant="outline" className="text-[10px]">Mixed</Badge>;
    if (comp === "silver" || (loan.silver_value > 0 && loan.gold_value === 0)) return <Badge variant="outline" className="text-[10px]">Silver</Badge>;
    return <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">Gold</Badge>;
  };

  const visibleProductTabs = ["ALL", ...["GL", "PO", "SA"].filter(p => enabledProducts.includes(p))];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <Button onClick={() => navigate("/transactions/new")} className="gap-2">
          <Plus className="h-4 w-4" /> New Transaction
        </Button>
      </div>

      {/* Product Tabs */}
      <Tabs value={productTab} onValueChange={setProductTab}>
        <TabsList>
          {visibleProductTabs.map((p) => (
            <TabsTrigger key={p} value={p} className="gap-1.5">
              {p === "ALL" ? "All" : getLabel(p, "product")}
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {productCounts[p] || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Status sub-tabs + metal filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(["all", "active", "overdue", "matured", "closed"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusTab === s ? "default" : "outline"}
              onClick={() => setStatusTab(s)}
              className="gap-1 text-xs capitalize"
            >
              {s === "all" ? "All" : s}
              <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-0.5">
                {statusCounts[s] || 0}
              </Badge>
            </Button>
          ))}
        </div>

        <div className="flex gap-1 ml-auto">
          {(["all", "gold", ...(enableSilver ? ["silver", "mixed"] : [])] as const).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={metalFilter === m ? "secondary" : "ghost"}
              onClick={() => setMetalFilter(m as string)}
              className="text-xs capitalize"
            >
              {m === "all" ? "All Metals" : m === "gold" ? "Gold Only" : m === "silver" ? "Silver Only" : "Mixed"}
            </Button>
          ))}
        </div>
      </div>

      {/* Search + view toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search loan no, customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex border rounded-md">
          <Button size="icon" variant={viewMode === "table" ? "secondary" : "ghost"} onClick={() => setViewMode("table")}>
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button size="icon" variant={viewMode === "card" ? "secondary" : "ghost"} onClick={() => setViewMode("card")}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No transactions found</CardContent></Card>
      ) : viewMode === "table" ? (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Gold</TableHead>
                {enableSilver && <TableHead className="text-right">Silver</TableHead>}
                <TableHead className="text-right">LTV%</TableHead>
                <TableHead>Metal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((loan) => (
                <TableRow
                  key={loan.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/transactions/${loan.id}`)}
                >
                  <TableCell className="font-mono font-medium text-sm">{loan.loan_number}</TableCell>
                  <TableCell>
                    {loan.customer ? (
                      <CustomerQuickCard customerId={loan.customer_id}>
                        <span className="font-medium text-sm hover:underline cursor-pointer">{loan.customer.name}</span>
                      </CustomerQuickCard>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={PRODUCT_COLORS[loan.product_type] || ""}>
                      {loan.product_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatINR(loan.amount)}</TableCell>
                  <TableCell className="text-right text-sm">{goldWeightDisplay(loan)}</TableCell>
                  {enableSilver && <TableCell className="text-right text-sm">{silverWeightDisplay(loan)}</TableCell>}
                  <TableCell className="text-right text-sm">{loan.overall_ltv ? `${Number(loan.overall_ltv).toFixed(1)}%` : "—"}</TableCell>
                  <TableCell>{metalBadge(loan)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[loan.status] || ""}>
                      {loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(loan.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((loan) => (
            <Card
              key={loan.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/transactions/${loan.id}`)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium text-sm">{loan.loan_number}</span>
                  <Badge variant="outline" className={STATUS_COLORS[loan.status] || ""}>{loan.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate mr-2">{loan.customer?.name || "—"}</span>
                  <Badge variant="outline" className={PRODUCT_COLORS[loan.product_type] || ""}>{loan.product_type}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{formatINR(loan.amount)}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(loan.created_at)}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {loan.gold_value > 0 && (
                    <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">Gold {goldWeightDisplay(loan)}</Badge>
                  )}
                  {enableSilver && loan.silver_value > 0 && (
                    <Badge variant="outline" className="text-[10px]">Silver {silverWeightDisplay(loan)}</Badge>
                  )}
                  <span>LTV {loan.overall_ltv ? `${Number(loan.overall_ltv).toFixed(1)}%` : "—"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
