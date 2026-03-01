import { useState } from "react";
import { usePurities } from "@/hooks/useMasters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function PuritySection({ title, metalType, items, onAdd, onEdit, onDelete, onToggle }: {
  title: string; metalType: string; items: any[];
  onAdd: () => void; onEdit: (r: any) => void; onDelete: (id: string) => void; onToggle: (id: string, v: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <Button size="sm" onClick={onAdd} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Purity %</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.map((row: any) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{Number(row.percentage).toFixed(2)}%</TableCell>
              <TableCell><Switch checked={row.is_active} onCheckedChange={(v) => onToggle(row.id, v)} /></TableCell>
              <TableCell className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => onEdit(row)}><Pencil className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete "{row.name}"?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(row.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">None yet</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}

export default function PuritiesTab() {
  const { data, isLoading, upsert, remove, toggle } = usePurities();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [metalType, setMetalType] = useState("gold");

  const openDialog = (metal: string, row?: any) => {
    setMetalType(metal);
    setEditing(row || null);
    setName(row?.name || "");
    setPercentage(row ? String(row.percentage) : "");
    setOpen(true);
  };

  const handleSave = async () => {
    await upsert({ ...(editing ? { id: editing.id } : {}), name, percentage: parseFloat(percentage), metal_type: metalType });
    setOpen(false);
  };

  const goldPurities = (data || []).filter((p: any) => p.metal_type === "gold");
  const silverPurities = (data || []).filter((p: any) => p.metal_type === "silver");

  if (isLoading) return <div className="space-y-2 mt-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <div className="mt-4 space-y-8">
      <PuritySection title="🥇 Gold Purities" metalType="gold" items={goldPurities}
        onAdd={() => openDialog("gold")} onEdit={(r) => openDialog("gold", r)}
        onDelete={remove} onToggle={(id, v) => toggle({ id, is_active: v })} />
      <PuritySection title="🥈 Silver Purities" metalType="silver" items={silverPurities}
        onAdd={() => openDialog("silver")} onEdit={(r) => openDialog("silver", r)}
        onDelete={remove} onToggle={(id, v) => toggle({ id, is_active: v })} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} {metalType === "gold" ? "Gold" : "Silver"} Purity</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 22K" /></div>
            <div><Label>Percentage</Label><Input type="number" step="0.01" value={percentage} onChange={e => setPercentage(e.target.value)} placeholder="91.67" /></div>
            <Button onClick={handleSave} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
