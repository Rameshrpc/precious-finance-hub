import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { useLabels } from "@/lib/labels";
import { formatINR, formatCompact, formatPhone, formatWeight } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import CustomerQuickCard from "@/components/CustomerQuickCard";
import { Search, ArrowLeft, Phone, MapPin, User, UserCheck, Coins, Plus, X, Package, TrendingUp, Banknote, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, addMonths } from "date-fns";

const PRODUCT_CARDS = [
  { type: "GL", title: "Gold Pledge Loan", desc: "Loan against gold ornaments", icon: "🏦" },
  { type: "PO", title: "Purchase-Sale Sec 325", desc: "Buy gold/silver from customer", icon: "💰" },
  { type: "SA", title: "Sale Agreement", desc: "Sell gold/silver to customer", icon: "📜" },
];

const PURPOSES = ["Personal Needs", "Business Working Capital", "Agriculture", "Education", "Medical", "Marriage", "Other"];

interface PledgeItemRow {
  _key: string;
  item_id: string;
  item_name: string;
  metal_type: "gold" | "silver";
  purity_id: string;
  purity_name: string;
  purity_percentage: number;
  description: string;
  gross_weight: string;
  deduction: string;
  net_weight: number;
  rate_per_gram: number;
  value: number;
}

function emptyItem(): PledgeItemRow {
  return {
    _key: crypto.randomUUID(),
    item_id: "", item_name: "", metal_type: "gold",
    purity_id: "", purity_name: "", purity_percentage: 91.6,
    description: "", gross_weight: "", deduction: "0",
    net_weight: 0, rate_per_gram: 0, value: 0,
  };
}

export default function TransactionsNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const { tenantId, enabledProducts: tenantProducts, enableSilver } = useTenant();
  const { user, profile } = useAuth();

  // Core state
  const [productType, setProductType] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [agentId, setAgentId] = useState("");
  const [amount, setAmount] = useState("");
  const [items, setItems] = useState<PledgeItemRow[]>([emptyItem()]);
  const [schemeId, setSchemeId] = useState("");
  const [disbursementMode, setDisbursementMode] = useState("cash");
  const [disbBank, setDisbBank] = useState("");
  const [disbAccount, setDisbAccount] = useState("");
  const [disbIfsc, setDisbIfsc] = useState("");
  const [disbUpi, setDisbUpi] = useState("");
  const [disbCheque, setDisbCheque] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const labels = useLabels(productType || "GL");
  const visibleProducts = PRODUCT_CARDS.filter((p) => tenantProducts.includes(p.type));

  useEffect(() => {
    if (visibleProducts.length === 1 && !productType) setProductType(visibleProducts[0].type);
  }, [visibleProducts.length]);

  // LOS prefill
  const { data: losApp } = useQuery({
    queryKey: ["los_app_prefill", applicationId],
    enabled: !!applicationId && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("loan_applications").select("*, customers(id, name, code, phone, city, category, photo_url)").eq("id", applicationId!).single();
      if (error) throw error;
      return data as any;
    },
  });
  useEffect(() => {
    if (losApp) { setProductType(losApp.product_type); setSelectedCustomer(losApp.customers); setAmount(String(losApp.amount_requested || "")); }
  }, [losApp]);

  // Customer search
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ["txn_customer_search", customerSearch, tenantId],
    enabled: !!tenantId && customerSearch.length >= 2 && !selectedCustomer,
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id, name, code, phone, city, category, photo_url").eq("tenant_id", tenantId!).or(`name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%,code.ilike.%${customerSearch}%`).limit(8);
      if (error) throw error;
      return data;
    },
  });

  // Agents
  const { data: agents } = useQuery({
    queryKey: ["agents_active", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("id, name, phone, commission_rate").eq("tenant_id", tenantId!).eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  // Items master
  const { data: masterItems } = useQuery({
    queryKey: ["items_master", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("id, name, item_groups(name, metal_type)").eq("tenant_id", tenantId!).eq("is_active", true);
      if (error) throw error;
      return data as any[];
    },
  });

  // Purities
  const { data: purities } = useQuery({
    queryKey: ["purities_master", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("purities").select("*").eq("tenant_id", tenantId!).eq("is_active", true);
      if (error) throw error;
      return data as any[];
    },
  });

  // Market rates
  const { data: todayRates } = useQuery({
    queryKey: ["market_rates_today", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("market_rates").select("*").eq("tenant_id", tenantId!).order("rate_date", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  // Schemes
  const { data: schemes } = useQuery({
    queryKey: ["schemes_for_product", tenantId, productType],
    enabled: !!tenantId && !!productType,
    queryFn: async () => {
      const { data, error } = await supabase.from("loan_schemes").select("*").eq("tenant_id", tenantId!).eq("product_type", productType).eq("is_active", true);
      if (error) throw error;
      return data as any[];
    },
  });

  const goldItems = useMemo(() => (masterItems || []).filter((i: any) => i.item_groups?.metal_type === "gold"), [masterItems]);
  const silverItems = useMemo(() => enableSilver ? (masterItems || []).filter((i: any) => i.item_groups?.metal_type === "silver") : [], [masterItems, enableSilver]);

  const gold22kRate = todayRates ? Number(todayRates.gold_22k) : 0;
  const gold24kRate = todayRates ? Number(todayRates.gold_24k) : 0;
  const silverPerKgRate = todayRates ? Number(todayRates.silver_per_kg) : 0;
  const silverPerGRate = silverPerKgRate / 1000;

  // Get rate for metal+purity
  const getRateForItem = useCallback((metalType: string, purityPct: number): number => {
    if (metalType === "gold") {
      // Adjust 22K rate by actual purity ratio. 22K = 91.67%, so rate/91.67 * purityPct
      return gold22kRate > 0 ? (gold22kRate / 91.67) * purityPct : 0;
    }
    // Silver: adjust from pure silver rate
    return silverPerGRate > 0 ? (silverPerGRate / 100) * purityPct : 0;
  }, [gold22kRate, silverPerGRate]);

  // Update item calculations
  const updateItem = useCallback((index: number, field: string, value: any) => {
    setItems(prev => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };

      // If item changed, set metal_type from master
      if (field === "item_id") {
        const master = (masterItems || []).find((m: any) => m.id === value);
        if (master) {
          row.item_name = master.name;
          row.metal_type = master.item_groups?.metal_type || "gold";
          // Reset purity
          row.purity_id = "";
          row.purity_name = "";
          row.purity_percentage = row.metal_type === "gold" ? 91.6 : 99.9;
        }
      }

      // If purity changed
      if (field === "purity_id") {
        const p = (purities || []).find((pp: any) => pp.id === value);
        if (p) {
          row.purity_name = p.name;
          row.purity_percentage = Number(p.percentage);
        }
      }

      // Recalc
      const gross = parseFloat(row.gross_weight) || 0;
      const ded = parseFloat(row.deduction) || 0;
      row.net_weight = Math.max(0, gross - ded);
      row.rate_per_gram = getRateForItem(row.metal_type, row.purity_percentage);
      row.value = row.net_weight * row.rate_per_gram;

      next[index] = row;
      return next;
    });
  }, [masterItems, purities, getRateForItem]);

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  // Running totals
  const totals = useMemo(() => {
    let goldCount = 0, goldWeight = 0, goldValue = 0;
    let silverCount = 0, silverWeight = 0, silverValue = 0;
    items.forEach(it => {
      if (it.metal_type === "gold") { goldCount++; goldWeight += it.net_weight; goldValue += it.value; }
      else { silverCount++; silverWeight += it.net_weight; silverValue += it.value; }
    });
    return { goldCount, goldWeight, goldValue, silverCount, silverWeight, silverValue, total: goldValue + silverValue };
  }, [items]);

  // Selected scheme
  const selectedScheme = useMemo(() => (schemes || []).find((s: any) => s.id === schemeId), [schemes, schemeId]);

  // Filtered schemes by metals present
  const filteredSchemes = useMemo(() => {
    const metals = new Set(items.filter(i => i.item_id).map(i => i.metal_type));
    return (schemes || []).filter((s: any) => {
      const allowed = s.allowed_metals || ["gold"];
      return [...metals].every(m => allowed.includes(m));
    });
  }, [schemes, items]);

  // LTV calculation
  const ltvCalc = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    if (!selectedScheme || amt === 0) return null;
    const goldCap = Number(selectedScheme.gold_ltv_cap);
    const silverCap = Number(selectedScheme.silver_ltv_cap);
    const maxGold = totals.goldValue * goldCap / 100;
    const maxSilver = totals.silverValue * silverCap / 100;
    const maxEligible = maxGold + maxSilver;
    const overallLtv = totals.total > 0 ? (amt / totals.total) * 100 : 0;
    const goldLtv = totals.goldValue > 0 ? (amt * (totals.goldValue / totals.total) / totals.goldValue) * 100 : 0;
    const silverLtv = totals.silverValue > 0 ? (amt * (totals.silverValue / totals.total) / totals.silverValue) * 100 : 0;
    return { maxEligible, overallLtv, goldLtv, silverLtv, goldCap, silverCap, exceeds: amt > maxEligible };
  }, [amount, selectedScheme, totals]);

  const maturityDate = useMemo(() => {
    if (!selectedScheme) return null;
    return addMonths(new Date(), selectedScheme.tenure_months);
  }, [selectedScheme]);

  const selectedAgent = useMemo(() => (agents || []).find((a: any) => a.id === agentId), [agents, agentId]);
  const commissionAmount = useMemo(() => {
    if (!selectedAgent || !amount) return 0;
    return (parseFloat(amount) * Number(selectedAgent.commission_rate)) / 100;
  }, [selectedAgent, amount]);

  // SAVE
  const handleSave = async () => {
    if (!selectedCustomer || !productType || !amount || parseFloat(amount) <= 0) {
      toast.error("Please fill customer, product, and amount"); return;
    }
    if (items.filter(i => i.item_id).length === 0) {
      toast.error("Add at least one item"); return;
    }
    setSaving(true);
    try {
      const prefix = productType;
      const { data: loanNum, error: rpcErr } = await supabase.rpc("generate_next_number", { p_tenant_id: tenantId!, p_prefix: prefix });
      if (rpcErr) throw rpcErr;

      const amt = parseFloat(amount);
      const { data: loan, error: loanErr } = await supabase.from("loans").insert({
        tenant_id: tenantId!,
        branch_id: profile?.branch_id || null,
        customer_id: selectedCustomer.id,
        loan_application_id: applicationId || null,
        agent_id: agentId && agentId !== "none" ? agentId : null,
        loan_number: loanNum as string,
        product_type: productType,
        scheme_id: schemeId || null,
        amount: amt,
        rate: selectedScheme ? Number(selectedScheme.rate) : 0,
        tenure_months: selectedScheme ? selectedScheme.tenure_months : 12,
        maturity_date: maturityDate ? format(maturityDate, "yyyy-MM-dd") : null,
        gold_value: totals.goldValue,
        silver_value: totals.silverValue,
        total_pledge_value: totals.total,
        gold_ltv: ltvCalc?.goldLtv || 0,
        silver_ltv: ltvCalc?.silverLtv || 0,
        overall_ltv: ltvCalc?.overallLtv || 0,
        disbursement_mode: disbursementMode,
        disbursement_bank_name: disbBank || null,
        disbursement_account: disbAccount || null,
        disbursement_ifsc: disbIfsc || null,
        disbursement_upi_id: disbUpi || null,
        disbursement_cheque_no: disbCheque || null,
        purpose: purpose || null,
        notes: notes || null,
        status: "active",
        created_by: user?.id || null,
      }).select().single();
      if (loanErr) throw loanErr;

      // Insert pledge items
      const pledgeRows = items.filter(i => i.item_id).map(i => ({
        loan_id: loan.id,
        tenant_id: tenantId!,
        item_id: i.item_id || null,
        item_name: i.item_name,
        metal_type: i.metal_type,
        purity_id: i.purity_id || null,
        purity_name: i.purity_name,
        purity_percentage: i.purity_percentage,
        description: i.description || null,
        gross_weight: parseFloat(i.gross_weight) || 0,
        deduction: parseFloat(i.deduction) || 0,
        net_weight: i.net_weight,
        rate_per_gram: i.rate_per_gram,
        value: i.value,
      }));
      if (pledgeRows.length > 0) {
        const { error: itemsErr } = await supabase.from("pledge_items").insert(pledgeRows);
        if (itemsErr) throw itemsErr;
      }

      toast.success(`${labels.product} ${loanNum} created successfully!`);
      navigate(`/transactions/${loan.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-32">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{productType ? `New ${labels.product}` : "New Transaction"}</h1>
          {applicationId && losApp && <p className="text-xs text-muted-foreground">From LOS: {losApp.application_number}</p>}
        </div>
      </div>

      {/* Product Selector */}
      {visibleProducts.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Select Product</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {visibleProducts.map((p) => (
                <button key={p.type} className={cn("p-4 rounded-xl border-2 text-center transition-all", productType === p.type ? "border-accent bg-accent/10 shadow-gold" : "border-border hover:border-accent/40")} onClick={() => setProductType(p.type)}>
                  <span className="text-2xl">{p.icon}</span>
                  <p className="font-bold text-sm mt-2">{p.type}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{p.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Section */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" />Customer</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {selectedCustomer ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <CustomerQuickCard customerId={selectedCustomer.id}>
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage src={selectedCustomer.photo_url || undefined} />
                  <AvatarFallback className="bg-accent/20 text-accent font-semibold text-sm">{selectedCustomer.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </CustomerQuickCard>
              <div className="flex-1 min-w-0">
                <CustomerQuickCard customerId={selectedCustomer.id}>
                  <p className="font-medium cursor-pointer hover:text-accent transition-colors">{selectedCustomer.name}</p>
                </CustomerQuickCard>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Badge variant="outline" className="text-[10px] font-mono">{selectedCustomer.code}</Badge>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{formatPhone(selectedCustomer.phone)}</span>
                  {selectedCustomer.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedCustomer.city}</span>}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }}>Change</Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name, phone, or code..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pl-9" />
              </div>
              {searching && <Skeleton className="h-10 w-full" />}
              {searchResults && searchResults.length > 0 && (
                <div className="border rounded-md divide-y max-h-56 overflow-y-auto">
                  {searchResults.map((c: any) => (
                    <CustomerQuickCard key={c.id} customerId={c.id}>
                      <button className="w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3" onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}>
                        <Avatar className="h-8 w-8"><AvatarImage src={c.photo_url || undefined} /><AvatarFallback className="bg-accent/20 text-accent text-xs">{c.name?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0"><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-muted-foreground">{c.code} · {formatPhone(c.phone)}</p></div>
                        <Badge variant="secondary" className="text-[10px]">{c.category}</Badge>
                      </button>
                    </CustomerQuickCard>
                  ))}
                </div>
              )}
              {searchResults && searchResults.length === 0 && customerSearch.length >= 2 && (
                <div className="text-center py-4 text-sm text-muted-foreground">No customers found. <Button variant="link" className="text-accent p-0 h-auto" onClick={() => navigate("/customers")}>Create New →</Button></div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Agent */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserCheck className="h-5 w-5" />Agent <span className="text-xs font-normal text-muted-foreground">(optional)</span></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger><SelectValue placeholder="Select agent (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Agent</SelectItem>
              {(agents || []).map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name} — {Number(a.commission_rate).toFixed(1)}%</SelectItem>)}
            </SelectContent>
          </Select>
          {selectedAgent && amount && parseFloat(amount) > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-accent/10 text-sm">
              <Coins className="h-4 w-4 text-accent" />
              Commission <strong className="text-foreground">{formatINR(commissionAmount)}</strong> <span className="text-muted-foreground">({Number(selectedAgent.commission_rate).toFixed(1)}%)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Display */}
      {productType && (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted text-sm">
          <TrendingUp className="h-4 w-4 text-accent" />
          <span>Today: <strong className="text-accent">Gold 22K {formatINR(gold22kRate)}/g</strong></span>
          <span className="text-muted-foreground">24K {formatINR(gold24kRate)}/g</span>
          {enableSilver && <span className="text-muted-foreground">Silver {formatINR(silverPerGRate, 2)}/g</span>}
          {!todayRates && <span className="text-destructive text-xs">(No rates set today)</span>}
        </div>
      )}

      {/* ITEMS SECTION */}
      {productType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2"><Package className="h-5 w-5" />Pledge Items</span>
              <Button size="sm" onClick={addItem} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-3.5 w-3.5 mr-1" />Add Item</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, idx) => (
              <div key={item._key} className="p-3 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                    {item.metal_type && <Badge variant="secondary" className={item.metal_type === "gold" ? "bg-accent/20 text-accent" : ""}>{item.metal_type === "gold" ? "🥇 Gold" : "🥈 Silver"}</Badge>}
                  </div>
                  {items.length > 1 && <Button size="icon" variant="ghost" onClick={() => removeItem(idx)} className="h-6 w-6 text-destructive"><X className="h-3.5 w-3.5" /></Button>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Item */}
                  <div>
                    <Label className="text-xs">Item</Label>
                    <Select value={item.item_id} onValueChange={(v) => updateItem(idx, "item_id", v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select item" /></SelectTrigger>
                      <SelectContent>
                        {goldItems.length > 0 && <SelectGroup><SelectLabel className="text-accent">🥇 Gold Items</SelectLabel>{goldItems.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectGroup>}
                        {silverItems.length > 0 && <SelectGroup><SelectLabel>🥈 Silver Items</SelectLabel>{silverItems.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectGroup>}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Purity */}
                  <div>
                    <Label className="text-xs">Purity</Label>
                    <Select value={item.purity_id} onValueChange={(v) => updateItem(idx, "purity_id", v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Purity" /></SelectTrigger>
                      <SelectContent>
                        {(purities || []).filter((p: any) => p.metal_type === item.metal_type).map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} {Number(p.percentage).toFixed(1)}%</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Description */}
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Input className="h-9 text-sm" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Gross Wt (g)</Label>
                    <Input className="h-9 text-sm" type="number" step="0.001" value={item.gross_weight} onChange={(e) => updateItem(idx, "gross_weight", e.target.value)} placeholder="0.000" />
                  </div>
                  <div>
                    <Label className="text-xs">Deduction (g)</Label>
                    <Input className="h-9 text-sm" type="number" step="0.001" value={item.deduction} onChange={(e) => updateItem(idx, "deduction", e.target.value)} placeholder="0.000" />
                  </div>
                  <div>
                    <Label className="text-xs">Net Wt</Label>
                    <div className="h-9 flex items-center px-3 rounded-md bg-muted text-sm font-bold">{formatWeight(item.net_weight)}</div>
                  </div>
                  <div>
                    <Label className="text-xs">Value</Label>
                    <div className="h-9 flex items-center px-3 rounded-md bg-muted text-sm font-bold text-accent">{formatINR(item.value)}</div>
                  </div>
                </div>
                {item.rate_per_gram > 0 && <p className="text-[10px] text-muted-foreground">Rate: {formatINR(item.rate_per_gram, 2)}/g @ {item.purity_percentage.toFixed(1)}%</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Running Totals Bar */}
      {productType && items.some(i => i.item_id) && (
        <div className="sticky bottom-0 z-10 p-3 rounded-lg bg-card border shadow-lg flex items-center justify-between flex-wrap gap-2 text-sm">
          {totals.goldCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Badge className="bg-accent text-accent-foreground">Gold</Badge>
              {totals.goldCount} items · {formatWeight(totals.goldWeight)} · <strong>{formatINR(totals.goldValue)}</strong>
            </span>
          )}
          {enableSilver && totals.silverCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Badge variant="secondary">Silver</Badge>
              {totals.silverCount} items · {formatWeight(totals.silverWeight)} · <strong>{formatINR(totals.silverValue)}</strong>
            </span>
          )}
          <span className="ml-auto font-bold text-foreground text-base">Total {formatINR(totals.total)}</span>
        </div>
      )}

      {/* Amount */}
      {productType && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Coins className="h-5 w-5" />{labels.amount}</CardTitle></CardHeader>
          <CardContent>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" className="text-lg" />
            {amount && parseFloat(amount) > 0 && <p className="text-xs text-muted-foreground mt-1">{formatINR(parseFloat(amount))} · {formatCompact(parseFloat(amount))}</p>}
          </CardContent>
        </Card>
      )}

      {/* Scheme Selector */}
      {productType && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Scheme</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={schemeId} onValueChange={setSchemeId}>
              <SelectTrigger><SelectValue placeholder="Select scheme" /></SelectTrigger>
              <SelectContent>
                {filteredSchemes.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {Number(s.rate).toFixed(1)}% · {s.tenure_months}mo · LTV {Number(s.gold_ltv_cap)}/{Number(s.silver_ltv_cap)}
                  </SelectItem>
                ))}
                {filteredSchemes.length === 0 && <SelectItem value="_none" disabled>No matching schemes</SelectItem>}
              </SelectContent>
            </Select>
            {selectedScheme && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="p-2 rounded-md bg-muted"><p className="text-xs text-muted-foreground">{labels.chargeRate}</p><p className="font-bold">{Number(selectedScheme.rate).toFixed(2)}%</p></div>
                <div className="p-2 rounded-md bg-muted"><p className="text-xs text-muted-foreground">Tenure</p><p className="font-bold">{selectedScheme.tenure_months} months</p></div>
                <div className="p-2 rounded-md bg-muted"><p className="text-xs text-muted-foreground">Maturity</p><p className="font-bold">{maturityDate ? format(maturityDate, "dd/MM/yyyy") : "—"}</p></div>
                <div className="p-2 rounded-md bg-muted"><p className="text-xs text-muted-foreground">{labels.charge}</p><p className="font-bold">{selectedScheme.charge_label}</p></div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* LTV Calculator */}
      {ltvCalc && (
        <Card className={ltvCalc.exceeds ? "border-destructive" : ""}>
          <CardHeader><CardTitle className="text-lg">LTV Calculator</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Max Eligible: <strong className="text-foreground">{formatINR(ltvCalc.maxEligible)}</strong></span>
              {ltvCalc.exceeds && <Badge variant="destructive">Exceeds LTV Cap!</Badge>}
            </div>
            {/* Overall LTV */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Overall LTV</span>
                <span className="font-bold">{ltvCalc.overallLtv.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(ltvCalc.overallLtv, 100)} className={cn("h-2.5", ltvCalc.overallLtv > 80 ? "[&>div]:bg-destructive" : ltvCalc.overallLtv > 60 ? "[&>div]:bg-[hsl(var(--warning))]" : "[&>div]:bg-[hsl(var(--success))]")} />
            </div>
            {/* Sub-bars for mixed metals */}
            {totals.goldValue > 0 && totals.silverValue > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[10px] mb-0.5"><span>Gold LTV</span><span>{ltvCalc.goldLtv.toFixed(1)}% of {ltvCalc.goldCap}%</span></div>
                  <Progress value={Math.min((ltvCalc.goldLtv / ltvCalc.goldCap) * 100, 100)} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-0.5"><span>Silver LTV</span><span>{ltvCalc.silverLtv.toFixed(1)}% of {ltvCalc.silverCap}%</span></div>
                  <Progress value={Math.min((ltvCalc.silverLtv / ltvCalc.silverCap) * 100, 100)} className="h-1.5" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Disbursement */}
      {productType && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Banknote className="h-5 w-5" />Disbursement</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={disbursementMode} onValueChange={setDisbursementMode} className="flex flex-wrap gap-3">
              {[{ v: "cash", l: "Cash" }, { v: "bank", l: "Bank Transfer" }, { v: "upi", l: "UPI" }, { v: "cheque", l: "Cheque" }].map(m => (
                <div key={m.v} className="flex items-center gap-2"><RadioGroupItem value={m.v} id={`d-${m.v}`} /><Label htmlFor={`d-${m.v}`}>{m.l}</Label></div>
              ))}
            </RadioGroup>
            {disbursementMode === "bank" && (
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Bank Name</Label><Input value={disbBank} onChange={e => setDisbBank(e.target.value)} className="h-9 text-sm" /></div>
                <div><Label className="text-xs">Account No</Label><Input value={disbAccount} onChange={e => setDisbAccount(e.target.value)} className="h-9 text-sm" /></div>
                <div><Label className="text-xs">IFSC</Label><Input value={disbIfsc} onChange={e => setDisbIfsc(e.target.value.toUpperCase())} className="h-9 text-sm" maxLength={11} /></div>
              </div>
            )}
            {disbursementMode === "upi" && (
              <div><Label className="text-xs">UPI ID</Label><Input value={disbUpi} onChange={e => setDisbUpi(e.target.value)} placeholder="name@upi" className="h-9 text-sm" /></div>
            )}
            {disbursementMode === "cheque" && (
              <div><Label className="text-xs">Cheque Number</Label><Input value={disbCheque} onChange={e => setDisbCheque(e.target.value)} className="h-9 text-sm" /></div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Purpose & Notes */}
      {productType && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Additional Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Purpose</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                <SelectContent>{PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." rows={3} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {productType && (
        <Button
          onClick={handleSave}
          disabled={saving || !selectedCustomer || !productType || !amount}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-14 text-lg font-bold shadow-gold"
        >
          {saving ? "Creating..." : (
            <><Save className="h-5 w-5 mr-2" />Create {labels.product}</>
          )}
        </Button>
      )}
    </div>
  );
}
