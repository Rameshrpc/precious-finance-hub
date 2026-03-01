import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/formatters";
import { TrendingUp, Download } from "lucide-react";

export default function PnLPage() {
  const { tenantId } = useTenant();
  const fyStart = `${new Date().getFullYear()}-04-01`;
  const [startDate, setStartDate] = useState(fyStart > new Date().toISOString().slice(0, 10) ? `${new Date().getFullYear() - 1}-04-01` : fyStart);
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
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
    queryKey: ["pnl-vouchers", tenantId, startDate, endDate],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voucher_lines")
        .select("debit_account, credit_account, amount")
        .eq("tenant_id", tenantId!)
        .gte("voucher_date", startDate)
        .lte("voucher_date", endDate);
      if (error) throw error;
      return data || [];
    },
  });

  const { incomeAccounts, expenseAccounts, totalIncome, totalExpense, netProfit } = useMemo(() => {
    const balances: Record<string, number> = {};
    vouchers.forEach((v: any) => {
      const amt = Number(v.amount);
      if (v.debit_account) balances[v.debit_account] = (balances[v.debit_account] || 0) + amt;
      if (v.credit_account) balances[v.credit_account] = (balances[v.credit_account] || 0) - amt;
    });

    const filtered = productFilter === "all" ? accounts : accounts.filter((a: any) => !a.product_type || a.product_type === productFilter);

    const incomeAccounts = filtered
      .filter((a: any) => a.account_type === "income")
      .map((a: any) => {
        const key = `${a.code}-${a.name}`;
        const bal = balances[key] || 0;
        return { ...a, amount: Math.abs(bal) };
      })
      .filter((a: any) => a.amount > 0);

    const expenseAccounts = filtered
      .filter((a: any) => a.account_type === "expense")
      .map((a: any) => {
        const key = `${a.code}-${a.name}`;
        const bal = balances[key] || 0;
        return { ...a, amount: Math.abs(bal) };
      })
      .filter((a: any) => a.amount > 0);

    const totalIncome = incomeAccounts.reduce((s: number, a: any) => s + a.amount, 0);
    const totalExpense = expenseAccounts.reduce((s: number, a: any) => s + a.amount, 0);

    return { incomeAccounts, expenseAccounts, totalIncome, totalExpense, netProfit: totalIncome - totalExpense };
  }, [accounts, vouchers, productFilter]);

  const handleExport = () => {
    const csv = ["Account,Type,Amount"];
    incomeAccounts.forEach((a: any) => csv.push(`"${a.name}",Income,${a.amount}`));
    expenseAccounts.forEach((a: any) => csv.push(`"${a.name}",Expense,${a.amount}`));
    csv.push(`Net Profit,,${netProfit}`);
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `pnl-${startDate}-to-${endDate}.csv`; link.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-serif">Profit & Loss Statement</h1>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-1"><Download className="h-4 w-4" />Export CSV</Button>
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div><Label>From</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div><Label>To</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        <div>
          <Label>Product</Label>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="GL">GL</SelectItem><SelectItem value="PO">PO</SelectItem><SelectItem value="SA">SA</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Income */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base text-emerald-700">Income</CardTitle></CardHeader>
            <CardContent>
              {incomeAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No income entries</p>
              ) : (
                <div className="space-y-2">
                  {incomeAccounts.map((a: any) => (
                    <div key={a.id} className="flex justify-between text-sm">
                      <span>{a.name}</span>
                      <span className="font-medium">{formatINR(a.amount)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total Income</span>
                    <span className="text-emerald-700">{formatINR(totalIncome)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base text-red-700">Expenses</CardTitle></CardHeader>
            <CardContent>
              {expenseAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No expense entries</p>
              ) : (
                <div className="space-y-2">
                  {expenseAccounts.map((a: any) => (
                    <div key={a.id} className="flex justify-between text-sm">
                      <span>{a.name}</span>
                      <span className="font-medium">{formatINR(a.amount)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total Expenses</span>
                    <span className="text-red-700">{formatINR(totalExpense)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card className="md:col-span-2">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Net Profit / (Loss)</p>
              <p className={`text-3xl font-bold ${netProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {netProfit >= 0 ? "" : "("}{formatINR(Math.abs(netProfit))}{netProfit < 0 ? ")" : ""}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
