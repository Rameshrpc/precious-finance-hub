import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatINR, formatDate } from "@/lib/formatters";
import { toast } from "sonner";
import { ArrowRightLeft, Plus } from "lucide-react";

export default function BalanceTransferPage() {
  const { tenantId } = useTenant();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState("");
  const [fromLender, setFromLender] = useState("");
  const [originalAmount, setOriginalAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-bt", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id, name, code, phone").eq("tenant_id", tenantId!).eq("status", "active").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["balance-transfers", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("balance_transfers")
        .select("*, customer:customers(name, code), new_loan:loans(loan_number)")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async () => {
    if (!customerId || !fromLender || !transferAmount || !tenantId) {
      toast.error("Fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await supabase.from("balance_transfers").insert({
        tenant_id: tenantId,
        customer_id: customerId,
        from_lender: fromLender,
        original_amount: parseFloat(originalAmount) || 0,
        transfer_amount: parseFloat(transferAmount),
        notes: notes || null,
        created_by: profile?.id,
        status: "pending",
      });
      queryClient.invalidateQueries({ queryKey: ["balance-transfers"] });
      toast.success("Balance transfer initiated. Create a new loan to complete.");
      setCustomerId(""); setFromLender(""); setOriginalAmount(""); setTransferAmount(""); setNotes("");
    } catch (e: any) {
      toast.error(e.message);
    }
    setSubmitting(false);
  };

  const pending = transfers.filter((t: any) => t.status === "pending");
  const completed = transfers.filter((t: any) => t.status === "completed");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <ArrowRightLeft className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold font-serif">Balance Transfer</h1>
      </div>

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new"><Plus className="h-3.5 w-3.5 mr-1" />New Transfer</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Initiate Balance Transfer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Customer *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>From Lender *</Label>
                <Input value={fromLender} onChange={(e) => setFromLender(e.target.value)} placeholder="e.g. Muthoot, Manappuram, SBI Gold Loan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Original Amount (₹)</Label><Input type="number" value={originalAmount} onChange={(e) => setOriginalAmount(e.target.value)} /></div>
                <div><Label>Transfer Amount (₹) *</Label><Input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional details..." /></div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full">Initiate Transfer</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {pending.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No pending transfers</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead><TableHead>From Lender</TableHead>
                    <TableHead className="text-right">Original</TableHead><TableHead className="text-right">Transfer</TableHead>
                    <TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.customer?.name}</TableCell>
                      <TableCell>{t.from_lender}</TableCell>
                      <TableCell className="text-right">{formatINR(t.original_amount)}</TableCell>
                      <TableCell className="text-right font-medium">{formatINR(t.transfer_amount)}</TableCell>
                      <TableCell>{formatDate(t.created_at)}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge></TableCell>
                      <TableCell><Button size="sm" variant="outline" onClick={() => navigate(`/transactions/new?customerId=${t.customer_id}&btId=${t.id}`)}>Create Loan</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completed.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No completed transfers</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead><TableHead>From Lender</TableHead>
                    <TableHead className="text-right">Transfer</TableHead><TableHead>New Loan</TableHead><TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completed.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.customer?.name}</TableCell>
                      <TableCell>{t.from_lender}</TableCell>
                      <TableCell className="text-right font-medium">{formatINR(t.transfer_amount)}</TableCell>
                      <TableCell className="font-mono text-sm">{t.new_loan?.loan_number || "-"}</TableCell>
                      <TableCell>{formatDate(t.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
