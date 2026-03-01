import { useState } from "react";
import { useLoanSchemes } from "@/hooks/useMasters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CHARGE_LABELS: Record<string, string> = { GL: "Interest", PO: "Storage Charge", SA: "Holding Charge" };

export default function LoanSchemesTab() {
  const { data, isLoading, upsert, remove, toggle } = useLoanSchemes();
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const openAdd = () => {
    setForm({ product_type: "GL", name: "", rate: "", interest_type: "monthly", tenure_months: 12, overdue_rate: "", grace_period_days: 0, charge_label: "Interest", allowed_metals: ["gold"], gold_ltv_cap: 75, silver_ltv_cap: 50 });
    setOpen(true);
  };
  const openEdit = (row: any) => { setForm({ ...row, allowed_metals: row.allowed_metals || ["gold"] }); setOpen(true); };

  const setField = (k: string, v: any) => {
    const next = { ...form, [k]: v };
    if (k === "product_type") next.charge_label = CHARGE_LABELS[v] || "Interest";
    setForm(next);
  };

  const toggleMetal = (m: string) => {
    const metals = form.allowed_metals || [];
    setField("allowed_metals", metals.includes(m) ? metals.filter((x: string) => x !== m) : [...metals, m]);
  };

  const handleSave = async () => {
    const { id, product_type, name, rate, interest_type, tenure_months, overdue_rate, grace_period_days, charge_label, allowed_metals, gold_ltv_cap, silver_ltv_cap } = form;
    await upsert({ ...(id ? { id } : {}), product_type, name, rate: parseFloat(rate), interest_type, tenure_months: parseInt(tenure_months), overdue_rate: parseFloat(overdue_rate || "0"), grace_period_days: parseInt(grace_period_days || "0"), charge_label, allowed_metals, gold_ltv_cap, silver_ltv_cap });
    setOpen(false);
  };

  const filtered = (data || []).filter((r: any) => filter === "All" || r.product_type === filter);

  if (isLoading) return <div className="space-y-2 mt-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1">
          {["All", "GL", "PO", "SA"].map((t) => (
            <Button key={t} size="sm" variant={filter === t ? "default" : "outline"} onClick={() => setFilter(t)}
              className={filter === t ? "bg-accent text-accent-foreground" : ""}>{t === "All" ? "All" : t}</Button>
          ))}
        </div>
        <Button onClick={openAdd} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4 mr-1" />Add Scheme</Button>
      </div>
      <Table>
        <TableHeader><TableRow>
          <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Rate%</TableHead><TableHead>Tenure</TableHead>
          <TableHead>Gold LTV</TableHead><TableHead>Silver LTV</TableHead><TableHead>Metals</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {filtered.map((row: any) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell><Badge variant="outline">{row.product_type}</Badge></TableCell>
              <TableCell>{Number(row.rate).toFixed(2)}%</TableCell>
              <TableCell>{row.tenure_months}m</TableCell>
              <TableCell>{Number(row.gold_ltv_cap)}%</TableCell>
              <TableCell>{Number(row.silver_ltv_cap)}%</TableCell>
              <TableCell className="flex gap-1">{(row.allowed_metals || []).map((m: string) => <Badge key={m} variant="secondary" className={m === "gold" ? "bg-accent/20 text-accent" : ""}>{m}</Badge>)}</TableCell>
              <TableCell><Switch checked={row.is_active} onCheckedChange={(v) => toggle({ id: row.id, is_active: v })} /></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete "{row.name}"?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove(row.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No schemes yet</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit" : "Add"} Loan Scheme</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Type</Label>
              <Select value={form.product_type} onValueChange={(v) => setField("product_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="GL">Gold Loan</SelectItem><SelectItem value="PO">Purchase Order</SelectItem><SelectItem value="SA">Sale Agreement</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Name</Label><Input value={form.name || ""} onChange={e => setField("name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Rate %</Label><Input type="number" step="0.01" value={form.rate || ""} onChange={e => setField("rate", e.target.value)} /></div>
              <div>
                <Label>Interest Type</Label>
                <Select value={form.interest_type} onValueChange={(v) => setField("interest_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="daily">Daily</SelectItem><SelectItem value="flat">Flat</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Tenure (months)</Label><Input type="number" value={form.tenure_months || ""} onChange={e => setField("tenure_months", e.target.value)} /></div>
              <div><Label>Overdue Rate %</Label><Input type="number" step="0.01" value={form.overdue_rate || ""} onChange={e => setField("overdue_rate", e.target.value)} /></div>
              <div><Label>Grace (days)</Label><Input type="number" value={form.grace_period_days || ""} onChange={e => setField("grace_period_days", e.target.value)} /></div>
            </div>
            <div><Label>Charge Label</Label><Input value={form.charge_label || ""} onChange={e => setField("charge_label", e.target.value)} disabled className="bg-muted" /></div>
            <div>
              <Label>Allowed Metals</Label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2"><Checkbox checked={(form.allowed_metals || []).includes("gold")} onCheckedChange={() => toggleMetal("gold")} />Gold</label>
                <label className="flex items-center gap-2"><Checkbox checked={(form.allowed_metals || []).includes("silver")} onCheckedChange={() => toggleMetal("silver")} />Silver</label>
              </div>
            </div>
            <div>
              <Label>Gold LTV Cap: {form.gold_ltv_cap}%</Label>
              <Slider min={40} max={85} step={1} value={[form.gold_ltv_cap || 75]} onValueChange={([v]) => setField("gold_ltv_cap", v)} className="mt-2" />
            </div>
            <div>
              <Label>Silver LTV Cap: {form.silver_ltv_cap}%</Label>
              <Slider min={30} max={70} step={1} value={[form.silver_ltv_cap || 50]} onValueChange={([v]) => setField("silver_ltv_cap", v)} className="mt-2" />
            </div>
            <Button onClick={handleSave} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
