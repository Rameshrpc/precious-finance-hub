import { useState } from "react";
import { useItemGroups } from "@/hooks/useMasters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ItemGroupsTab() {
  const { data, isLoading, upsert, remove, toggle } = useItemGroups();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [metalType, setMetalType] = useState("gold");

  const openAdd = () => { setEditing(null); setName(""); setMetalType("gold"); setOpen(true); };
  const openEdit = (row: any) => { setEditing(row); setName(row.name); setMetalType(row.metal_type); setOpen(true); };

  const handleSave = async () => {
    await upsert({ ...(editing ? { id: editing.id } : {}), name, metal_type: metalType });
    setOpen(false);
  };

  if (isLoading) return <div className="space-y-2 mt-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4 mr-1" />Add Group</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Item Group</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ornaments" /></div>
              <div>
                <Label>Metal Type</Label>
                <RadioGroup value={metalType} onValueChange={setMetalType} className="flex gap-4 mt-1">
                  <div className="flex items-center gap-2"><RadioGroupItem value="gold" id="g" /><Label htmlFor="g">Gold</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="silver" id="s" /><Label htmlFor="s">Silver</Label></div>
                </RadioGroup>
              </div>
              <Button onClick={handleSave} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Metal</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {(data || []).map((row: any) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell><Badge variant={row.metal_type === "gold" ? "default" : "secondary"} className={row.metal_type === "gold" ? "bg-accent text-accent-foreground" : ""}>{row.metal_type === "gold" ? "Gold" : "Silver"}</Badge></TableCell>
              <TableCell><Switch checked={row.is_active} onCheckedChange={(v) => toggle({ id: row.id, is_active: v })} /></TableCell>
              <TableCell className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete "{row.name}"?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove(row.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
          {(!data || data.length === 0) && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No item groups yet</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
