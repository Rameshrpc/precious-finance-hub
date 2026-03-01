import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR, formatDate, formatWeight } from "@/lib/formatters";
import { getLabel } from "@/lib/labels";
import { toast } from "sonner";
import { differenceInDays, addDays } from "date-fns";
import { AlertTriangle, Gavel, ShoppingCart, CheckCircle2, Bell, Clock } from "lucide-react";

interface LoanWithCustomer {
  id: string;
  loan_number: string;
  product_type: string;
  amount: number;
  status: string;
  maturity_date: string | null;
  gold_value: number;
  silver_value: number;
  total_pledge_value: number;
  created_at: string;
  customer: { id: string; name: string; phone: string } | null;
}

export default function ForfeituresPage() {
  const { tenantId } = useTenant();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [forfeitDialog, setForfeitDialog] = useState<LoanWithCustomer | null>(null);
  const [sellDialog, setSellDialog] = useState<any>(null);
  const [salePrice, setSalePrice] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  // Fetch PO/SA loans with maturity dates
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["forfeiture-loans", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*, customer:customers(id, name, phone)")
        .eq("tenant_id", tenantId!)
        .in("product_type", ["PO", "SA"])
        .in("status", ["active", "matured", "overdue", "forfeited"])
        .order("maturity_date", { ascending: true });
      if (error) throw error;
      return (data || []) as LoanWithCustomer[];
    },
  });

  const { data: forfeitures = [] } = useQuery({
    queryKey: ["forfeitures", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forfeitures")
        .select("*, loan:loans(*, customer:customers(id, name, phone))")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["forfeiture-sales", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forfeiture_sales")
        .select("*, loan:loans(loan_number, amount, product_type, customer:customers(name))")
        .eq("tenant_id", tenantId!)
        .order("sold_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const now = new Date();

  const expiringSoon = loans.filter((l) => {
    if (!l.maturity_date || l.status === "forfeited") return false;
    const daysLeft = differenceInDays(new Date(l.maturity_date), now);
    return daysLeft >= 0 && daysLeft <= 30;
  });

  const awaitingForfeiture = loans.filter((l) => {
    if (!l.maturity_date || l.status === "forfeited") return false;
    return differenceInDays(new Date(l.maturity_date), now) < 0;
  });

  const forfeitedItems = forfeitures.filter((f: any) => f.status === "forfeited");
  const soldItems = sales;

  const handleForfeit = async () => {
    if (!forfeitDialog || !tenantId) return;
    try {
      await supabase.from("forfeitures").insert({
        tenant_id: tenantId,
        loan_id: forfeitDialog.id,
        forfeiture_date: new Date().toISOString(),
        status: "forfeited",
        created_by: profile?.id,
      });
      await supabase.from("loans").update({ status: "forfeited" }).eq("id", forfeitDialog.id);
      await supabase.from("audit_logs").insert({
        tenant_id: tenantId,
        entity_type: "loan",
        entity_id: forfeitDialog.id,
        action: "Forfeited",
        performed_by: profile?.id,
        performed_by_name: profile?.full_name,
        details: { loan_number: forfeitDialog.loan_number },
      });
      queryClient.invalidateQueries({ queryKey: ["forfeiture-loans"] });
      queryClient.invalidateQueries({ queryKey: ["forfeitures"] });
      toast.success("Loan forfeited successfully");
      setForfeitDialog(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSell = async () => {
    if (!sellDialog || !tenantId) return;
    const price = parseFloat(salePrice);
    if (isNaN(price) || price <= 0) { toast.error("Enter valid sale price"); return; }
    const principal = Number(sellDialog.loan?.amount || 0);
    const pnl = price - principal;
    try {
      await supabase.from("forfeiture_sales").insert({
        tenant_id: tenantId,
        forfeiture_id: sellDialog.id,
        loan_id: sellDialog.loan_id,
        sale_price: price,
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        principal,
        profit_loss: pnl,
        created_by: profile?.id,
      });
      await supabase.from("forfeitures").update({ status: "sold" }).eq("id", sellDialog.id);
      // Auto-post accounting
      await supabase.from("voucher_lines").insert({
        tenant_id: tenantId,
        loan_id: sellDialog.loan_id,
        voucher_type: "forfeiture_sale",
        debit_account: "Cash/Bank",
        credit_account: pnl >= 0 ? "Gold Stock + Profit" : "Gold Stock - Loss",
        amount: price,
        narration: `Forfeiture sale: ${sellDialog.loan?.loan_number}`,
        created_by: profile?.id,
      });
      queryClient.invalidateQueries({ queryKey: ["forfeitures"] });
      queryClient.invalidateQueries({ queryKey: ["forfeiture-sales"] });
      toast.success(`Sale recorded. ${pnl >= 0 ? "Profit" : "Loss"}: ${formatINR(Math.abs(pnl))}`);
      setSellDialog(null);
      setSalePrice("");
      setBuyerName("");
      setBuyerPhone("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const LoanRow = ({ loan, actions }: { loan: LoanWithCustomer; actions: React.ReactNode }) => {
    const daysLeft = loan.maturity_date ? differenceInDays(new Date(loan.maturity_date), now) : null;
    return (
      <TableRow>
        <TableCell className="font-mono text-sm">{loan.loan_number}</TableCell>
        <TableCell>{loan.customer?.name}</TableCell>
        <TableCell>
          <Badge variant="outline" className={loan.product_type === "PO" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
            {getLabel(loan.product_type, "product")}
          </Badge>
        </TableCell>
        <TableCell className="text-right font-medium">{formatINR(loan.amount)}</TableCell>
        <TableCell className="text-right">{formatINR(loan.total_pledge_value)}</TableCell>
        <TableCell>{loan.maturity_date ? formatDate(loan.maturity_date) : "-"}</TableCell>
        <TableCell className="text-center">
          {daysLeft !== null && (
            <Badge variant="outline" className={daysLeft < 0 ? "bg-red-100 text-red-800" : daysLeft <= 7 ? "bg-orange-100 text-orange-800" : "bg-yellow-100 text-yellow-800"}>
              {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-right">{actions}</TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-serif">Forfeitures</h1>

      <Tabs defaultValue="expiring">
        <TabsList>
          <TabsTrigger value="expiring" className="gap-1"><Clock className="h-3.5 w-3.5" />Expiring Soon ({expiringSoon.length})</TabsTrigger>
          <TabsTrigger value="awaiting" className="gap-1"><AlertTriangle className="h-3.5 w-3.5" />Awaiting ({awaitingForfeiture.length})</TabsTrigger>
          <TabsTrigger value="forfeited" className="gap-1"><Gavel className="h-3.5 w-3.5" />Forfeited ({forfeitedItems.length})</TabsTrigger>
          <TabsTrigger value="sold" className="gap-1"><ShoppingCart className="h-3.5 w-3.5" />Sold ({soldItems.length})</TabsTrigger>
        </TabsList>

        {/* EXPIRING SOON */}
        <TabsContent value="expiring" className="mt-4">
          {expiringSoon.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No expiring loans in next 30 days</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan No</TableHead><TableHead>Customer</TableHead><TableHead>Product</TableHead>
                    <TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Pledge Value</TableHead>
                    <TableHead>Maturity</TableHead><TableHead className="text-center">Days Left</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringSoon.map((loan) => (
                    <LoanRow key={loan.id} loan={loan} actions={
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" className="gap-1"><Bell className="h-3 w-3" />Remind</Button>
                        <Button size="sm" variant="outline">Extend</Button>
                      </div>
                    } />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* AWAITING FORFEITURE */}
        <TabsContent value="awaiting" className="mt-4">
          {awaitingForfeiture.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No loans past expiry</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan No</TableHead><TableHead>Customer</TableHead><TableHead>Product</TableHead>
                    <TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Pledge Value</TableHead>
                    <TableHead>Maturity</TableHead><TableHead className="text-center">Overdue</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {awaitingForfeiture.map((loan) => (
                    <LoanRow key={loan.id} loan={loan} actions={
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline">Final Notice</Button>
                        <Button size="sm" variant="destructive" onClick={() => setForfeitDialog(loan)}>Forfeit</Button>
                      </div>
                    } />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* FORFEITED */}
        <TabsContent value="forfeited" className="mt-4">
          {forfeitedItems.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No forfeited items</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan No</TableHead><TableHead>Customer</TableHead><TableHead>Product</TableHead>
                    <TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Pledge Value</TableHead>
                    <TableHead>Forfeited On</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forfeitedItems.map((f: any) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-sm">{f.loan?.loan_number}</TableCell>
                      <TableCell>{f.loan?.customer?.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={f.loan?.product_type === "PO" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
                          {getLabel(f.loan?.product_type || "PO", "product")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatINR(f.loan?.amount || 0)}</TableCell>
                      <TableCell className="text-right">{formatINR(f.loan?.total_pledge_value || 0)}</TableCell>
                      <TableCell>{formatDate(f.forfeiture_date || f.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="default" onClick={() => setSellDialog(f)}>Sell</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* SOLD */}
        <TabsContent value="sold" className="mt-4">
          {soldItems.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No completed sales</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan No</TableHead><TableHead>Customer</TableHead>
                    <TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Sale Price</TableHead>
                    <TableHead className="text-right">P&L</TableHead><TableHead>Buyer</TableHead><TableHead>Sold On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {soldItems.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.loan?.loan_number}</TableCell>
                      <TableCell>{s.loan?.customer?.name}</TableCell>
                      <TableCell className="text-right">{formatINR(s.principal)}</TableCell>
                      <TableCell className="text-right font-medium">{formatINR(s.sale_price)}</TableCell>
                      <TableCell className={`text-right font-bold ${s.profit_loss >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {s.profit_loss >= 0 ? "+" : ""}{formatINR(s.profit_loss)}
                      </TableCell>
                      <TableCell>{s.buyer_name || "-"}</TableCell>
                      <TableCell>{formatDate(s.sold_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Forfeit Confirmation Dialog */}
      <Dialog open={!!forfeitDialog} onOpenChange={() => setForfeitDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Forfeiture</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This will forfeit loan <span className="font-bold text-foreground">{forfeitDialog?.loan_number}</span> and reclassify the pledged gold/silver as company stock.
            </p>
            <Card>
              <CardContent className="p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Customer</span><span className="font-medium">{forfeitDialog?.customer?.name}</span></div>
                <div className="flex justify-between"><span>Principal</span><span className="font-medium">{formatINR(forfeitDialog?.amount || 0)}</span></div>
                <div className="flex justify-between"><span>Pledge Value</span><span className="font-medium">{formatINR(forfeitDialog?.total_pledge_value || 0)}</span></div>
              </CardContent>
            </Card>
            <p className="text-xs text-destructive font-medium">⚠ This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForfeitDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleForfeit}>Confirm Forfeiture</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell Dialog */}
      <Dialog open={!!sellDialog} onOpenChange={() => setSellDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell Forfeited Items</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Card>
              <CardContent className="p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Loan</span><span className="font-mono">{sellDialog?.loan?.loan_number}</span></div>
                <div className="flex justify-between"><span>Principal</span><span className="font-medium">{formatINR(sellDialog?.loan?.amount || 0)}</span></div>
              </CardContent>
            </Card>
            <div>
              <Label>Sale Price (₹)</Label>
              <Input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="Enter sale price" />
            </div>
            <div>
              <Label>Buyer Name</Label>
              <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Buyer name" />
            </div>
            <div>
              <Label>Buyer Phone</Label>
              <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="Phone number" />
            </div>
            {salePrice && (
              <div className="p-3 rounded border bg-muted text-sm">
                <div className="flex justify-between">
                  <span>P&L</span>
                  <span className={`font-bold ${(parseFloat(salePrice) - (sellDialog?.loan?.amount || 0)) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatINR(parseFloat(salePrice) - (sellDialog?.loan?.amount || 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSellDialog(null)}>Cancel</Button>
            <Button onClick={handleSell}>Complete Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
