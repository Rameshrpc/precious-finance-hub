import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles } from "lucide-react";

const APP_VERSION = "1.12.0";
const STORAGE_KEY = "cofizen_last_seen_version";

const changelog = [
  {
    version: "1.12.0",
    date: "2026-03-01",
    items: [
      { type: "feature", text: "Test Checklist page for QA validation" },
      { type: "feature", text: "Help Center with searchable knowledge base & FAQs" },
      { type: "feature", text: "What's New changelog modal" },
      { type: "feature", text: "Contextual help on every page" },
    ],
  },
  {
    version: "1.11.0",
    date: "2026-02-28",
    items: [
      { type: "feature", text: "Settings page with 8 tabs (Company, Users, Branches, Products, Templates, Notifications, Import/Export, Approvals)" },
      { type: "feature", text: "Super Admin panel with tenant management & impersonation" },
      { type: "feature", text: "Onboarding wizard (7-step tenant setup)" },
    ],
  },
  {
    version: "1.10.0",
    date: "2026-02-25",
    items: [
      { type: "feature", text: "Data masking for Aadhaar & PAN with audit logging" },
      { type: "feature", text: "Global search (Cmd+K) command palette" },
      { type: "feature", text: "Keyboard shortcuts (? to view)" },
      { type: "feature", text: "Session timeout warning (15min inactivity)" },
      { type: "feature", text: "Grievance management with SLA tracking" },
      { type: "feature", text: "Cash management daily register" },
      { type: "feature", text: "REST API with API key authentication" },
    ],
  },
  {
    version: "1.9.0",
    date: "2026-02-22",
    items: [
      { type: "feature", text: "Product-aware dashboard with KPI cards & charts" },
      { type: "feature", text: "WhatsApp inbox (two-panel chat interface)" },
      { type: "feature", text: "WAHA integration backend (session & webhook)" },
      { type: "feature", text: "Borrower portal with OTP login" },
      { type: "feature", text: "Interest calculator widget with lead capture" },
      { type: "feature", text: "Notification center (bell icon)" },
    ],
  },
  {
    version: "1.8.0",
    date: "2026-02-19",
    items: [
      { type: "feature", text: "NPA classification engine (SMA → Sub → Doubtful → Loss)" },
      { type: "feature", text: "DPD tracker & collection queue" },
      { type: "feature", text: "Telecaller dashboard with dispositions" },
      { type: "feature", text: "Auction & forfeiture management" },
      { type: "feature", text: "Balance transfer module" },
    ],
  },
  {
    version: "1.7.0",
    date: "2026-02-15",
    items: [
      { type: "feature", text: "Full double-entry accounting system" },
      { type: "feature", text: "Chart of Accounts, Trial Balance, P&L, Balance Sheet" },
      { type: "feature", text: "Auto-posting on all transaction types" },
      { type: "feature", text: "Manual voucher entry" },
    ],
  },
  {
    version: "1.6.0",
    date: "2026-02-10",
    items: [
      { type: "feature", text: "Vault management (packets, slots, repledge)" },
      { type: "feature", text: "Approval engine (maker-checker)" },
      { type: "feature", text: "Re-loan, margin renewal, partial release" },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-02-05",
    items: [
      { type: "feature", text: "Multi-product support (GL, PO, SA)" },
      { type: "feature", text: "LOS Pipeline (Apply → Disburse)" },
      { type: "feature", text: "Transaction lifecycle management" },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-02-01",
    items: [
      { type: "feature", text: "Customer management with Verhoeff Aadhaar validation" },
      { type: "feature", text: "Masters (items, purities, schemes, market rates)" },
      { type: "feature", text: "Multi-tenant architecture with RLS" },
      { type: "feature", text: "Role-based access control (5 roles)" },
    ],
  },
];

const WhatsNewDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem(STORAGE_KEY);
    if (lastSeen !== APP_VERSION) {
      setOpen(true);
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
    }
  }, []);

  const badgeColor = (type: string) => {
    switch (type) {
      case "feature": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "fix": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "improvement": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            What's New in CofiZen
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {changelog.map((release) => (
              <div key={release.version}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    v{release.version}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{release.date}</span>
                </div>
                <ul className="space-y-1.5">
                  {release.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge className={`text-[10px] px-1.5 py-0 h-4 shrink-0 mt-0.5 ${badgeColor(item.type)}`}>
                        {item.type}
                      </Badge>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsNewDialog;
