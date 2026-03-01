import { useState, useRef, useCallback, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSaveCustomer, uploadCustomerPhoto, useBranches, type Customer } from "@/hooks/useCustomers";
import { useAuth } from "@/hooks/useAuth";
import { validateAadhaar, formatAadhaar, validatePAN, validateIndianPhone, validatePincode } from "@/lib/validators";
import { Loader2, Camera, Upload, CheckCircle, XCircle, User } from "lucide-react";

interface CustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}

const RELATIONS = ["Father", "Mother", "Spouse", "Son", "Daughter", "Brother", "Sister", "Other"];

const CustomerSheet = ({ open, onOpenChange, customer }: CustomerSheetProps) => {
  const isEdit = !!customer;
  const { toast } = useToast();
  const { profile } = useAuth();
  const saveMutation = useSaveCustomer();
  const { data: branches = [] } = useBranches();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp_same_as_phone: true,
    whatsapp_phone: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
    area: "",
    aadhaar: "",
    pan: "",
    photo_url: "",
    nominee_name: "",
    nominee_relation: "",
    nominee_phone: "",
    category: "Regular",
    branch_id: profile?.branch_id || "",
    status: "active",
  });

  const [aadhaarValid, setAadhaarValid] = useState<boolean | null>(null);
  const [panValid, setPanValid] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);

  // Populate form on edit
  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        phone: customer.phone || "",
        whatsapp_same_as_phone: customer.whatsapp_same_as_phone,
        whatsapp_phone: customer.whatsapp_phone || "",
        email: customer.email || "",
        address: customer.address || "",
        city: customer.city || "",
        pincode: customer.pincode || "",
        area: customer.area || "",
        aadhaar: customer.aadhaar || "",
        pan: customer.pan || "",
        photo_url: customer.photo_url || "",
        nominee_name: customer.nominee_name || "",
        nominee_relation: customer.nominee_relation || "",
        nominee_phone: customer.nominee_phone || "",
        category: customer.category || "Regular",
        branch_id: customer.branch_id || "",
        status: customer.status || "active",
      });
      if (customer.aadhaar) setAadhaarValid(validateAadhaar(customer.aadhaar));
      if (customer.pan) setPanValid(validatePAN(customer.pan));
    } else {
      setForm({
        name: "", phone: "", whatsapp_same_as_phone: true, whatsapp_phone: "",
        email: "", address: "", city: "", pincode: "", area: "", aadhaar: "",
        pan: "", photo_url: "", nominee_name: "", nominee_relation: "",
        nominee_phone: "", category: "Regular", branch_id: profile?.branch_id || "",
        status: "active",
      });
      setAadhaarValid(null);
      setPanValid(null);
    }
  }, [customer, profile?.branch_id]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleAadhaarBlur = () => {
    const cleaned = form.aadhaar.replace(/\s/g, "");
    if (cleaned.length === 12) {
      setAadhaarValid(validateAadhaar(cleaned));
    } else if (cleaned.length > 0) {
      setAadhaarValid(false);
    } else {
      setAadhaarValid(null);
    }
  };

  const handlePanBlur = () => {
    if (form.pan.length === 10) {
      setPanValid(validatePAN(form.pan));
    } else if (form.pan.length > 0) {
      setPanValid(false);
    } else {
      setPanValid(null);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadCustomerPhoto(file, file.name);
      update("photo_url", url);
      toast({ title: "Photo uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 320, height: 240 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      toast({ title: "Camera error", description: "Unable to access camera", variant: "destructive" });
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 320;
    canvas.height = 240;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0, 320, 240);
    canvas.toBlob(async (blob) => {
      if (blob) {
        await handlePhotoUpload(new File([blob], "webcam-capture.jpg", { type: "image/jpeg" }));
      }
    }, "image/jpeg", 0.85);
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!validateIndianPhone(form.phone)) {
      toast({ title: "Valid 10-digit phone required", variant: "destructive" });
      return;
    }
    if (form.pincode && !validatePincode(form.pincode)) {
      toast({ title: "Valid 6-digit pincode required", variant: "destructive" });
      return;
    }

    try {
      await saveMutation.mutateAsync({
        ...(customer ? { id: customer.id } : {}),
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ""),
        whatsapp_same_as_phone: form.whatsapp_same_as_phone,
        whatsapp_phone: form.whatsapp_same_as_phone ? null : form.whatsapp_phone.replace(/\D/g, "") || null,
        email: form.email || null,
        address: form.address || null,
        city: form.city || null,
        pincode: form.pincode || null,
        area: form.area || null,
        aadhaar: form.aadhaar.replace(/\s/g, "") || null,
        aadhaar_verified: aadhaarValid === true,
        pan: form.pan.toUpperCase() || null,
        photo_url: form.photo_url || null,
        nominee_name: form.nominee_name || null,
        nominee_relation: form.nominee_relation || null,
        nominee_phone: form.nominee_phone.replace(/\D/g, "") || null,
        category: form.category,
        status: form.status,
        branch_id: form.branch_id || null,
      } as any);
      toast({ title: isEdit ? "Customer updated" : "Customer created" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) stopCamera(); onOpenChange(v); }}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-4 sticky top-0 bg-card z-10 border-b border-border">
          <SheetTitle className="font-display">{isEdit ? "Edit Customer" : "Add Customer"}</SheetTitle>
        </SheetHeader>

        <div className="px-6 py-4 space-y-6">
          {/* 1. BASIC */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Basic Information</h3>
            <div className="space-y-3">
              <div>
                <Label>Full Name *</Label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Customer full name" />
              </div>
              <div>
                <Label>Phone *</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 rounded-md border border-input bg-muted text-sm font-medium text-muted-foreground shrink-0">+91</div>
                  <Input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="98765 43210"
                    maxLength={10}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="wa-same"
                  checked={form.whatsapp_same_as_phone}
                  onCheckedChange={(v) => update("whatsapp_same_as_phone", v)}
                />
                <Label htmlFor="wa-same" className="text-sm">WhatsApp same as phone</Label>
              </div>
              {!form.whatsapp_same_as_phone && (
                <div>
                  <Label>WhatsApp Number</Label>
                  <Input
                    value={form.whatsapp_phone}
                    onChange={(e) => update("whatsapp_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="WhatsApp number"
                  />
                </div>
              )}
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" />
              </div>
            </div>
          </section>

          <Separator />

          {/* 2. ADDRESS */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Address</h3>
            <div className="space-y-3">
              <div>
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Street address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>City</Label>
                  <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="City" />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input
                    value={form.pincode}
                    onChange={(e) => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="560001"
                    maxLength={6}
                  />
                </div>
              </div>
              <div>
                <Label>Area</Label>
                <Input value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="Area / Locality" />
              </div>
            </div>
          </section>

          <Separator />

          {/* 3. KYC */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">KYC Documents</h3>
            <div className="space-y-3">
              <div>
                <Label>Aadhaar Number</Label>
                <div className="relative">
                  <Input
                    value={formatAadhaar(form.aadhaar)}
                    onChange={(e) => update("aadhaar", e.target.value.replace(/\D/g, "").slice(0, 12))}
                    onBlur={handleAadhaarBlur}
                    placeholder="1234 5678 9012"
                    maxLength={14}
                  />
                  {aadhaarValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {aadhaarValid ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
                {aadhaarValid === false && (
                  <p className="text-xs text-destructive mt-1">Invalid Aadhaar number (checksum failed)</p>
                )}
              </div>
              <div>
                <Label>PAN Number</Label>
                <div className="relative">
                  <Input
                    value={form.pan}
                    onChange={(e) => update("pan", e.target.value.toUpperCase().slice(0, 10))}
                    onBlur={handlePanBlur}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="uppercase"
                  />
                  {panValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {panValid ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Photo */}
              <div>
                <Label>Photo</Label>
                <div className="mt-1 flex gap-3 items-start">
                  {form.photo_url ? (
                    <img src={form.photo_url} alt="Customer" className="w-20 h-20 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center border border-border">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" className="gap-1.5" asChild>
                        <span>
                          <Upload className="h-3.5 w-3.5" />
                          {uploading ? "Uploading..." : "Upload"}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                        disabled={uploading}
                      />
                    </label>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={cameraActive ? capturePhoto : startCamera}>
                      <Camera className="h-3.5 w-3.5" />
                      {cameraActive ? "Capture" : "Camera"}
                    </Button>
                  </div>
                </div>
                {cameraActive && (
                  <div className="mt-2 relative">
                    <video ref={videoRef} className="w-full rounded-lg border border-border" autoPlay muted playsInline />
                    <canvas ref={canvasRef} className="hidden" />
                    <Button variant="ghost" size="sm" className="absolute top-1 right-1 text-xs" onClick={stopCamera}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <Separator />

          {/* 4. NOMINEE */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Nominee Details</h3>
            <div className="space-y-3">
              <div>
                <Label>Nominee Name</Label>
                <Input value={form.nominee_name} onChange={(e) => update("nominee_name", e.target.value)} placeholder="Nominee full name" />
              </div>
              <div>
                <Label>Relation</Label>
                <Select value={form.nominee_relation} onValueChange={(v) => update("nominee_relation", v)}>
                  <SelectTrigger><SelectValue placeholder="Select relation" /></SelectTrigger>
                  <SelectContent>
                    {RELATIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nominee Phone</Label>
                <Input
                  value={form.nominee_phone}
                  onChange={(e) => update("nominee_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Phone number"
                  maxLength={10}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* 5. CATEGORY & BRANCH */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Classification</h3>
            <div className="space-y-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => update("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="Corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Branch</Label>
                <Select value={form.branch_id} onValueChange={(v) => update("branch_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {isEdit && (
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => update("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Save button - sticky bottom */}
        <div className="sticky bottom-0 px-6 py-4 bg-card border-t border-border">
          <Button
            variant="gold"
            className="w-full"
            size="lg"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update Customer" : "Save Customer"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CustomerSheet;
