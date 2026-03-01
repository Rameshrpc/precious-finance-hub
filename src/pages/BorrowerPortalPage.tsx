import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate } from "@/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Landmark, IndianRupee, Calendar, Download, MessageSquare, LogOut } from "lucide-react";
import InterestCalculatorWidget from "@/components/InterestCalculatorWidget";

export default function BorrowerPortalPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"login" | "otp" | "dashboard">("login");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [grievance, setGrievance] = useState("");

  const handleSendOTP = async () => {
    // In production, send OTP via edge function
    const { data } = await supabase.from("customers").select("id, name").eq("phone", phone).single();
    if (data) {
      setCustomerId(data.id);
      setCustomerName(data.name);
      setStep("otp");
      toast.info("OTP sent to your phone (demo: use 123456)");
    } else {
      toast.error("Phone number not found. Please contact your branch.");
    }
  };

  const handleVerifyOTP = () => {
    // Demo OTP
    if (otp === "123456" || otp.length === 6) {
      setStep("dashboard");
    } else {
      toast.error("Invalid OTP");
    }
  };

  if (step === "login") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-display">Customer Portal</CardTitle>
            <p className="text-sm text-muted-foreground">Login with your registered phone number</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" type="tel" />
            <Button className="w-full" onClick={handleSendOTP} disabled={phone.length < 10}>Send OTP</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-display">Verify OTP</CardTitle>
            <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to {phone}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" maxLength={6} className="text-center text-lg tracking-widest" />
            <Button className="w-full" onClick={handleVerifyOTP} disabled={otp.length !== 6}>Verify & Login</Button>
            <Button variant="ghost" className="w-full text-xs" onClick={() => setStep("login")}>Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <PortalDashboard customerId={customerId!} customerName={customerName} onLogout={() => { setStep("login"); setPhone(""); setOtp(""); }} />;
}

function PortalDashboard({ customerId, customerName, onLogout }: { customerId: string; customerName: string; onLogout: () => void }) {
  const [grievance, setGrievance] = useState("");

  const { data: loans } = useQuery({
    queryKey: ["portal-loans", customerId],
    queryFn: async () => {
      const { data } = await supabase.from("loans").select("*").eq("customer_id", customerId).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["portal-payments", customerId],
    queryFn: async () => {
      const { data } = await supabase.from("interest_records").select("*, loans(loan_number)")
        .eq("status", "paid").in("loan_id", (loans || []).map((l: any) => l.id))
        .order("payment_date", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!(loans && loans.length > 0),
  });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-display font-bold">Hello, {customerName} 👋</h1>
          <p className="text-xs text-muted-foreground">Customer Portal</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout}><LogOut className="h-4 w-4 mr-1" /> Logout</Button>
      </header>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Loan Cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {(loans || []).map((l: any) => (
            <Card key={l.id}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm font-medium">{l.loan_number}</span>
                  <Badge variant={l.status === "active" ? "default" : "secondary"} className="text-[10px]">{l.status}</Badge>
                </div>
                <Badge variant="outline" className="text-[10px]">{l.product_type}</Badge>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Principal</span><p className="font-medium">{formatINR(l.amount)}</p></div>
                  <div><span className="text-muted-foreground">Rate</span><p className="font-medium">{l.rate}%</p></div>
                  <div><span className="text-muted-foreground">Maturity</span><p className="font-medium">{l.maturity_date ? formatDate(l.maturity_date) : "N/A"}</p></div>
                  <div><span className="text-muted-foreground">Status</span><p className="font-medium capitalize">{l.status}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(loans || []).length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No loans found</CardContent></Card>}
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><IndianRupee className="h-4 w-4" /> Payment History</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Loan</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Receipt</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(payments || []).map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.loans?.loan_number}</TableCell>
                    <TableCell className="text-xs">{formatINR(p.paid)}</TableCell>
                    <TableCell className="text-xs">{p.payment_date ? formatDate(p.payment_date) : ""}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" className="h-6 text-[10px]"><Download className="h-3 w-3 mr-1" /> PDF</Button></TableCell>
                  </TableRow>
                ))}
                {(payments || []).length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-xs">No payments yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Grievance */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Raise Grievance</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Textarea value={grievance} onChange={(e) => setGrievance(e.target.value)} placeholder="Describe your issue..." rows={3} />
            <Button size="sm" disabled={!grievance.trim()} onClick={() => { toast.success("Grievance submitted"); setGrievance(""); }}>Submit</Button>
          </CardContent>
        </Card>

        {/* Calculator */}
        <InterestCalculatorWidget />
      </div>
    </div>
  );
}
