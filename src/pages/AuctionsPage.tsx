import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR, formatDate } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import { Gavel, CalendarIcon, TrendingUp, CheckCircle2, Clock, XCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_BADGES: Record<string, string> = {
  scheduled: "bg-[hsl(45,90%,50%,0.15)] text-[hsl(45,90%,35%)] border-[hsl(45,90%,50%,0.3)]",
  completed: "bg-[hsl(142,70%,45%,0.15)] text-[hsl(142,70%,35%)] border-[hsl(142,70%,45%,0.3)]",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  eligible: "bg-primary/15 text-primary border-primary/30",
};

export default function AuctionsPage() {
  const { tenantId } = useTenant();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Schedule dialog
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [auctionDate, setAuctionDate] = useState<Date | undefined>();
  const [venue, setVenue] = useState("");
  const [expectedValue, setExpectedValue] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loanSearch, setLoanSearch] = useState("");

  // Complete / Cancel dialogs
  const [completeDialog, setCompleteDialog] = useState<any>(null);
  const [salePrice, setSalePrice] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");

  // Data queries
  const { data: branches = [] } = useQuery({
    queryKey: ["branches", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data } = await supabase.from("branches").select("id, name").eq("tenant_id", tenantId!);
      return data || [];
    },
  });

  const { data: overdueLoans = [] } = useQuery({
    queryKey: ["auction-eligible-loans", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*, customer:customers(id, name, phone), branch:branches(id, name)")
        .eq("tenant_id", tenantId!)
        .in("status", ["active", "overdue", "matured"])
        .order("created_at");
      if (error) throw error;
      const now = new Date();
      return (data || []).filter((l: any) => {
        if (!l.maturity_date) return false;
        return differenceInDays(now, new Date(l.maturity_date)) >= 90;
      });
    },
  });

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ["auctions", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auctions")
        .select("*, loan:loans(*, customer:customers(id, name, phone), branch:branches(id, name))")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Loans not yet scheduled for auction
  const eligibleLoans = useMemo(
    () => overdueLoans.filter((l: any) => !auctions.some((a: any) => a.loan_id === l.id)),
    [overdueLoans, auctions]
  );

  // Filtered search for schedule dialog
  const filteredEligible = useMemo(() => {
    if (!loanSearch) return eligibleLoans;
    const q = loanSearch.toLowerCase();
    return eligibleLoans.filter(
      (l: any) => l.loan_number?.toLowerCase().includes(q) || l.customer?.name?.toLowerCase().includes(q)
    );
  }, [eligibleLoans, loanSearch]);

  // Filtered auctions
  const filteredAuctions = useMemo(() => {
    let list = auctions;
    if (statusFilter !== "all") list = list.filter((a: any) => a.status === statusFilter);
    if (branchFilter !== "all") list = list.filter((a: any) => a.loan?.branch_id === branchFilter);
    if (dateFrom) list = list.filter((a: any) => a.auction_date && new Date(a.auction_date) >= dateFrom);
    if (dateTo) list = list.filter((a: any) => a.auction_date && new Date(a.auction_date) <= dateTo);
    return list;
  }, [auctions, statusFilter, branchFilter, dateFrom, dateTo]);

  // Metrics
  const totalScheduled = auctions.filter((a: any) => a.status === "scheduled").length;
  const totalCompleted = auctions.filter((a: any) => a.status === "completed").length;
  const totalRecovered = auctions
    .filter((a: any) => a.status === "completed")
    .reduce((s: number, a: any) => s + Number(a.sale_price || 0), 0);

  // Schedule mutation
  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const loan = eligibleLoans.find((l: any) => l.id === selectedLoanId);
      if (!loan || !auctionDate || !tenantId) throw new Error("Missing required fields");
      const reserve = expectedValue ? Number(expectedValue) : Math.round(Number(loan.gold_value || 0) * 0.8);

      const { error } = await supabase.from("auctions").insert({
        tenant_id: tenantId,
        loan_id: loan.id,
        reserve_price: reserve,
        auction_date: format(auctionDate, "yyyy-MM-dd"),
        status: "scheduled",
        notes: [venue && `Venue: ${venue}`, remarks].filter(Boolean).join("\n") || null,
        notice_sent_at: new Date().toISOString(),
        created_by: user?.id,
      });
      if (error) throw error;

      // Audit log
      await supabase.from("audit_logs").insert({
        tenant_id: tenantId,
        entity_type: "auction",
        entity_id: loan.id,
        action: "Auction Scheduled",
        details: { loan_number: loan.loan_number, auction_date: format(auctionDate, "yyyy-MM-dd"), venue, expected_value: reserve },
        performed_by: user?.id,
        performed_by_name: profile?.full_name || user?.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      queryClient.invalidateQueries({ queryKey: ["auction-eligible-loans"] });
      toast({ title: "Auction Scheduled", description: "15-day notice will be sent to the borrower." });
      resetScheduleForm();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const resetScheduleForm = () => {
    setScheduleOpen(false);
    setSelectedLoanId("");
    setAuctionDate(undefined);
    setVenue("");
    setExpectedValue("");
    setRemarks("");
    setLoanSearch("");
  };

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!completeDialog || !tenantId) throw new Error("Missing data");
      const price = parseFloat(salePrice);
      if (isNaN(price) || price <= 0) throw new Error("Enter valid sale price");
      const principal = Number(completeDialog.loan?.amount || 0);
      const surplus = price - principal;

      await supabase.from("auctions").update({
        sale_price: price,
        buyer_name: buyerName || null,
        buyer_phone: buyerPhone || null,
        surplus_deficit: surplus,
        status: "completed",
        notes: completeNotes || null,
      }).eq("id", completeDialog.id);

      await supabase.from("loans").update({ status: "closed" }).eq("id", completeDialog.loan_id);

      await supabase.from("audit_logs").insert({
        tenant_id: tenantId,
        entity_type: "auction",
        entity_id: completeDialog.id,
        action: "Auction Completed",
        details: { sale_price: price, surplus_deficit: surplus, buyer: buyerName },
        performed_by: user?.id,
        performed_by_name: profile?.full_name || user?.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      toast({ title: "Auction Completed", description: `Sale recorded for ${formatINR(Number(salePrice))}` });
      setCompleteDialog(null);
      setSalePrice("");
      setBuyerName("");
      setBuyerPhone("");
      setCompleteNotes("");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Cancel
  const handleCancel = async (auction: any) => {
    if (!tenantId) return;
    await supabase.from("auctions").update({ status: "cancelled" }).eq("id", auction.id);
    queryClient.invalidateQueries({ queryKey: ["auctions"] });
    toast({ title: "Auction Cancelled" });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gavel className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold">Auction Management</h1>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2" onClick={() => setScheduleOpen(true)}>
          <CalendarIcon className="h-4 w-4" />Schedule Auction
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(45,90%,50%,0.15)]">
              <Clock className="h-5 w-5 text-[hsl(45,90%,35%)]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Scheduled</p>
              <p className="text-2xl font-bold">{totalScheduled}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(142,70%,45%,0.15)]">
              <CheckCircle2 className="h-5 w-5 text-[hsl(142,70%,35%)]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Completed</p>
              <p className="text-2xl font-bold">{totalCompleted}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/15">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Value Recovered</p>
              <p className="text-2xl font-bold">{formatINR(totalRecovered)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs">Branch</Label>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">From</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal text-sm", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                {dateFrom ? format(dateFrom, "dd MMM yy") : "Start"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label className="text-xs">To</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal text-sm", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                {dateTo ? format(dateTo, "dd MMM yy") : "End"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(dateFrom || dateTo || statusFilter !== "all" || branchFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); setStatusFilter("all"); setBranchFilter("all"); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Auction Table */}
      {filteredAuctions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Gavel className="mx-auto h-8 w-8 mb-2 opacity-40" />
            <p>No auctions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/10">
                <TableHead>Auction Date</TableHead>
                <TableHead>Loan No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Reserve / Sale</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuctions.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm">{a.auction_date ? formatDate(a.auction_date) : "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{a.loan?.loan_number}</TableCell>
                  <TableCell className="text-sm">{a.loan?.customer?.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-accent/15 text-accent border-accent/30">{a.loan?.product_type}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatINR(a.loan?.amount || 0)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {a.status === "completed" ? formatINR(a.sale_price || 0) : formatINR(a.reserve_price)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_BADGES[a.status] || ""}>{a.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {a.status === "scheduled" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setCompleteDialog(a)}>Mark Complete</Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleCancel(a)}>Cancel</Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Schedule Auction Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={(o) => { if (!o) resetScheduleForm(); else setScheduleOpen(true); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Schedule Auction</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Loan Search */}
            <div>
              <Label className="text-xs">Select Overdue Loan</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={loanSearch}
                  onChange={(e) => setLoanSearch(e.target.value)}
                  placeholder="Search by loan number or customer..."
                  className="pl-9"
                />
              </div>
              {filteredEligible.length > 0 && (
                <div className="border rounded-lg mt-2 max-h-40 overflow-auto">
                  {filteredEligible.map((loan: any) => (
                    <button
                      key={loan.id}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex justify-between items-center",
                        selectedLoanId === loan.id && "bg-accent/10 border-l-2 border-accent"
                      )}
                      onClick={() => setSelectedLoanId(loan.id)}
                    >
                      <div>
                        <span className="font-mono font-medium">{loan.loan_number}</span>
                        <span className="text-muted-foreground ml-2">{loan.customer?.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatINR(loan.amount)}</span>
                    </button>
                  ))}
                </div>
              )}
              {filteredEligible.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">No eligible overdue loans (90+ DPD)</p>
              )}
            </div>

            {/* Selected loan summary */}
            {selectedLoanId && (() => {
              const loan = eligibleLoans.find((l: any) => l.id === selectedLoanId);
              if (!loan) return null;
              return (
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Loan</span><span className="font-mono">{loan.loan_number}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{loan.customer?.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Principal</span><span>{formatINR(loan.amount)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Gold Value</span><span>{formatINR(loan.gold_value)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">DPD</span>
                      <Badge variant="outline" className="bg-destructive/10 text-destructive">{differenceInDays(new Date(), new Date(loan.maturity_date))}d</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Auction Date */}
            <div>
              <Label className="text-xs">Auction Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !auctionDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {auctionDate ? format(auctionDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={auctionDate} onSelect={setAuctionDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-xs">Auction House / Venue</Label>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Branch Hall, City Auction Center" />
            </div>

            <div>
              <Label className="text-xs">Expected Auction Value (₹)</Label>
              <Input type="number" value={expectedValue} onChange={(e) => setExpectedValue(e.target.value)} placeholder="Auto: 80% of gold value" />
            </div>

            <div>
              <Label className="text-xs">Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetScheduleForm}>Cancel</Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={!selectedLoanId || !auctionDate || scheduleMutation.isPending}
              onClick={() => scheduleMutation.mutate()}
            >
              {scheduleMutation.isPending ? "Scheduling..." : "Schedule Auction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Auction Dialog */}
      <Dialog open={!!completeDialog} onOpenChange={() => setCompleteDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Complete Auction</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Loan</span><span className="font-mono">{completeDialog?.loan?.loan_number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reserve Price</span><span>{formatINR(completeDialog?.reserve_price || 0)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Principal</span><span>{formatINR(completeDialog?.loan?.amount || 0)}</span></div>
              </CardContent>
            </Card>
            <div><Label className="text-xs">Sale Price (₹)</Label><Input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} /></div>
            <div><Label className="text-xs">Buyer Name</Label><Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} /></div>
            <div><Label className="text-xs">Buyer Phone</Label><Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} /></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={completeNotes} onChange={(e) => setCompleteNotes(e.target.value)} rows={2} /></div>
            {salePrice && (
              <div className="p-3 rounded border bg-muted text-sm">
                <div className="flex justify-between">
                  <span>Surplus / Deficit</span>
                  <span className={cn("font-bold", (parseFloat(salePrice) - (completeDialog?.loan?.amount || 0)) >= 0 ? "text-[hsl(142,70%,35%)]" : "text-destructive")}>
                    {formatINR(parseFloat(salePrice) - (completeDialog?.loan?.amount || 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialog(null)}>Cancel</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}>
              {completeMutation.isPending ? "Processing..." : "Complete Auction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}