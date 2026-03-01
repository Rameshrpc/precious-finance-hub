import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR, formatDate } from "@/lib/formatters";
import { BookMarked } from "lucide-react";

export default function LedgerPage() {
  const { tenantId } = useTenant();
  const [selectedAccount, setSelectedAccount] = useState("");
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: accounts = [] } = useQuery({
    queryKey: ["chart-of-accounts", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("chart_of_accounts").select("id, code, name").eq("tenant_id", tenantId!).order("code");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["ledger-entries", tenantId, selectedAccount, startDate, endDate],
    enabled: !!tenantId && !!selectedAccount,
    queryFn: async () => {
      // Get all voucher lines where this account is debit or credit
      const { data, error } = await supabase
        .from("voucher_lines")
        .select("*")
        .eq("tenant_id", tenantId!)
        .gte("voucher_date", startDate)
        .lte("voucher_date", endDate)
        .or(`debit_account.eq.${selectedAccount},credit_account.eq.${selectedAccount}`)
        .order("voucher_date")
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const ledgerEntries = useMemo(() => {
    let balance = 0;
    return vouchers.map((v: any) => {
      const isDebit = v.debit_account === selectedAccount;
      const dr = isDebit ? Number(v.amount) : 0;
      const cr = !isDebit ? Number(v.amount) : 0;
      balance += dr - cr;
      return { ...v, dr, cr, balance };
    });
  }, [vouchers, selectedAccount]);

  const totalDr = ledgerEntries.reduce((s, e) => s + e.dr, 0);
  const totalCr = ledgerEntries.reduce((s, e) => s + e.cr, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <BookMarked className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold font-serif">Ledger</h1>
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div className="min-w-[250px]">
          <Label>Account</Label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
            <SelectContent>
              {accounts.map((a: any) => <SelectItem key={a.id} value={`${a.code}-${a.name}`}>{a.code} - {a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>From</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div><Label>To</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
      </div>

      {!selectedAccount ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Select an account to view ledger</CardContent></Card>
      ) : isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : ledgerEntries.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No entries for this account in selected period</CardContent></Card>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Voucher</TableHead>
                <TableHead>Narration</TableHead>
                <TableHead>Contra A/c</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerEntries.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm">{formatDate(e.voucher_date)}</TableCell>
                  <TableCell className="font-mono text-xs">{e.voucher_number || "-"}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{e.narration || "-"}</TableCell>
                  <TableCell className="text-sm">{e.dr > 0 ? e.credit_account : e.debit_account}</TableCell>
                  <TableCell className="text-right font-medium">{e.dr > 0 ? formatINR(e.dr) : "-"}</TableCell>
                  <TableCell className="text-right font-medium">{e.cr > 0 ? formatINR(e.cr) : "-"}</TableCell>
                  <TableCell className={`text-right font-bold ${e.balance >= 0 ? "" : "text-red-600"}`}>{formatINR(Math.abs(e.balance))} {e.balance >= 0 ? "Dr" : "Cr"}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={4} className="text-right">Total</TableCell>
                <TableCell className="text-right">{formatINR(totalDr)}</TableCell>
                <TableCell className="text-right">{formatINR(totalCr)}</TableCell>
                <TableCell className="text-right">{formatINR(Math.abs(totalDr - totalCr))} {totalDr >= totalCr ? "Dr" : "Cr"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
