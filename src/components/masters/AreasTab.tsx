import { useState } from "react";
import { useAreas } from "@/hooks/useMasters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AreasTab() {
  const { data, isLoading, upsert, remove, toggle } = useAreas();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [code, setCode] = useState("");

  const openAdd = () => { setEditing(null); setName(""); setCity(""); setCode(""); setOpen(true); };
  const openEdit = (row: any) => { setEditing(row); setName(row.name); setCity(row.city); setCode(row.code); setOpen(true); };

  const handleSave = async () => {
    await upsert({ ...(editing ? { id: editing.id } : {}), name, city, code });
    setOpen(false);
  };

  if (isLoading) return <div className="space-y-2 mt-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4 mr-1" />Add Area</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Area</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Koramangala" /></div>
              <div><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Bangalore" /></div>
              <div><Label>Code</Label><Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. KRM" maxLength={6} /></div>
              <Button onClick={handleSave} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>City</TableHead><TableHead>Code</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {(data || []).map((row: any) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.city}</TableCell>
              <TableCell className="font-mono">{row.code}</TableCell>
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
          {(!data || data.length === 0) && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No areas yet</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
