import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageSquare } from "lucide-react";

const triggers = [
  { key: "maturity_alert", label: "Maturity Alert", desc: "7 days before maturity", channel: "whatsapp" },
  { key: "overdue_notice", label: "Overdue Notice", desc: "DPD = 1", channel: "whatsapp" },
  { key: "payment_receipt", label: "Payment Receipt", desc: "After interest collection", channel: "whatsapp" },
  { key: "ptp_broken", label: "PTP Broken", desc: "Promise-to-pay date passed", channel: "sms" },
  { key: "loan_disbursed", label: "Loan Disbursement", desc: "After new loan created", channel: "whatsapp" },
  { key: "closure_confirm", label: "Closure Confirmation", desc: "After loan closure", channel: "whatsapp" },
  { key: "npa_notice", label: "NPA Notice", desc: "DPD > 90 classification", channel: "sms" },
  { key: "auction_notice", label: "Auction Notice", desc: "30 days before auction", channel: "whatsapp" },
];

const NotificationsTab = () => {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(triggers.map((t) => [t.key, true]))
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notification Triggers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {triggers.map((t) => (
              <div key={t.key} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px]">{t.channel}</Badge>
                  <Switch checked={enabled[t.key]} onCheckedChange={() => setEnabled((p) => ({ ...p, [t.key]: !p[t.key] }))} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;
