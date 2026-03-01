import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useQuery } from "@tanstack/react-query";
import { formatINR } from "@/lib/formatters";
import { classifyLoan, getClassificationLabel, getClassificationColor } from "@/lib/npaEngine";
import { useState } from "react";

export default function DPDTrackerPage() {
  const { tenantId } = useTenant();
  const [bucket, setBucket] = useState("all");
  const [product, setProduct] = useState("all");

  const { data: loans } = useQuery({
    queryKey: ["dpd-tracker", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("loans").select("*, customers(name, code, phone), interest_records(status, due_date)")
        .eq("tenant_id", tenantId).eq("status", "active").limit(500);
      return (data || []).map((l: any) => {
        const overdue = (l.interest_records || []).filter((r: any) => r.status === "overdue" || r.status === "pending");
        const oldestDue = overdue.length > 0 ? overdue.sort((a: any, b: any) => a.due_date.localeCompare(b.due_date))[0]?.due_date : null;
        const dpd = oldestDue ? Math.max(0, Math.floor((Date.now() - new Date(oldestDue).getTime()) / 86400000)) : 0;
        const cls = classifyLoan(dpd);
        return { ...l, dpd, ...cls };
      }).filter((l: any) => l.dpd > 0).sort((a: any, b: any) => b.dpd - a.dpd);
    },
  });

  const filtered = (loans || []).filter((l: any) => {
    if (product !== "all" && l.product_type !== product) return false;
    if (bucket === "1-30" && (l.dpd < 1 || l.dpd > 30)) return false;
    if (bucket === "31-60" && (l.dpd < 31 || l.dpd > 60)) return false;
    if (bucket === "61-90" && (l.dpd < 61 || l.dpd > 90)) return false;
    if (bucket === "90+" && l.dpd <= 90) return false;
    return true;
  });

  const getDPDColor = (dpd: number) => {
    if (dpd <= 30) return "bg-yellow-100 text-yellow-800";
    if (dpd <= 60) return "bg-orange-100 text-orange-800";
    if (dpd <= 90) return "bg-red-100 text-red-800";
    return "bg-destructive text-destructive-foreground";
  };

  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="text-2xl font-display font-bold">DPD Tracker</h1>
      <div className="flex gap-3">
        <Select value={bucket} onValueChange={setBucket}>
          <SelectTrigger className="w-32"><SelectValue placeholder="DPD Bucket" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="1-30">1-30</SelectItem>
            <SelectItem value="31-60">31-60</SelectItem>
            <SelectItem value="61-90">61-90</SelectItem>
            <SelectItem value="90+">90+</SelectItem>
          </SelectContent>
        </Select>
        <Select value={product} onValueChange={setProduct}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="GL">GL</SelectItem>
            <SelectItem value="PO">PO</SelectItem>
            <SelectItem value="SA">SA</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="ml-auto">{filtered.length} loans</Badge>
      </div>
      <Card><CardContent className="pt-4">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Loan #</TableHead><TableHead>Customer</TableHead><TableHead>Phone</TableHead>
            <TableHead>Product</TableHead><TableHead>Amount</TableHead><TableHead>DPD</TableHead><TableHead>Classification</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell className="font-mono text-xs">{l.loan_number}</TableCell>
                <TableCell className="text-xs">{l.customers?.name}</TableCell>
                <TableCell className="text-xs">{l.customers?.phone}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{l.product_type}</Badge></TableCell>
                <TableCell className="text-xs">{formatINR(l.amount)}</TableCell>
                <TableCell><Badge className={getDPDColor(l.dpd) + " text-[10px]"}>{l.dpd}</Badge></TableCell>
                <TableCell className={getClassificationColor(l.classification) + " text-xs"}>{getClassificationLabel(l.classification)}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No overdue loans</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
