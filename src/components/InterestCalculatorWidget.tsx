import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR } from "@/lib/formatters";

const PURITIES = [
  { label: "24K (99.9%)", value: 99.9 },
  { label: "22K (91.6%)", value: 91.6 },
  { label: "18K (75%)", value: 75 },
  { label: "14K (58.3%)", value: 58.3 },
];

export default function InterestCalculatorWidget() {
  const [weight, setWeight] = useState("");
  const [purity, setPurity] = useState("91.6");
  const [loanAmount, setLoanAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const goldRate = 6842; // per gram 22K - would come from market_rates
  const ltv = 75;
  const interestRate = 1.5; // monthly %

  const netWeight = Number(weight) * (Number(purity) / 100);
  const goldValue = netWeight * goldRate;
  const maxEligible = Math.round(goldValue * ltv / 100);
  const requestedAmount = Math.min(Number(loanAmount) || 0, maxEligible);
  const monthlyCharge = Math.round(requestedAmount * interestRate / 100);
  const totalRepayable12 = requestedAmount + (monthlyCharge * 12);

  return (
    <Card className="max-w-md mx-auto shadow-lg border-2">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg font-display">Gold Loan Calculator</CardTitle>
        <p className="text-xs text-muted-foreground">Estimate your loan eligibility instantly</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium">Gold Weight (grams)</label>
          <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 50" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Purity</label>
          <Select value={purity} onValueChange={setPurity}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PURITIES.map((p) => <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Loan Amount Needed</label>
          <Input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} placeholder="e.g. 200000" />
        </div>

        {Number(weight) > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Gold Value</span>
              <span className="font-medium">{formatINR(goldValue)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Max Eligible ({ltv}% LTV)</span>
              <span className="font-bold text-primary">{formatINR(maxEligible)}</span>
            </div>
            {requestedAmount > 0 && (
              <>
                <div className="border-t my-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Monthly Charge ({interestRate}%)</span>
                  <span className="font-medium">{formatINR(monthlyCharge)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Repayable (12mo)</span>
                  <span className="font-bold">{formatINR(totalRepayable12)}</span>
                </div>
              </>
            )}
          </div>
        )}

        {!submitted ? (
          <div className="space-y-2">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number" />
            <Button className="w-full" disabled={!phone || !weight} onClick={() => setSubmitted(true)}>
              Get Quote
            </Button>
          </div>
        ) : (
          <div className="text-center py-2">
            <Badge variant="default" className="text-sm px-4 py-1">✓ Quote request submitted!</Badge>
            <p className="text-xs text-muted-foreground mt-2">Our team will contact you shortly.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
