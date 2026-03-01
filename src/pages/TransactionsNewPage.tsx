import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { useLabels } from "@/lib/labels";
import { formatINR, formatCompact, formatPhone } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import CustomerQuickCard from "@/components/CustomerQuickCard";
import { Search, ArrowLeft, Phone, MapPin, User, UserCheck, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

const PRODUCT_CARDS = [
  { type: "GL", title: "Gold Pledge Loan", desc: "Loan against gold ornaments", icon: "🏦" },
  { type: "PO", title: "Purchase-Sale Sec 325", desc: "Buy gold/silver from customer", icon: "💰" },
  { type: "SA", title: "Sale Agreement", desc: "Sell gold/silver to customer", icon: "📜" },
];

export default function TransactionsNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const { tenantId } = useTenant();
  const { profile } = useAuth();

  // Core state
  const [productType, setProductType] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [agentId, setAgentId] = useState("");
  const [amount, setAmount] = useState("");

  const labels = useLabels(productType || "GL");

  // TODO: Read enabled products from tenant config. For now, show all.
  const enabledProducts = ["GL", "PO", "SA"];
  const visibleProducts = PRODUCT_CARDS.filter((p) => enabledProducts.includes(p.type));

  // Auto-select if only one product enabled
  useEffect(() => {
    if (visibleProducts.length === 1 && !productType) {
      setProductType(visibleProducts[0].type);
    }
  }, [visibleProducts.length]);

  // Auto-fill from LOS application
  const { data: losApp } = useQuery({
    queryKey: ["los_app_prefill", applicationId],
    enabled: !!applicationId && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loan_applications")
        .select("*, customers(id, name, code, phone, city, category, photo_url)")
        .eq("id", applicationId!)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    if (losApp) {
      setProductType(losApp.product_type);
      setSelectedCustomer(losApp.customers);
      setAmount(String(losApp.amount_requested || ""));
    }
  }, [losApp]);

  // Customer search
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ["txn_customer_search", customerSearch, tenantId],
    enabled: !!tenantId && customerSearch.length >= 2 && !selectedCustomer,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, code, phone, city, category, photo_url")
        .eq("tenant_id", tenantId!)
        .or(`name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%,code.ilike.%${customerSearch}%`)
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  // Agents
  const { data: agents } = useQuery({
    queryKey: ["agents_active", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("id, name, phone, commission_rate")
        .eq("tenant_id", tenantId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const selectedAgent = useMemo(() => (agents || []).find((a: any) => a.id === agentId), [agents, agentId]);
  const commissionAmount = useMemo(() => {
    if (!selectedAgent || !amount) return 0;
    return (parseFloat(amount) * Number(selectedAgent.commission_rate)) / 100;
  }, [selectedAgent, amount]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {productType ? `New ${labels.product}` : "New Transaction"}
          </h1>
          {applicationId && losApp && (
            <p className="text-xs text-muted-foreground">From LOS: {losApp.application_number}</p>
          )}
        </div>
      </div>

      {/* Product Selector */}
      {visibleProducts.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Select Product</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {visibleProducts.map((p) => (
                <button
                  key={p.type}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    productType === p.type
                      ? "border-accent bg-accent/10 shadow-gold"
                      : "border-border hover:border-accent/40"
                  )}
                  onClick={() => setProductType(p.type)}
                >
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
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />Customer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedCustomer ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <CustomerQuickCard customerId={selectedCustomer.id}>
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage src={selectedCustomer.photo_url || undefined} />
                  <AvatarFallback className="bg-accent/20 text-accent font-semibold text-sm">
                    {selectedCustomer.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
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
              <Button variant="ghost" size="sm" onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }}>
                Change
              </Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or code..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searching && <Skeleton className="h-10 w-full" />}
              {searchResults && searchResults.length > 0 && (
                <div className="border rounded-md divide-y max-h-56 overflow-y-auto">
                  {searchResults.map((c: any) => (
                    <CustomerQuickCard key={c.id} customerId={c.id}>
                      <button
                        className="w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                        onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={c.photo_url || undefined} />
                          <AvatarFallback className="bg-accent/20 text-accent text-xs">
                            {c.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.code} · {formatPhone(c.phone)}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{c.category}</Badge>
                      </button>
                    </CustomerQuickCard>
                  ))}
                </div>
              )}
              {searchResults && searchResults.length === 0 && customerSearch.length >= 2 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No customers found.{" "}
                  <Button variant="link" className="text-accent p-0 h-auto" onClick={() => navigate("/customers")}>
                    Create New →
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Agent Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5" />Agent
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select agent (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Agent</SelectItem>
              {(agents || []).map((a: any) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} — {Number(a.commission_rate).toFixed(1)}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAgent && amount && parseFloat(amount) > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-accent/10 text-sm">
              <Coins className="h-4 w-4 text-accent" />
              <span>
                Commission{" "}
                <strong className="text-foreground">{formatINR(commissionAmount)}</strong>{" "}
                <span className="text-muted-foreground">({Number(selectedAgent.commission_rate).toFixed(1)}%)</span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amount preview (for commission calc context) */}
      {productType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5" />{labels.amount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>{labels.amount} (₹)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="text-lg"
              />
              {amount && parseFloat(amount) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatINR(parseFloat(amount))} · {formatCompact(parseFloat(amount))}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder for remaining transaction fields (items, rates, etc.) */}
      <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {productType
            ? `${labels.product} details — items, weight, purity, rate calculations — coming next`
            : "Select a product type above to continue"}
        </p>
      </div>
    </div>
  );
}
