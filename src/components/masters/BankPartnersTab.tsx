import { useState } from "react";
import { useBankPartners } from "@/hooks/useMasters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/indian-locale";

function maskAccount(acc: string | null) {
  if (!acc || acc.length < 4) return acc || "—";
  return "••••" + acc.slice(-4);
}

export default function BankPartnersTab() {
  const { data, isLoading, upsert, remove, toggle } = useBankPartners();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const openAdd = () => { setForm({ name: "", contact_person: "", phone: "", account_number: "", ifsc: "", credit_limit: "", rate: "" }); setOpen(true); };
  const openEdit = (row: any) => { setForm(row); setOpen(true); };

  const handleSave = async () => {
    const { id, name, contact_person, phone, account_number, ifsc, credit_limit, rate } = form;
    await upsert({ ...(id ? { id } : {}), name, contact_person, phone, account_number, ifsc, credit_limit: parseFloat(credit_limit || "0"), rate: parseFloat(rate || "0") });
    setOpen(false);
  };

  if (isLoading) return <div className="space-y-2 mt-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4 mr-1" />Add Partner</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "Add"} Bank/NBFC Partner</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Contact Person</Label><Input value={form.contact_person || ""} onChange={e => setForm({ ...form, contact_person: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Account Number</Label><Input value={form.account_number || ""} onChange={e => setForm({ ...form, account_number: e.target.value })} /></div>
              <div><Label>IFSC Code</Label><Input value={form.ifsc || ""} onChange={e => setForm({ ...form, ifsc: e.target.value.toUpperCase() })} maxLength={11} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Credit Limit (₹)</Label><Input type="number" value={form.credit_limit || ""} onChange={e => setForm({ ...form, credit_limit: e.target.value })} /></div>
                <div><Label>Rate %</Label><Input type="number" step="0.01" value={form.rate || ""} onChange={e => setForm({ ...form, rate: e.target.value })} /></div>
              </div>
              <Button onClick={handleSave} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Phone</TableHead><TableHead>Account</TableHead><TableHead>IFSC</TableHead><TableHead>Credit Limit</TableHead><TableHead>Rate%</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {(data || []).map((row: any) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.contact_person || "—"}</TableCell>
              <TableCell>{row.phone || "—"}</TableCell>
              <TableCell className="font-mono">{maskAccount(row.account_number)}</TableCell>
              <TableCell className="font-mono">{row.ifsc || "—"}</TableCell>
              <TableCell>{formatINR(Number(row.credit_limit), 0)}</TableCell>
              <TableCell>{Number(row.rate).toFixed(2)}%</TableCell>
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
          {(!data || data.length === 0) && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No bank partners yet</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
