import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateApplication, useUpdateApplicationStage, STAGE_CONFIG } from "@/hooks/useLoanApplications";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Search, Plus, Upload, CheckCircle2, FileText, User, Camera, CreditCard, Home, Receipt } from "lucide-react";
import { formatINR } from "@/lib/indian-locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PURPOSES = ["Personal Needs", "Business Working Capital", "Agriculture", "Education", "Medical", "Marriage", "Other"];

const DOC_CHECKLIST = [
  { key: "aadhaar_front", label: "Aadhaar Front", icon: CreditCard, required: true },
  { key: "aadhaar_back", label: "Aadhaar Back", icon: CreditCard, required: true },
  { key: "pan", label: "PAN Card", icon: FileText, required: true },
  { key: "photo", label: "Photo", icon: Camera, required: true },
  { key: "address_proof", label: "Address Proof", icon: Home, required: true },
  { key: "gold_receipt", label: "Gold Receipt", icon: Receipt, required: false },
];

export default function NewApplicationPage() {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const createApp = useCreateApplication();
  const updateStage = useUpdateApplicationStage();

  const [step, setStep] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [productType, setProductType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amountRequested, setAmountRequested] = useState("");
  const [goldWeight, setGoldWeight] = useState("");

  // Created application for step 2
  const [createdApp, setCreatedApp] = useState<any>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocKey, setActiveDocKey] = useState<string | null>(null);

  // Customer search
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ["customer_search", customerSearch, tenantId],
    enabled: !!tenantId && customerSearch.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, code, phone, city, category")
        .eq("tenant_id", tenantId!)
        .or(`name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%,code.ilike.%${customerSearch}%`)
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const handleCreateApplication = async () => {
    if (!selectedCustomer || !productType || !amountRequested) {
      toast.error("Please fill all required fields");
      return;
    }
    const result = await createApp.mutateAsync({
      customer_id: selectedCustomer.id,
      product_type: productType,
      purpose,
      amount_requested: parseFloat(amountRequested),
      estimated_gold_weight: goldWeight ? parseFloat(goldWeight) : undefined,
    });
    setCreatedApp(result);
    setStep(2);
  };

  const handleFileUpload = async (docKey: string, file: File) => {
    if (!createdApp) return;
    setUploading(docKey);
    try {
      const filePath = `${tenantId}/${createdApp.id}/${docKey}_${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("los-documents").upload(filePath, file);
      if (error) throw error;
      setUploadedDocs((prev) => ({ ...prev, [docKey]: filePath }));
      toast.success(`${docKey.replace("_", " ")} uploaded`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeDocKey) {
      handleFileUpload(activeDocKey, file);
    }
    e.target.value = "";
  };

  const triggerUpload = (docKey: string) => {
    setActiveDocKey(docKey);
    fileInputRef.current?.click();
  };

  const kycProgress = Math.round((Object.keys(uploadedDocs).length / DOC_CHECKLIST.filter(d => d.required).length) * 100);

  const handleProceedToValuation = async () => {
    if (!createdApp) return;
    const docs = Object.entries(uploadedDocs).map(([key, path]) => ({ key, path }));
    await updateStage.mutateAsync({ id: createdApp.id, stage: "docs_collected", documents: docs });
    navigate("/transactions/los");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/transactions/los")}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold text-foreground">New Application</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[
          { num: 1, label: "Application Details" },
          { num: 2, label: "Documents" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold",
              step >= s.num ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
            )}>{s.num}</div>
            <span className={cn("text-sm", step >= s.num ? "text-foreground font-medium" : "text-muted-foreground")}>{s.label}</span>
            {s.num < 2 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          {/* Customer search */}
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" />Select Customer</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium">{selectedCustomer.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedCustomer.code} · {selectedCustomer.phone}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>Change</Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, phone, or code..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {searching && <Skeleton className="h-10 w-full" />}
                  {searchResults && searchResults.length > 0 && (
                    <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                      {searchResults.map((c: any) => (
                        <button
                          key={c.id}
                          className="w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                          onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}
                        >
                          <div>
                            <p className="font-medium text-sm">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.code} · {c.phone}</p>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">{c.category}</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults && searchResults.length === 0 && customerSearch.length >= 2 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No customers found.{" "}
                      <Button variant="link" className="text-accent p-0 h-auto" onClick={() => navigate("/customers")}>Create New →</Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Product type */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Product Type</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: "GL", label: "Gold Loan", desc: "Loan against gold" },
                  { type: "PO", label: "Purchase", desc: "Buy gold/silver" },
                  { type: "SA", label: "Sale", desc: "Sell gold/silver" },
                ].map((p) => (
                  <button
                    key={p.type}
                    className={cn(
                      "p-4 rounded-lg border-2 text-center transition-all",
                      productType === p.type ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                    )}
                    onClick={() => setProductType(p.type)}
                  >
                    <p className="font-bold text-lg">{p.type}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Application Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Purpose</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                  <SelectContent>
                    {PURPOSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount Requested (₹) *</Label>
                  <Input type="number" value={amountRequested} onChange={(e) => setAmountRequested(e.target.value)} placeholder="50000" />
                  {amountRequested && <p className="text-xs text-muted-foreground mt-1">{formatINR(parseFloat(amountRequested || "0"), 0)}</p>}
                </div>
                <div>
                  <Label>Estimated Gold Weight (g)</Label>
                  <Input type="number" step="0.001" value={goldWeight} onChange={(e) => setGoldWeight(e.target.value)} placeholder="10.000" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleCreateApplication}
            disabled={!selectedCustomer || !productType || !amountRequested || createApp.isPending}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-lg"
          >
            {createApp.isPending ? "Creating..." : "Save & Continue to Documents"}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}

      {step === 2 && createdApp && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Application: <span className="font-mono font-medium text-foreground">{createdApp.application_number}</span></p>
                <Badge className={STAGE_CONFIG.applied.bgClass}>Applied</Badge>
              </div>
            </CardContent>
          </Card>

          {/* KYC Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                KYC Documents
                <span className="text-sm font-normal text-muted-foreground">{kycProgress}% complete</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={kycProgress} className="h-2" />

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf"
                className="hidden"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DOC_CHECKLIST.map((doc) => {
                  const uploaded = !!uploadedDocs[doc.key];
                  const isUploading = uploading === doc.key;
                  return (
                    <button
                      key={doc.key}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all",
                        uploaded ? "border-[hsl(var(--success))] bg-[hsl(var(--success))]/10" : "border-dashed border-border hover:border-accent/50"
                      )}
                      onClick={() => !uploaded && triggerUpload(doc.key)}
                      disabled={isUploading}
                    >
                      {uploaded ? (
                        <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))] flex-shrink-0" />
                      ) : isUploading ? (
                        <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      ) : (
                        <doc.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className={cn("text-sm font-medium", uploaded ? "text-[hsl(var(--success))]" : "text-foreground")}>
                          {doc.label}
                          {doc.required && !uploaded && <span className="text-destructive ml-1">*</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {uploaded ? "Uploaded ✓" : isUploading ? "Uploading..." : "Click to upload"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleProceedToValuation}
            disabled={kycProgress < 60 || updateStage.isPending}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-lg"
          >
            {updateStage.isPending ? "Saving..." : "Proceed to Valuation"}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          {kycProgress < 60 && (
            <p className="text-xs text-center text-muted-foreground">
              Upload at least 3 required documents (60%) to proceed
            </p>
          )}
        </div>
      )}
    </div>
  );
}
