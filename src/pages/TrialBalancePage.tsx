import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR, formatDate } from "@/lib/formatters";
import { Scale, Download } from "lucide-react";

const TYPE_ORDER = ["asset", "liability", "income", "expense", "equity"];
const TYPE_COLORS: Record<string, string> = {
  asset: "bg-blue-100 text-blue-800",
  liability: "bg-red-100 text-red-800",
  income: "bg-emerald-100 text-emerald-800",
  expense: "bg-orange-100 text-orange-800",
  equity: "bg-purple-100 text-purple-800",
};

export default function TrialBalancePage() {
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
    queryKey: ["trial-balance-vouchers", tenantId, asOfDate],
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

  const trialBalance = useMemo(() => {
    const balances: Record<string, { dr: number; cr: number }> = {};
    vouchers.forEach((v: any) => {
      const amt = Number(v.amount);
      if (v.debit_account) {
        if (!balances[v.debit_account]) balances[v.debit_account] = { dr: 0, cr: 0 };
        balances[v.debit_account].dr += amt;
      }
      if (v.credit_account) {
        if (!balances[v.credit_account]) balances[v.credit_account] = { dr: 0, cr: 0 };
        balances[v.credit_account].cr += amt;
      }
    });

    const filtered = productFilter === "all" ? accounts : accounts.filter((a: any) => !a.product_type || a.product_type === productFilter);
    return filtered
      .map((a: any) => {
        const key = `${a.code}-${a.name}`;
        const bal = balances[key] || { dr: 0, cr: 0 };
        return { ...a, dr: bal.dr, cr: bal.cr, net: bal.dr - bal.cr };
      })
      .filter((a: any) => a.dr > 0 || a.cr > 0);
  }, [accounts, vouchers, productFilter]);

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    accounts: trialBalance.filter((a: any) => a.account_type === type),
  }));

  const totalDr = trialBalance.reduce((s, a) => s + a.dr, 0);
  const totalCr = trialBalance.reduce((s, a) => s + a.cr, 0);
  const isBalanced = Math.abs(totalDr - totalCr) < 0.01;

  const handleExport = () => {
    const csv = ["Code,Name,Type,Debit,Credit"];
    trialBalance.forEach((a) => csv.push(`${a.code},"${a.name}",${a.account_type},${a.dr},${a.cr}`));
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `trial-balance-${asOfDate}.csv`; link.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scale className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-serif">Trial Balance</h1>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-1"><Download className="h-4 w-4" />Export CSV</Button>
      </div>

      <div className="flex gap-3 items-end">
        <div><Label>As of Date</Label><Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} /></div>
        <div>
          <Label>Product</Label>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="GL">GL</SelectItem><SelectItem value="PO">PO</SelectItem><SelectItem value="SA">SA</SelectItem></SelectContent>
          </Select>
        </div>
        <div className={`text-sm font-medium ${isBalanced ? "text-emerald-600" : "text-red-600"}`}>
          {isBalanced ? "✓ Dr = Cr (Balanced)" : `⚠ Difference: ${formatINR(Math.abs(totalDr - totalCr))}`}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : trialBalance.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No transactions found</CardContent></Card>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Debit (₹)</TableHead>
                <TableHead className="text-right">Credit (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped.map((g) => g.accounts.length > 0 && (
                <>
                  <TableRow key={g.type} className="bg-muted/30">
                    <TableCell colSpan={5} className="py-1">
                      <Badge variant="outline" className={TYPE_COLORS[g.type]}>{g.type.charAt(0).toUpperCase() + g.type.slice(1)}</Badge>
                    </TableCell>
                  </TableRow>
                  {g.accounts.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.code}</TableCell>
                      <TableCell className="font-medium text-sm">{a.name}</TableCell>
                      <TableCell><Badge variant="outline" className={TYPE_COLORS[a.account_type] || ""} >{a.account_type}</Badge></TableCell>
                      <TableCell className="text-right">{a.dr > 0 ? formatINR(a.dr) : "-"}</TableCell>
                      <TableCell className="text-right">{a.cr > 0 ? formatINR(a.cr) : "-"}</TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
              <TableRow className="bg-muted/50 font-bold text-base">
                <TableCell colSpan={3} className="text-right">TOTAL</TableCell>
                <TableCell className="text-right">{formatINR(totalDr)}</TableCell>
                <TableCell className="text-right">{formatINR(totalCr)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
