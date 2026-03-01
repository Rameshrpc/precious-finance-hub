import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Eye } from "lucide-react";

const TEMPLATES = [
  "GL Certificate", "PO Bill", "SA Agreement",
  "GL Receipt", "PO Storage Receipt", "SA Holding Receipt",
  "GL Closure", "PO Buyback", "SA Repurchase",
  "Auction Notice", "Demand Notice", "NPA Notice",
  "Commission Statement", "Daily Statement", "Custom",
];

const MERGE_FIELDS = [
  "{customerName}", "{loanNo}", "{amount}", "{date}", "{principal}",
  "{interest}", "{rate}", "{tenure}", "{maturityDate}", "{phone}",
  "{address}", "{branchName}", "{companyName}", "{receiptNo}",
];

const PrintTemplatesTab = () => {
  const [selected, setSelected] = useState(TEMPLATES[0]);
  const [body, setBody] = useState(`Dear {customerName},\n\nThis is to certify that loan {loanNo} of amount {amount} has been issued on {date}.\n\nRegards,\n{companyName}`);
  const [showPreview, setShowPreview] = useState(false);

  const previewText = body
    .replace("{customerName}", "Rajesh Kumar")
    .replace("{loanNo}", "GL000123")
    .replace("{amount}", "₹2,50,000")
    .replace("{date}", "01/03/2026")
    .replace("{principal}", "₹2,50,000")
    .replace("{companyName}", "CofiZen Finance");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Print Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{TEMPLATES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex flex-wrap gap-1">
            {MERGE_FIELDS.map((f) => (
              <Badge key={f} variant="outline" className="cursor-pointer text-[10px] hover:bg-muted" onClick={() => { setBody((b) => b + " " + f); toast.info(`Inserted ${f}`); }}>
                {f}
              </Badge>
            ))}
          </div>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className="font-mono text-sm" />
          <div className="flex gap-2">
            <Button onClick={() => toast.success("Template saved")}>Save Template</Button>
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-1" /> {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>
          {showPreview && (
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <pre className="whitespace-pre-wrap text-sm">{previewText}</pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrintTemplatesTab;
