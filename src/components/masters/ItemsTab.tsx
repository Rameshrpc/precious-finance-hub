import { useState } from "react";
import { useItems, useItemGroups } from "@/hooks/useMasters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ItemsTab() {
  const { data, isLoading, upsert, remove, toggle } = useItems();
  const { data: groups } = useItemGroups();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState("");

  const openAdd = () => { setEditing(null); setName(""); setGroupId(""); setOpen(true); };
  const openEdit = (row: any) => { setEditing(row); setName(row.name); setGroupId(row.item_group_id); setOpen(true); };

  const handleSave = async () => {
    await upsert({ ...(editing ? { id: editing.id } : {}), name, item_group_id: groupId });
    setOpen(false);
  };

  const goldGroups = (groups || []).filter((g: any) => g.metal_type === "gold");
  const silverGroups = (groups || []).filter((g: any) => g.metal_type === "silver");

  if (isLoading) return <div className="space-y-2 mt-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4 mr-1" />Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Item</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chain 22K" /></div>
              <div>
                <Label>Item Group</Label>
                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    {goldGroups.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-accent">🥇 Gold</SelectLabel>
                        {goldGroups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </SelectGroup>
                    )}
                    {silverGroups.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-muted-foreground">🥈 Silver</SelectLabel>
                        {silverGroups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Group</TableHead><TableHead>Metal</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {(data || []).map((row: any) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.item_groups?.name || "—"}</TableCell>
              <TableCell><Badge variant={row.item_groups?.metal_type === "gold" ? "default" : "secondary"} className={row.item_groups?.metal_type === "gold" ? "bg-accent text-accent-foreground" : ""}>{row.item_groups?.metal_type === "gold" ? "Gold" : "Silver"}</Badge></TableCell>
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
          {(!data || data.length === 0) && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No items yet</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
