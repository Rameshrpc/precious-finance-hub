import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatINR, formatDate } from "@/lib/formatters";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { Gavel, Calendar, CheckCircle2 } from "lucide-react";

export default function AuctionsPage() {
  const { tenantId } = useTenant();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [scheduleDialog, setScheduleDialog] = useState<any>(null);
  const [completeDialog, setCompleteDialog] = useState<any>(null);
  const [auctionDate, setAuctionDate] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [notes, setNotes] = useState("");

  // GL loans that are NPA (90+ DPD overdue)
  const { data: glLoans = [] } = useQuery({
    queryKey: ["auction-eligible-loans", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*, customer:customers(id, name, phone)")
        .eq("tenant_id", tenantId!)
        .eq("product_type", "GL")
        .in("status", ["active", "overdue", "matured"])
        .order("created_at");
      if (error) throw error;
      // Filter 90+ DPD
      const now = new Date();
      return (data || []).filter((l: any) => {
        if (!l.maturity_date) return false;
        return differenceInDays(now, new Date(l.maturity_date)) >= 90;
      });
    },
  });

  const { data: auctions = [] } = useQuery({
    queryKey: ["auctions", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auctions")
        .select("*, loan:loans(*, customer:customers(id, name, phone))")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const eligible = glLoans.filter((l: any) => !auctions.some((a: any) => a.loan_id === l.id));
  const scheduled = auctions.filter((a: any) => a.status === "scheduled");
  const completed = auctions.filter((a: any) => a.status === "completed");

  const handleSchedule = async () => {
    if (!scheduleDialog || !tenantId || !auctionDate) return;
    const reserve = Math.round(Number(scheduleDialog.gold_value || 0) * 0.8);
    try {
      await supabase.from("auctions").insert({
        tenant_id: tenantId,
        loan_id: scheduleDialog.id,
        reserve_price: reserve,
        auction_date: auctionDate,
        status: "scheduled",
        notice_sent_at: new Date().toISOString(),
        created_by: profile?.id,
      });
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      queryClient.invalidateQueries({ queryKey: ["auction-eligible-loans"] });
      toast.success("Auction scheduled. 15-day notice sent.");
      setScheduleDialog(null);
      setAuctionDate("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleComplete = async () => {
    if (!completeDialog || !tenantId) return;
    const price = parseFloat(salePrice);
    if (isNaN(price) || price <= 0) { toast.error("Enter valid sale price"); return; }
    const principal = Number(completeDialog.loan?.amount || 0);
    const surplus = price - principal;
    try {
      await supabase.from("auctions").update({
        sale_price: price,
        buyer_name: buyerName,
        surplus_deficit: surplus,
        status: "completed",
        notes,
      }).eq("id", completeDialog.id);
      // Close the loan
      await supabase.from("loans").update({ status: "closed" }).eq("id", completeDialog.loan_id);
      // Accounting
      await supabase.from("voucher_lines").insert({
        tenant_id: tenantId,
        loan_id: completeDialog.loan_id,
        voucher_type: "auction_sale",
        debit_account: "Cash/Bank",
        credit_account: surplus >= 0 ? "Gold Loan + Surplus" : "Gold Loan - Deficit",
        amount: price,
        narration: `Auction sale: ${completeDialog.loan?.loan_number}`,
        created_by: profile?.id,
      });
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      toast.success(`Auction completed. ${surplus >= 0 ? "Surplus" : "Deficit"}: ${formatINR(Math.abs(surplus))}`);
      setCompleteDialog(null);
      setSalePrice("");
      setBuyerName("");
      setNotes("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Gavel className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold font-serif">Auctions</h1>
      </div>

      <Tabs defaultValue="eligible">
        <TabsList>
          <TabsTrigger value="eligible">Eligible ({eligible.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({scheduled.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="eligible" className="mt-4">
          {eligible.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No NPA loans eligible for auction (90+ DPD)</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan No</TableHead><TableHead>Customer</TableHead>
                    <TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Gold Value</TableHead>
                    <TableHead className="text-right">Reserve (80%)</TableHead><TableHead className="text-center">DPD</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eligible.map((loan: any) => {
                    const dpd = differenceInDays(new Date(), new Date(loan.maturity_date));
                    return (
                      <TableRow key={loan.id}>
                        <TableCell className="font-mono text-sm">{loan.loan_number}</TableCell>
                        <TableCell>{loan.customer?.name}</TableCell>
                        <TableCell className="text-right">{formatINR(loan.amount)}</TableCell>
                        <TableCell className="text-right">{formatINR(loan.gold_value)}</TableCell>
                        <TableCell className="text-right font-medium">{formatINR(Math.round(loan.gold_value * 0.8))}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline" className="bg-red-100 text-red-800">{dpd}d</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setScheduleDialog(loan)}>Schedule</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4">
          {scheduled.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No scheduled auctions</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan No</TableHead><TableHead>Customer</TableHead>
                    <TableHead className="text-right">Reserve</TableHead><TableHead>Auction Date</TableHead>
                    <TableHead>Notice Sent</TableHead><TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduled.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-sm">{a.loan?.loan_number}</TableCell>
                      <TableCell>{a.loan?.customer?.name}</TableCell>
                      <TableCell className="text-right font-medium">{formatINR(a.reserve_price)}</TableCell>
                      <TableCell>{a.auction_date ? formatDate(a.auction_date) : "-"}</TableCell>
                      <TableCell>{a.notice_sent_at ? formatDate(a.notice_sent_at) : "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => setCompleteDialog(a)}>Complete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completed.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No completed auctions</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan No</TableHead><TableHead>Customer</TableHead>
                    <TableHead className="text-right">Reserve</TableHead><TableHead className="text-right">Sale Price</TableHead>
                    <TableHead className="text-right">Surplus/Deficit</TableHead><TableHead>Buyer</TableHead><TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completed.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-sm">{a.loan?.loan_number}</TableCell>
                      <TableCell>{a.loan?.customer?.name}</TableCell>
                      <TableCell className="text-right">{formatINR(a.reserve_price)}</TableCell>
                      <TableCell className="text-right font-medium">{formatINR(a.sale_price || 0)}</TableCell>
                      <TableCell className={`text-right font-bold ${a.surplus_deficit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {a.surplus_deficit >= 0 ? "+" : ""}{formatINR(a.surplus_deficit)}
                      </TableCell>
                      <TableCell>{a.buyer_name || "-"}</TableCell>
                      <TableCell>{a.auction_date ? formatDate(a.auction_date) : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={!!scheduleDialog} onOpenChange={() => setScheduleDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Auction</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Card><CardContent className="p-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Loan</span><span className="font-mono">{scheduleDialog?.loan_number}</span></div>
              <div className="flex justify-between"><span>Customer</span><span className="font-medium">{scheduleDialog?.customer?.name}</span></div>
              <div className="flex justify-between"><span>Gold Value</span><span>{formatINR(scheduleDialog?.gold_value || 0)}</span></div>
              <div className="flex justify-between"><span>Reserve (80%)</span><span className="font-bold">{formatINR(Math.round((scheduleDialog?.gold_value || 0) * 0.8))}</span></div>
            </CardContent></Card>
            <div>
              <Label>Auction Date</Label>
              <Input type="date" value={auctionDate} onChange={(e) => setAuctionDate(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">A 15-day notice will be sent to the borrower.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialog(null)}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={!auctionDate}>Schedule & Send Notice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={!!completeDialog} onOpenChange={() => setCompleteDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Complete Auction</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Card><CardContent className="p-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Loan</span><span className="font-mono">{completeDialog?.loan?.loan_number}</span></div>
              <div className="flex justify-between"><span>Reserve</span><span>{formatINR(completeDialog?.reserve_price || 0)}</span></div>
              <div className="flex justify-between"><span>Principal</span><span>{formatINR(completeDialog?.loan?.amount || 0)}</span></div>
            </CardContent></Card>
            <div><Label>Sale Price (₹)</Label><Input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} /></div>
            <div><Label>Buyer Name</Label><Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} /></div>
            <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            {salePrice && (
              <div className="p-3 rounded border bg-muted text-sm">
                <div className="flex justify-between">
                  <span>Surplus/Deficit</span>
                  <span className={`font-bold ${(parseFloat(salePrice) - (completeDialog?.loan?.amount || 0)) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatINR(parseFloat(salePrice) - (completeDialog?.loan?.amount || 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialog(null)}>Cancel</Button>
            <Button onClick={handleComplete}>Complete Auction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
