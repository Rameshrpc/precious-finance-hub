import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/indian-locale";

interface Rule {
  id: string;
  txnType: string;
  minAmount: number;
  maxAmount: number;
  requiredRole: string;
}

const TXN_TYPES = ["New Loan", "Closure", "Partial Release", "Margin Renewal", "Re-Loan", "Forfeiture", "Auction", "Discount"];
const ROLES_LIST = ["manager", "tenant_admin", "super_admin"];

const ApprovalWorkflowsTab = () => {
  const [rules, setRules] = useState<Rule[]>([
    { id: "1", txnType: "New Loan", minAmount: 500000, maxAmount: 9999999, requiredRole: "manager" },
    { id: "2", txnType: "Discount", minAmount: 0, maxAmount: 9999999, requiredRole: "tenant_admin" },
    { id: "3", txnType: "Closure", minAmount: 1000000, maxAmount: 9999999, requiredRole: "tenant_admin" },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ txnType: "New Loan", minAmount: "0", maxAmount: "1000000", requiredRole: "manager" });

  const addRule = () => {
    setRules((prev) => [...prev, {
      id: Date.now().toString(),
      txnType: form.txnType,
      minAmount: parseInt(form.minAmount) || 0,
      maxAmount: parseInt(form.maxAmount) || 9999999,
      requiredRole: form.requiredRole,
    }]);
    setDialogOpen(false);
    toast.success("Approval rule added");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Approval Workflows</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Rule</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Approval Rule</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Select value={form.txnType} onValueChange={(v) => setForm({ ...form, txnType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TXN_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Min Amount</Label><Input type="number" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Max Amount</Label><Input type="number" value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} /></div>
                </div>
                <div className="space-y-2">
                  <Label>Required Role</Label>
                  <Select value={form.requiredRole} onValueChange={(v) => setForm({ ...form, requiredRole: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES_LIST.map((r) => <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={addRule}>Add Rule</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction Type</TableHead>
                <TableHead>Amount Range</TableHead>
                <TableHead>Required Role</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.txnType}</TableCell>
                  <TableCell>{formatINR(r.minAmount)} – {formatINR(r.maxAmount)}</TableCell>
                  <TableCell><Badge variant="secondary">{r.requiredRole.replace("_", " ")}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setRules((p) => p.filter((x) => x.id !== r.id)); toast.success("Rule removed"); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalWorkflowsTab;
