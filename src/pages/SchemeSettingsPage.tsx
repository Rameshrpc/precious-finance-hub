import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Plus, Pencil, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PRODUCT_OPTIONS = [
  { value: "GL", label: "Gold Loan" },
  { value: "PO", label: "Silver Loan" },
  { value: "SA", label: "Gold Storage" },
];

const INTEREST_TYPE_LABELS: Record<string, string> = {
  monthly: "Monthly Flat",
  daily: "Reducing Balance",
  flat: "Flat",
};

interface SchemeForm {
  id?: string;
  name: string;
  product_type: string;
  rate: string;
  interest_type: string;
  tenure_months: string;
  overdue_rate: string;
  grace_period_days: string;
  charge_label: string;
  gold_ltv_cap: number;
  silver_ltv_cap: number;
  is_active: boolean;
}

const emptyForm: SchemeForm = {
  name: "",
  product_type: "GL",
  rate: "",
  interest_type: "monthly",
  tenure_months: "12",
  overdue_rate: "",
  grace_period_days: "0",
  charge_label: "Interest",
  gold_ltv_cap: 75,
  silver_ltv_cap: 50,
  is_active: true,
};

const SchemeSettingsPage = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<SchemeForm>(emptyForm);
  const [filter, setFilter] = useState("All");

  const { data: schemes = [], isLoading } = useQuery({
    queryKey: ["schemes_settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("loan_schemes")
        .select("*")
        .eq("tenant_id", profile?.tenant_id || "")
        .order("name");
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });

  const saveScheme = useMutation({
    mutationFn: async () => {
      if (!profile?.tenant_id) throw new Error("No tenant");
      const payload = {
        tenant_id: profile.tenant_id,
        name: form.name,
        product_type: form.product_type,
        rate: parseFloat(form.rate),
        interest_type: form.interest_type,
        tenure_months: parseInt(form.tenure_months),
        overdue_rate: parseFloat(form.overdue_rate || "0"),
        grace_period_days: parseInt(form.grace_period_days || "0"),
        charge_label: form.charge_label,
        gold_ltv_cap: form.gold_ltv_cap,
        silver_ltv_cap: form.silver_ltv_cap,
        is_active: form.is_active,
      };
      if (form.id) {
        const { error } = await supabase.from("loan_schemes").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("loan_schemes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schemes_settings"] });
      setDialogOpen(false);
      toast.success(form.id ? "Scheme updated" : "Scheme created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("loan_schemes").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schemes_settings"] });
      toast.success("Status updated");
    },
  });

  const openAdd = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: any) => {
    setForm({
      id: s.id,
      name: s.name,
      product_type: s.product_type,
      rate: String(s.rate),
      interest_type: s.interest_type,
      tenure_months: String(s.tenure_months),
      overdue_rate: String(s.overdue_rate || ""),
      grace_period_days: String(s.grace_period_days || ""),
      charge_label: s.charge_label || "Interest",
      gold_ltv_cap: s.gold_ltv_cap || 75,
      silver_ltv_cap: s.silver_ltv_cap || 50,
      is_active: s.is_active,
    });
    setDialogOpen(true);
  };

  const setField = (k: keyof SchemeForm, v: any) => {
    const next = { ...form, [k]: v };
    if (k === "product_type") {
      next.charge_label = v === "GL" ? "Interest" : v === "PO" ? "Storage Charge" : "Holding Charge";
    }
    setForm(next);
  };

  const filtered = filter === "All" ? schemes : schemes.filter((s: any) => s.product_type === filter);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-accent" />
            Loan Schemes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure interest schemes and product settings</p>
        </div>
        <Button onClick={openAdd} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-1" /> Add Scheme
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-1">
        {["All", "GL", "PO", "SA"].map((t) => (
          <Button key={t} size="sm" variant={filter === t ? "default" : "outline"} onClick={() => setFilter(t)}
            className={filter === t ? "bg-accent text-accent-foreground" : ""}>
            {t === "All" ? "All" : PRODUCT_OPTIONS.find((p) => p.value === t)?.label || t}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Schemes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheme Name</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Rate %</TableHead>
                <TableHead>Interest Type</TableHead>
                <TableHead>Charge Label</TableHead>
                <TableHead>Max LTV%</TableHead>
                <TableHead>Tenure</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-accent/30 text-accent">
                      {PRODUCT_OPTIONS.find((p) => p.value === s.product_type)?.label || s.product_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{Number(s.rate).toFixed(2)}%</TableCell>
                  <TableCell className="text-sm">{INTEREST_TYPE_LABELS[s.interest_type] || s.interest_type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.charge_label}</TableCell>
                  <TableCell>{Number(s.gold_ltv_cap)}%</TableCell>
                  <TableCell>{s.tenure_months}m</TableCell>
                  <TableCell>
                    <Switch
                      checked={s.is_active}
                      onCheckedChange={(v) => toggleActive.mutate({ id: s.id, is_active: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No schemes yet. Click "Add Scheme" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Scheme" : "Add Scheme"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Scheme Name *</Label>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Gold Standard 12M" />
            </div>
            <div className="space-y-2">
              <Label>Product *</Label>
              <Select value={form.product_type} onValueChange={(v) => setField("product_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Interest Rate % *</Label>
                <Input type="number" step="0.01" value={form.rate} onChange={(e) => setField("rate", e.target.value)} placeholder="e.g. 1.5" />
              </div>
              <div className="space-y-2">
                <Label>Interest Calculation</Label>
                <Select value={form.interest_type} onValueChange={(v) => setField("interest_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly Flat</SelectItem>
                    <SelectItem value="daily">Reducing Balance</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Charge Label</Label>
              <Input value={form.charge_label} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Tenure (months)</Label>
                <Input type="number" value={form.tenure_months} onChange={(e) => setField("tenure_months", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Overdue Rate %</Label>
                <Input type="number" step="0.01" value={form.overdue_rate} onChange={(e) => setField("overdue_rate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Grace (days)</Label>
                <Input type="number" value={form.grace_period_days} onChange={(e) => setField("grace_period_days", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Gold LTV: {form.gold_ltv_cap}%</Label>
              <Slider min={40} max={85} step={1} value={[form.gold_ltv_cap]} onValueChange={([v]) => setField("gold_ltv_cap", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setField("is_active", v)} />
            </div>
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => saveScheme.mutate()}
              disabled={!form.name.trim() || !form.rate || saveScheme.isPending}
            >
              {saveScheme.isPending ? "Saving..." : form.id ? "Update Scheme" : "Create Scheme"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchemeSettingsPage;
