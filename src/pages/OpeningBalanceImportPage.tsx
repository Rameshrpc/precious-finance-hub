import { useState, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface RowData {
  [key: string]: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const REQUIRED_FIELDS = [
  { key: "loan_number", label: "Loan Number" },
  { key: "customer_name", label: "Customer Name" },
  { key: "customer_phone", label: "Customer Phone" },
  { key: "product_type", label: "Product Type (GL/PO/SA)" },
  { key: "amount", label: "Amount" },
  { key: "rate", label: "Rate (%)" },
  { key: "tenure_months", label: "Tenure (months)" },
];

const OPTIONAL_FIELDS = [
  { key: "gold_value", label: "Gold Value" },
  { key: "silver_value", label: "Silver Value" },
  { key: "item_name", label: "Item Name" },
  { key: "item_weight", label: "Item Weight (g)" },
  { key: "item_metal", label: "Item Metal (gold/silver)" },
  { key: "item_purity", label: "Item Purity (%)" },
  { key: "purpose", label: "Purpose" },
  { key: "notes", label: "Notes" },
];

const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

export default function OpeningBalanceImportPage() {
  const { tenantId } = useTenant();
  const { user, profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [parsedRows, setParsedRows] = useState<RowData[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
      if (lines.length < 2) {
        toast({ title: "Error", description: "File must have headers and at least one data row", variant: "destructive" });
        return;
      }
      setHeaders(lines[0]);
      setRawData(lines.slice(1).filter((l) => l.some((c) => c)));

      // Auto-map by fuzzy match
      const autoMap: Record<string, string> = {};
      ALL_FIELDS.forEach((f) => {
        const match = lines[0].findIndex(
          (h) => h.toLowerCase().replace(/[^a-z]/g, "").includes(f.key.replace(/_/g, ""))
        );
        if (match >= 0) autoMap[f.key] = lines[0][match];
      });
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file);
  };

  const handleMapping = () => {
    // Parse rows using mapping
    const rows: RowData[] = rawData.map((row) => {
      const obj: RowData = {};
      ALL_FIELDS.forEach((f) => {
        const colName = mapping[f.key];
        if (colName) {
          const colIdx = headers.indexOf(colName);
          if (colIdx >= 0) obj[f.key] = row[colIdx] || "";
        }
      });
      return obj;
    });

    // Validate
    const errs: ValidationError[] = [];
    rows.forEach((row, idx) => {
      REQUIRED_FIELDS.forEach((f) => {
        if (!row[f.key]?.trim()) {
          errs.push({ row: idx + 1, field: f.label, message: "Required" });
        }
      });
      if (row.product_type && !["GL", "PO", "SA"].includes(row.product_type.toUpperCase())) {
        errs.push({ row: idx + 1, field: "Product Type", message: "Must be GL, PO, or SA" });
      }
      if (row.amount && isNaN(Number(row.amount))) {
        errs.push({ row: idx + 1, field: "Amount", message: "Must be a number" });
      }
    });

    setParsedRows(rows);
    setErrors(errs);
    setStep("preview");
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("No tenant");
      const branchId = profile?.branch_id;
      let imported = 0;

      for (const row of parsedRows) {
        // Check if customer exists by phone
        let customerId: string;
        const { data: existing } = await supabase
          .from("customers")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("phone", row.customer_phone)
          .maybeSingle();

        if (existing) {
          customerId = existing.id;
        } else {
          // Create customer
          const code = `IMP${String(imported + 1).padStart(5, "0")}`;
          const { data: newCust, error: custErr } = await supabase.from("customers").insert({
            tenant_id: tenantId,
            name: row.customer_name,
            phone: row.customer_phone,
            code,
            branch_id: branchId,
            created_by: user?.id,
          }).select("id").single();
          if (custErr) throw custErr;
          customerId = newCust.id;
        }

        // Create loan
        const { data: loan, error: loanErr } = await supabase.from("loans").insert({
          tenant_id: tenantId,
          customer_id: customerId,
          loan_number: row.loan_number,
          product_type: row.product_type.toUpperCase(),
          amount: Number(row.amount) || 0,
          rate: Number(row.rate) || 0,
          tenure_months: Number(row.tenure_months) || 12,
          gold_value: Number(row.gold_value) || 0,
          silver_value: Number(row.silver_value) || 0,
          total_pledge_value: (Number(row.gold_value) || 0) + (Number(row.silver_value) || 0),
          status: "imported",
          branch_id: branchId,
          purpose: row.purpose || "Opening Balance Import",
          notes: row.notes || "Imported from CSV",
          created_by: user?.id,
        }).select("id").single();
        if (loanErr) throw loanErr;

        // Create pledge item if provided
        if (row.item_name) {
          await supabase.from("pledge_items").insert({
            tenant_id: tenantId,
            loan_id: loan.id,
            item_name: row.item_name,
            metal_type: (row.item_metal || "gold").toLowerCase(),
            gross_weight: Number(row.item_weight) || 0,
            net_weight: Number(row.item_weight) || 0,
            purity_percentage: Number(row.item_purity) || 91.6,
            rate_per_gram: 0,
            value: 0,
          });
        }

        imported++;
      }

      return imported;
    },
    onSuccess: (count) => {
      toast({ title: "Import Complete", description: `${count} loans imported successfully` });
      setStep("done");
    },
    onError: (err: any) => {
      toast({ title: "Import Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">Opening Balance Import</h1>
      <p className="text-sm text-muted-foreground">
        Import existing loans from CSV file. Creates loans with status "imported".
      </p>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardContent className="py-12">
            <div
              className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">Click to upload CSV file</p>
              <p className="text-xs text-muted-foreground mt-1">Supports .csv files with headers</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>

            <Separator className="my-6" />

            <div className="text-sm">
              <p className="font-medium mb-2">Required columns:</p>
              <div className="flex flex-wrap gap-1.5">
                {REQUIRED_FIELDS.map((f) => (
                  <Badge key={f.key} variant="outline">{f.label}</Badge>
                ))}
              </div>
              <p className="font-medium mt-3 mb-2">Optional columns:</p>
              <div className="flex flex-wrap gap-1.5">
                {OPTIONAL_FIELDS.map((f) => (
                  <Badge key={f.key} variant="secondary" className="text-xs">{f.label}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {step === "map" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Column Mapping
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Found {rawData.length} rows. Map your columns to the required fields:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ALL_FIELDS.map((f) => (
                <div key={f.key}>
                  <Label className="text-xs">
                    {f.label}
                    {REQUIRED_FIELDS.some((r) => r.key === f.key) && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Select value={mapping[f.key] || ""} onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select column" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">— Skip —</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={handleMapping}>Validate & Preview</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          {errors.length > 0 && (
            <Card className="border-destructive/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-destructive font-medium text-sm mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.length} validation error(s)
                </div>
                <div className="max-h-32 overflow-y-auto text-xs space-y-0.5">
                  {errors.slice(0, 20).map((e, i) => (
                    <p key={i}>Row {e.row}: {e.field} — {e.message}</p>
                  ))}
                  {errors.length > 20 && <p className="text-muted-foreground">...and {errors.length - 20} more</p>}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="border rounded-lg overflow-auto max-h-80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Loan No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedRows.slice(0, 50).map((row, i) => {
                  const hasErr = errors.some((e) => e.row === i + 1);
                  return (
                    <TableRow key={i} className={hasErr ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{row.loan_number || "-"}</TableCell>
                      <TableCell className="text-sm">{row.customer_name || "-"}</TableCell>
                      <TableCell className="text-sm">{row.customer_phone || "-"}</TableCell>
                      <TableCell><Badge variant="outline">{row.product_type || "-"}</Badge></TableCell>
                      <TableCell className="text-right">{row.amount ? formatINR(Number(row.amount)) : "-"}</TableCell>
                      <TableCell className="text-sm">{row.rate || "-"}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {parsedRows.length > 50 && (
            <p className="text-xs text-muted-foreground">Showing first 50 of {parsedRows.length} rows</p>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStep("map")}>Back</Button>
            <Button
              disabled={errors.length > 0 || importMutation.isPending}
              onClick={() => importMutation.mutate()}
              className="gap-2"
            >
              {importMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Import {parsedRows.length} Loans
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === "done" && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
            <p className="text-lg font-bold">Import Complete!</p>
            <p className="text-sm text-muted-foreground mt-1">
              All loans have been created with status "imported".
            </p>
            <Button className="mt-4" onClick={() => setStep("upload")}>Import More</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
