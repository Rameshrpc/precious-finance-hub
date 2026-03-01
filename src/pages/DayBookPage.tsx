import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR, formatDate } from "@/lib/formatters";
import { BookOpen } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  journal: "bg-blue-100 text-blue-800",
  receipt: "bg-emerald-100 text-emerald-800",
  payment: "bg-red-100 text-red-800",
  contra: "bg-purple-100 text-purple-800",
  disbursement: "bg-amber-100 text-amber-800",
  interest_collection: "bg-teal-100 text-teal-800",
  redemption: "bg-orange-100 text-orange-800",
  forfeiture_sale: "bg-pink-100 text-pink-800",
  auction_sale: "bg-indigo-100 text-indigo-800",
};

export default function DayBookPage() {
  const { tenantId } = useTenant();
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["voucher-lines", tenantId, startDate, endDate],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voucher_lines")
        .select("*")
        .eq("tenant_id", tenantId!)
        .gte("voucher_date", startDate)
        .lte("voucher_date", endDate)
        .order("voucher_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const totalAmount = vouchers.reduce((s: number, v: any) => s + Number(v.amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold font-serif">Day Book</h1>
      </div>

      <div className="flex gap-3 items-end">
        <div><Label>From</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div><Label>To</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        <div className="text-sm text-muted-foreground">{vouchers.length} entries · Total: {formatINR(totalAmount)}</div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : vouchers.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No vouchers for selected period</CardContent></Card>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Narration</TableHead>
                <TableHead>Debit A/c</TableHead>
                <TableHead>Credit A/c</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs">{v.voucher_number || "-"}</TableCell>
                  <TableCell className="text-sm">{formatDate(v.voucher_date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={TYPE_COLORS[v.voucher_type] || ""}>{v.voucher_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{v.narration || "-"}</TableCell>
                  <TableCell className="text-sm font-medium">{v.debit_account}</TableCell>
                  <TableCell className="text-sm font-medium">{v.credit_account}</TableCell>
                  <TableCell className="text-right font-bold">{formatINR(v.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
