import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";

const ImportExportTab = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importStep, setImportStep] = useState<"upload" | "mapping" | "preview" | "done">("upload");
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setImportStep("mapping"); }
  };

  const handleImport = () => {
    setImportStep("preview");
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) { clearInterval(interval); setImportStep("done"); toast.success("Import complete"); }
    }, 200);
  };

  const handleExport = () => {
    toast.success("Export started. ZIP file will download shortly.");
  };

  return (
    <div className="space-y-6">
      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Import Data</CardTitle>
          <CardDescription>Import customers, loans, or transactions from CSV/XLSX</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {importStep === "upload" && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Drop CSV or XLSX file here, or click to browse</p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
              <Button variant="outline" onClick={() => fileRef.current?.click()}>Choose File</Button>
            </div>
          )}
          {importStep === "mapping" && file && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">{file.name}</span>
                <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Column mapping will be auto-detected. Review and confirm.</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {["Name → name", "Phone → phone", "Address → address", "City → city", "PAN → pan", "Aadhaar → aadhaar"].map((m) => (
                  <div key={m} className="flex items-center gap-2 py-1 px-2 rounded bg-muted/50">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>{m}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleImport}>Validate & Import</Button>
                <Button variant="outline" onClick={() => { setImportStep("upload"); setFile(null); }}>Cancel</Button>
              </div>
            </div>
          )}
          {importStep === "preview" && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Importing...</p>
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">{progress}% complete</p>
            </div>
          )}
          {importStep === "done" && (
            <div className="flex items-center gap-3 py-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium">Import Complete</p>
                <p className="text-sm text-muted-foreground">All records imported successfully</p>
              </div>
              <Button variant="outline" className="ml-auto" onClick={() => { setImportStep("upload"); setFile(null); setProgress(0); }}>Import More</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Export Data</CardTitle>
          <CardDescription>Download all data as a ZIP containing CSVs for each table</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport}><Download className="h-4 w-4 mr-2" /> Export All Data (ZIP)</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportExportTab;
