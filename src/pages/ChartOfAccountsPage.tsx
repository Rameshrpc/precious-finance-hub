import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, FolderTree } from "lucide-react";

const ACCOUNT_TYPES = ["asset", "liability", "income", "expense", "equity"] as const;
const TYPE_COLORS: Record<string, string> = {
  asset: "bg-blue-100 text-blue-800",
  liability: "bg-red-100 text-red-800",
  income: "bg-emerald-100 text-emerald-800",
  expense: "bg-orange-100 text-orange-800",
  equity: "bg-purple-100 text-purple-800",
};

export default function ChartOfAccountsPage() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("asset");
  const [product, setProduct] = useState<string>("");
  const [parentId, setParentId] = useState<string>("");
  const [productFilter, setProductFilter] = useState("all");

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["chart-of-accounts", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("code");
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = accounts.filter((a: any) => {
    if (productFilter !== "all" && a.product_type && a.product_type !== productFilter) return false;
    return true;
  });

  const grouped = ACCOUNT_TYPES.reduce((acc, t) => {
    acc[t] = filtered.filter((a: any) => a.account_type === t);
    return acc;
  }, {} as Record<string, any[]>);

  const handleAdd = async () => {
    if (!code.trim() || !name.trim() || !tenantId) { toast.error("Code and name required"); return; }
    try {
      await supabase.from("chart_of_accounts").insert({
        tenant_id: tenantId,
        code: code.trim(),
        name: name.trim(),
        account_type: type,
        product_type: product || null,
        parent_id: parentId || null,
      });
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      toast.success("Account added");
      setAddOpen(false);
      setCode(""); setName(""); setProduct(""); setParentId("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const renderTree = (items: any[], parentId: string | null = null, level = 0): React.ReactNode => {
    const children = items.filter((a) => (a.parent_id || null) === parentId);
    if (children.length === 0) return null;
    return children.map((account) => (
      <div key={account.id}>
        <div className={`flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded text-sm`} style={{ paddingLeft: `${level * 24 + 8}px` }}>
          <span className="font-mono text-xs text-muted-foreground w-16">{account.code}</span>
          <span className="flex-1 font-medium">{account.name}</span>
          {account.product_type && <Badge variant="outline" className="text-[10px]">{account.product_type}</Badge>}
          {account.is_system && <Badge variant="outline" className="text-[10px] bg-muted">System</Badge>}
        </div>
        {renderTree(items, account.id, level + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderTree className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-serif">Chart of Accounts</h1>
        </div>
        <div className="flex gap-2">
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="GL">GL</SelectItem>
              <SelectItem value="PO">PO</SelectItem>
              <SelectItem value="SA">SA</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setAddOpen(true)} className="gap-1"><Plus className="h-4 w-4" />Add Account</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {ACCOUNT_TYPES.map((t) => (
          <Card key={t}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={TYPE_COLORS[t]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Badge>
                <span className="text-xs text-muted-foreground">({grouped[t].length} accounts)</span>
              </div>
            </CardHeader>
            <CardContent>
              {grouped[t].length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No accounts</p>
              ) : (
                <div className="space-y-0.5">{renderTree(grouped[t])}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Account</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Code *</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="1000" /></div>
              <div className="col-span-2"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cash in Hand" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Product</Label>
                <Select value={product} onValueChange={setProduct}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent><SelectItem value="">All</SelectItem><SelectItem value="GL">GL</SelectItem><SelectItem value="PO">PO</SelectItem><SelectItem value="SA">SA</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Parent Account</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger><SelectValue placeholder="None (root)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {accounts.filter((a: any) => a.account_type === type).map((a: any) => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
