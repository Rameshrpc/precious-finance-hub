import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function TemplatesManagerPage() {
  const { tenantId } = useTenant();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [body, setBody] = useState("");
  const [product, setProduct] = useState<string>("");

  const { data: templates } = useQuery({
    queryKey: ["templates", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("wa_templates").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const variables = (body.match(/\{\{(\w+)\}\}/g) || []).map((v: string) => v.replace(/[{}]/g, ""));
      const record = { tenant_id: tenantId, name, category, body, variables, product_type: product || null };
      if (editing) {
        await supabase.from("wa_templates").update(record).eq("id", editing.id);
      } else {
        await supabase.from("wa_templates").insert(record);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); setEditOpen(false); toast.success("Template saved"); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("wa_templates").delete().eq("id", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); toast.success("Deleted"); },
  });

  const openNew = () => { setEditing(null); setName(""); setCategory("general"); setBody(""); setProduct(""); setEditOpen(true); };
  const openEdit = (t: any) => { setEditing(t); setName(t.name); setCategory(t.category); setBody(t.body); setProduct(t.product_type || ""); setEditOpen(true); };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-display font-bold">Message Templates</h1>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Template</Button>
      </div>
      <Card><CardContent className="pt-4">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Variables</TableHead><TableHead>Product</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {(templates || []).map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="text-xs font-medium">{t.name}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px]">{t.category}</Badge></TableCell>
                <TableCell className="flex gap-1 flex-wrap">{(t.variables || []).map((v: string) => <Badge key={v} variant="outline" className="text-[9px]">{v}</Badge>)}</TableCell>
                <TableCell>{t.product_type ? <Badge variant="outline" className="text-[10px]">{t.product_type}</Badge> : "All"}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Edit className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del.mutate(t.id)}><Trash2 className="h-3 w-3" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {(templates || []).length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No templates</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Template</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
                <SelectItem value="maturity">Maturity</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Template body. Use {{name}}, {{amount}}, {{date}}, {{loanNo}} for variables" rows={5} />
            <Select value={product} onValueChange={setProduct}>
              <SelectTrigger><SelectValue placeholder="All products" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="GL">GL</SelectItem>
                <SelectItem value="PO">PO</SelectItem>
                <SelectItem value="SA">SA</SelectItem>
              </SelectContent>
            </Select>
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-xs font-medium mb-1">Preview:</p>
              <p className="text-xs text-muted-foreground">{body.replace(/\{\{(\w+)\}\}/g, (_, k) => `[${k}]`)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!name || !body}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
