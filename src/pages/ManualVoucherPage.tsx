import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/formatters";
import { toast } from "sonner";
import { Plus, Trash2, FileText } from "lucide-react";

interface VoucherLine {
  id: string;
  debit_account: string;
  credit_account: string;
  amount: string;
  narration: string;
}

export default function ManualVoucherPage() {
  const { tenantId } = useTenant();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().slice(0, 10));
  const [voucherType, setVoucherType] = useState("journal");
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState<VoucherLine[]>([
    { id: "1", debit_account: "", credit_account: "", amount: "", narration: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ["chart-of-accounts", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("chart_of_accounts").select("id, code, name, account_type").eq("tenant_id", tenantId!).eq("is_active", true).order("code");
      if (error) throw error;
      return data || [];
    },
  });

  const addLine = () => {
    setLines([...lines, { id: String(Date.now()), debit_account: "", credit_account: "", amount: "", narration: "" }]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: keyof VoucherLine, value: string) => {
    setLines(lines.map((l) => l.id === id ? { ...l, [field]: value } : l));
  };

  const totalDr = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  // For simplicity, Dr = Cr in each line (single-entry per line with debit+credit accounts)
  const totalCr = totalDr;
  const isBalanced = totalDr > 0;

  const handlePost = async () => {
    if (!isBalanced) { toast.error("Add at least one line with amount"); return; }
    const invalidLines = lines.filter((l) => !l.debit_account || !l.credit_account || !l.amount);
    if (invalidLines.length > 0) { toast.error("Fill all line fields"); return; }

    setSubmitting(true);
    try {
      const voucherNumber = `V${Date.now().toString().slice(-8)}`;
      const inserts = lines.map((l) => ({
        tenant_id: tenantId!,
        voucher_date: voucherDate,
        voucher_type: voucherType,
        voucher_number: voucherNumber,
        debit_account: l.debit_account,
        credit_account: l.credit_account,
        amount: parseFloat(l.amount),
        narration: l.narration || narration,
        created_by: profile?.id,
      }));

      const { error } = await supabase.from("voucher_lines").insert(inserts);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["voucher-lines"] });
      toast.success(`Voucher ${voucherNumber} posted (${formatINR(totalDr)})`);
      navigate("/accounting/daybook");
    } catch (e: any) {
      toast.error(e.message);
    }
    setSubmitting(false);
  };

  const accountLabel = (id: string) => {
    const a = accounts.find((a: any) => a.id === id);
    return a ? `${a.code} - ${a.name}` : id;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold font-serif">Manual Voucher</h1>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={voucherType} onValueChange={setVoucherType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="journal">Journal</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="contra">Contra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Narration</Label>
              <Input value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Overall narration" />
            </div>
          </div>

          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Debit Account</TableHead>
                  <TableHead>Credit Account</TableHead>
                  <TableHead className="w-32">Amount (₹)</TableHead>
                  <TableHead>Line Narration</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, i) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <Select value={line.debit_account} onValueChange={(v) => updateLine(line.id, "debit_account", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Dr..." /></SelectTrigger>
                        <SelectContent>{accounts.map((a: any) => <SelectItem key={a.id} value={`${a.code}-${a.name}`}>{a.code} - {a.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={line.credit_account} onValueChange={(v) => updateLine(line.id, "credit_account", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Cr..." /></SelectTrigger>
                        <SelectContent>{accounts.map((a: any) => <SelectItem key={a.id} value={`${a.code}-${a.name}`}>{a.code} - {a.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input className="h-8 text-sm" type="number" value={line.amount} onChange={(e) => updateLine(line.id, "amount", e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input className="h-8 text-sm" value={line.narration} onChange={(e) => updateLine(line.id, "narration", e.target.value)} placeholder="Optional" />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLine(line.id)} disabled={lines.length <= 1}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={addLine} className="gap-1"><Plus className="h-3.5 w-3.5" />Add Line</Button>
            <div className="flex gap-4 text-sm">
              <span>Total Dr: <span className="font-bold">{formatINR(totalDr)}</span></span>
              <span>Total Cr: <span className="font-bold">{formatINR(totalCr)}</span></span>
              {isBalanced && <span className="text-emerald-600 font-medium">✓ Balanced</span>}
            </div>
          </div>

          <Button onClick={handlePost} disabled={submitting || !isBalanced} className="w-full">
            Post Voucher ({formatINR(totalDr)})
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
