import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatINR } from "@/lib/indian-locale";
import { formatDate } from "@/lib/formatters";
import { Banknote, AlertTriangle, Plus } from "lucide-react";

const CashManagementPage = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [physicalCount, setPhysicalCount] = useState("");

  const { data: registers = [] } = useQuery({
    queryKey: ["cash_register"],
    queryFn: async () => {
      const { data } = await supabase.from("cash_register").select("*, branches(name)").order("register_date", { ascending: false }).limit(30);
      return data || [];
    },
  });

  const todayEntry = registers.find((r: any) => r.register_date === new Date().toISOString().split("T")[0]);

  const createToday = useMutation({
    mutationFn: async () => {
      if (!profile?.tenant_id) throw new Error("No tenant");
      const lastEntry = registers[0];
      const { error } = await supabase.from("cash_register").insert({
        tenant_id: profile.tenant_id,
        branch_id: profile.branch_id,
        register_date: new Date().toISOString().split("T")[0],
        opening_balance: lastEntry?.closing_balance || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cash_register"] }); toast.success("Today's register created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePhysical = useMutation({
    mutationFn: async () => {
      if (!todayEntry) return;
      const count = parseFloat(physicalCount);
      if (isNaN(count)) throw new Error("Invalid amount");
      const disc = count - todayEntry.closing_balance;
      const { error } = await supabase.from("cash_register").update({ physical_count: count, discrepancy: disc, verified_by: profile?.id }).eq("id", todayEntry.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cash_register"] }); toast.success("Physical count recorded"); setPhysicalCount(""); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cash Management</h1>
        {!todayEntry && <Button onClick={() => createToday.mutate()}><Plus className="h-4 w-4 mr-2" /> Open Today's Register</Button>}
      </div>

      {todayEntry && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Opening</p><p className="text-lg font-bold">{formatINR(todayEntry.opening_balance)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Inflows</p><p className="text-lg font-bold text-green-600">{formatINR(todayEntry.total_inflows)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Outflows</p><p className="text-lg font-bold text-red-600">{formatINR(todayEntry.total_outflows)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Closing</p><p className="text-lg font-bold">{formatINR(todayEntry.closing_balance)}</p></CardContent></Card>
          <Card className={todayEntry.discrepancy !== 0 ? "border-destructive" : ""}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Discrepancy</p>
              <p className={`text-lg font-bold ${todayEntry.discrepancy !== 0 ? "text-destructive" : "text-green-600"}`}>
                {formatINR(todayEntry.discrepancy)}
              </p>
              {todayEntry.discrepancy !== 0 && <AlertTriangle className="h-4 w-4 text-destructive mt-1" />}
            </CardContent>
          </Card>
        </div>
      )}

      {todayEntry && (
        <Card>
          <CardHeader><CardTitle>Physical Count</CardTitle></CardHeader>
          <CardContent className="flex gap-3">
            <Input type="number" placeholder="Enter physical cash count..." value={physicalCount} onChange={(e) => setPhysicalCount(e.target.value)} className="max-w-xs" />
            <Button onClick={() => updatePhysical.mutate()} disabled={!physicalCount}>Record Count</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Cash Register History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Opening</TableHead>
                <TableHead className="text-right">Inflows</TableHead>
                <TableHead className="text-right">Outflows</TableHead>
                <TableHead className="text-right">Closing</TableHead>
                <TableHead className="text-right">Physical</TableHead>
                <TableHead className="text-right">Discrepancy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registers.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDate(r.register_date)}</TableCell>
                  <TableCell>{(r.branches as any)?.name || "—"}</TableCell>
                  <TableCell className="text-right">{formatINR(r.opening_balance)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatINR(r.total_inflows)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatINR(r.total_outflows)}</TableCell>
                  <TableCell className="text-right font-medium">{formatINR(r.closing_balance)}</TableCell>
                  <TableCell className="text-right">{r.physical_count != null ? formatINR(r.physical_count) : "—"}</TableCell>
                  <TableCell className="text-right">
                    {r.discrepancy !== 0 ? (
                      <Badge variant="destructive">{formatINR(r.discrepancy)}</Badge>
                    ) : (
                      <span className="text-green-600">✓</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashManagementPage;
