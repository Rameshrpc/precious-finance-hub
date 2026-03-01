import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/formatters";
import { Scale, Download } from "lucide-react";

export default function BalanceSheetPage() {
  const { tenantId } = useTenant();
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [productFilter, setProductFilter] = useState("all");

  const { data: accounts = [] } = useQuery({
    queryKey: ["chart-of-accounts", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("chart_of_accounts").select("*").eq("tenant_id", tenantId!).eq("is_active", true).order("code");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["bs-vouchers", tenantId, asOfDate],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voucher_lines")
        .select("debit_account, credit_account, amount")
        .eq("tenant_id", tenantId!)
        .lte("voucher_date", asOfDate);
      if (error) throw error;
      return data || [];
    },
  });

  const { assets, liabilities, equity, totalAssets, totalLiabEquity, isBalanced, netPnL } = useMemo(() => {
    const balances: Record<string, number> = {};
    vouchers.forEach((v: any) => {
      const amt = Number(v.amount);
      if (v.debit_account) balances[v.debit_account] = (balances[v.debit_account] || 0) + amt;
      if (v.credit_account) balances[v.credit_account] = (balances[v.credit_account] || 0) - amt;
    });

    const filtered = productFilter === "all" ? accounts : accounts.filter((a: any) => !a.product_type || a.product_type === productFilter);

    const mapAccounts = (type: string) =>
      filtered
        .filter((a: any) => a.account_type === type)
        .map((a: any) => {
          const key = `${a.code}-${a.name}`;
          const bal = balances[key] || 0;
          return { ...a, amount: Math.abs(bal), rawBal: bal };
        })
        .filter((a: any) => a.amount > 0);

    const assets = mapAccounts("asset");
    const liabilities = mapAccounts("liability");
    const equityAccs = mapAccounts("equity");

    // Calculate net P&L (income - expense) for retained earnings
    const incomeTotal = filtered.filter((a: any) => a.account_type === "income")
      .reduce((s: number, a: any) => s + Math.abs(balances[`${a.code}-${a.name}`] || 0), 0);
    const expenseTotal = filtered.filter((a: any) => a.account_type === "expense")
      .reduce((s: number, a: any) => s + Math.abs(balances[`${a.code}-${a.name}`] || 0), 0);
    const netPnL = incomeTotal - expenseTotal;

    const totalAssets = assets.reduce((s: number, a: any) => s + a.amount, 0);
    const totalLiab = liabilities.reduce((s: number, a: any) => s + a.amount, 0);
    const totalEquity = equityAccs.reduce((s: number, a: any) => s + a.amount, 0);
    const totalLiabEquity = totalLiab + totalEquity + netPnL;

    return {
      assets,
      liabilities,
      equity: equityAccs,
      totalAssets,
      totalLiabEquity,
      isBalanced: Math.abs(totalAssets - totalLiabEquity) < 0.01,
      netPnL,
    };
  }, [accounts, vouchers, productFilter]);

  const handleExport = () => {
    const csv = ["Section,Account,Amount"];
    assets.forEach((a: any) => csv.push(`Assets,"${a.name}",${a.amount}`));
    liabilities.forEach((a: any) => csv.push(`Liabilities,"${a.name}",${a.amount}`));
    equity.forEach((a: any) => csv.push(`Equity,"${a.name}",${a.amount}`));
    csv.push(`Equity,"Retained Earnings (P&L)",${netPnL}`);
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `balance-sheet-${asOfDate}.csv`; link.click();
  };

  const Section = ({ title, items, total, color }: { title: string; items: any[]; total: number; color: string }) => (
    <Card>
      <CardHeader className="pb-2"><CardTitle className={`text-base ${color}`}>{title}</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 && title !== "Equity" ? (
          <p className="text-sm text-muted-foreground py-4">No entries</p>
        ) : (
          <div className="space-y-2">
            {items.map((a: any) => (
              <div key={a.id} className="flex justify-between text-sm">
                <span>{a.name}</span>
                <span className="font-medium">{formatINR(a.amount)}</span>
              </div>
            ))}
            {title === "Equity" && (
              <div className="flex justify-between text-sm">
                <span>Retained Earnings (P&L)</span>
                <span className={`font-medium ${netPnL >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formatINR(netPnL)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total {title}</span>
              <span className={color}>{formatINR(total)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scale className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-serif">Balance Sheet</h1>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-1"><Download className="h-4 w-4" />Export CSV</Button>
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div><Label>As of Date</Label><Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} /></div>
        <div>
          <Label>Product</Label>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="GL">GL</SelectItem><SelectItem value="PO">PO</SelectItem><SelectItem value="SA">SA</SelectItem></SelectContent>
          </Select>
        </div>
        <div className={`text-sm font-medium ${isBalanced ? "text-emerald-600" : "text-red-600"}`}>
          {isBalanced ? "✓ Assets = Liabilities + Equity" : `⚠ Difference: ${formatINR(Math.abs(totalAssets - totalLiabEquity))}`}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <Section title="Assets" items={assets} total={totalAssets} color="text-blue-700" />
            <div className="space-y-4">
              <Section title="Liabilities" items={liabilities} total={liabilities.reduce((s: number, a: any) => s + a.amount, 0)} color="text-red-700" />
              <Section title="Equity" items={equity} total={equity.reduce((s: number, a: any) => s + a.amount, 0) + netPnL} color="text-purple-700" />
            </div>
          </div>

          {/* Balance check */}
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold text-blue-700">{formatINR(totalAssets)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Liabilities + Equity</p>
                  <p className="text-2xl font-bold text-purple-700">{formatINR(totalLiabEquity)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
