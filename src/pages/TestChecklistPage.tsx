import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ClipboardCheck, Search } from "lucide-react";

interface CheckItem {
  id: string;
  label: string;
}

interface CheckCategory {
  name: string;
  color: string;
  items: CheckItem[];
}

const categories: CheckCategory[] = [
  {
    name: "Authentication & Security",
    color: "text-red-500",
    items: [
      { id: "auth-login", label: "Login with email/password" },
      { id: "auth-otp", label: "Phone OTP login (Borrower Portal)" },
      { id: "auth-forgot", label: "Forgot Password flow" },
      { id: "auth-roles-staff", label: "Role guard: Staff access correct pages" },
      { id: "auth-roles-manager", label: "Role guard: Manager access correct pages" },
      { id: "auth-roles-admin", label: "Role guard: Tenant Admin full access" },
      { id: "auth-roles-super", label: "Role guard: Super Admin cross-tenant" },
      { id: "auth-roles-appraiser", label: "Role guard: Appraiser limited access" },
      { id: "auth-unauth", label: "Unauthorized page renders for blocked routes" },
      { id: "auth-2fa", label: "2FA TOTP setup & verify" },
      { id: "auth-session-timeout", label: "Session timeout warning at 15min" },
      { id: "auth-cross-tenant", label: "Cross-tenant isolation (RLS)" },
      { id: "auth-masking", label: "Aadhaar masking shows XXXX-XXXX-1234" },
      { id: "auth-reveal-audit", label: "Reveal logs action to audit_logs" },
    ],
  },
  {
    name: "Customer Management",
    color: "text-blue-500",
    items: [
      { id: "cust-create", label: "Create customer with all fields" },
      { id: "cust-aadhaar-pass", label: "Verhoeff Aadhaar validation - valid number passes" },
      { id: "cust-aadhaar-fail", label: "Verhoeff Aadhaar validation - invalid number fails" },
      { id: "cust-pan", label: "PAN format validation (ABCDE1234F)" },
      { id: "cust-photo", label: "Photo upload to storage bucket" },
      { id: "cust-quickcard", label: "Customer quick card hover preview" },
      { id: "cust-search", label: "Global search finds customers" },
      { id: "cust-edit", label: "Edit customer details" },
    ],
  },
  {
    name: "Gold Loan (GL) Lifecycle",
    color: "text-yellow-500",
    items: [
      { id: "gl-new", label: "Create new GL transaction" },
      { id: "gl-pledge", label: "Add gold pledge items with purity & weight" },
      { id: "gl-ltv", label: "LTV calculation correct (gold_value × cap)" },
      { id: "gl-disburse", label: "Disbursement posts accounting entries" },
      { id: "gl-interest", label: "Collect monthly interest" },
      { id: "gl-receipt", label: "Interest receipt generated" },
      { id: "gl-redeem", label: "Full redemption (closure)" },
      { id: "gl-closure-accounting", label: "Closure posts all accounting (principal + charges)" },
      { id: "gl-partial", label: "Partial release of pledge items" },
      { id: "gl-reloan", label: "Re-loan from existing GL" },
    ],
  },
  {
    name: "Purchase Order (PO) Lifecycle",
    color: "text-green-500",
    items: [
      { id: "po-new", label: "Create new PO purchase transaction" },
      { id: "po-storage", label: "Storage charge collection" },
      { id: "po-buyback", label: "Buyback / customer repurchase" },
      { id: "po-closed", label: "PO closure with accounting posts" },
      { id: "po-forfeiture", label: "PO forfeiture after expiry" },
    ],
  },
  {
    name: "Sale Agreement (SA) Lifecycle",
    color: "text-purple-500",
    items: [
      { id: "sa-new", label: "Create new SA agreement" },
      { id: "sa-holding", label: "Holding charge collection" },
      { id: "sa-repurchase", label: "Repurchase (customer buys back)" },
      { id: "sa-closed", label: "SA closure with accounting posts" },
      { id: "sa-margin", label: "Margin renewal on SA" },
    ],
  },
  {
    name: "Mixed / Cross-cutting Transactions",
    color: "text-orange-500",
    items: [
      { id: "mix-goldsilver", label: "Gold + Silver in same transaction, weighted LTV correct" },
      { id: "mix-los", label: "LOS Pipeline: Applied → Docs → Valued → Approved → Disbursed" },
      { id: "mix-approval", label: "Maker-checker routes by amount threshold" },
      { id: "mix-bulk-collect", label: "Bulk collection processes multiple loans" },
    ],
  },
  {
    name: "Accounting & Reports",
    color: "text-cyan-500",
    items: [
      { id: "acc-tb", label: "Trial Balance balances (Total Dr = Total Cr)" },
      { id: "acc-pnl", label: "P&L shows per-product income breakdown" },
      { id: "acc-bs", label: "Balance Sheet balances (Assets = Liabilities + Equity)" },
      { id: "acc-autopost", label: "Auto-post on all transaction types (GL/PO/SA)" },
      { id: "acc-voucher", label: "Manual voucher creates correct journal entries" },
      { id: "acc-daybook", label: "Day book shows all transactions for date" },
      { id: "acc-ledger", label: "Ledger shows running balance per account" },
      { id: "acc-coa", label: "Chart of Accounts tree renders correctly" },
    ],
  },
  {
    name: "Vault & NPA",
    color: "text-amber-500",
    items: [
      { id: "vault-packet", label: "Packet creation with loan linkage" },
      { id: "vault-slot", label: "Slot assignment & occupancy tracking" },
      { id: "vault-repledge", label: "Repledge blocks item release" },
      { id: "vault-audit", label: "Vault audit trail" },
      { id: "npa-classify", label: "NPA classification runs correctly (SMA/Sub/Doubtful/Loss)" },
      { id: "npa-dpd", label: "DPD tracker shows correct days past due" },
      { id: "npa-collection", label: "Collection queue auto-assigns tasks" },
      { id: "npa-telecaller", label: "Telecaller dashboard with dispositions" },
    ],
  },
  {
    name: "WhatsApp & Communications",
    color: "text-emerald-500",
    items: [
      { id: "wa-inbox", label: "WhatsApp inbox receives messages" },
      { id: "wa-send", label: "Send outbound message" },
      { id: "wa-template", label: "Template send with variable substitution" },
      { id: "wa-bot-status", label: "Chatbot handles 'status' query" },
      { id: "wa-bot-balance", label: "Chatbot handles 'balance' query" },
      { id: "wa-session", label: "WAHA session connect via QR" },
    ],
  },
  {
    name: "Settings & Admin",
    color: "text-pink-500",
    items: [
      { id: "set-company", label: "Company settings save" },
      { id: "set-users", label: "User invite & role assignment" },
      { id: "set-branches", label: "Branch CRUD" },
      { id: "set-products", label: "Product toggle (GL/PO/SA)" },
      { id: "set-templates", label: "Print template editor with merge fields" },
      { id: "set-approval", label: "Approval workflow rules" },
      { id: "set-import", label: "CSV/XLSX import wizard" },
      { id: "admin-tenants", label: "Super Admin tenant list" },
      { id: "admin-impersonate", label: "Login-as-tenant impersonation" },
      { id: "admin-onboard", label: "Onboarding wizard 7 steps" },
    ],
  },
  {
    name: "Borrower Portal & Misc",
    color: "text-indigo-500",
    items: [
      { id: "portal-login", label: "Borrower portal phone OTP login" },
      { id: "portal-loans", label: "Loan cards display correctly" },
      { id: "portal-payment", label: "Payment history table" },
      { id: "portal-grievance", label: "Raise grievance from portal" },
      { id: "calc-widget", label: "Interest calculator returns correct values" },
      { id: "calc-lead", label: "'Get Quote' captures lead" },
      { id: "notif-bell", label: "Notification center bell icon + dropdown" },
      { id: "notif-navigate", label: "Click notification navigates to entity" },
      { id: "cash-register", label: "Cash management daily register" },
      { id: "cash-discrepancy", label: "Cash discrepancy alert (red if mismatch)" },
      { id: "grievance-sla", label: "Grievance SLA tracking (24h ack / 7d resolve)" },
      { id: "api-keys", label: "API key creation & REST API responds" },
    ],
  },
];

const TestChecklistPage = () => {
  const [checked, setChecked] = useState<Record<string, "pass" | "fail" | null>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);
  const passedItems = Object.values(checked).filter((v) => v === "pass").length;
  const failedItems = Object.values(checked).filter((v) => v === "fail").length;
  const progress = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

  const toggle = (id: string) => {
    setChecked((prev) => {
      const current = prev[id];
      if (!current) return { ...prev, [id]: "pass" };
      if (current === "pass") return { ...prev, [id]: "fail" };
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const filteredCategories = search
    ? categories
        .map((c) => ({
          ...c,
          items: c.items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase())),
        }))
        .filter((c) => c.items.length > 0)
    : categories;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Test Checklist
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive QA checklist — click once for ✅ pass, twice for ❌ fail, thrice to reset
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-green-600 border-green-300">✅ {passedItems}</Badge>
          <Badge variant="outline" className="text-red-600 border-red-300">❌ {failedItems}</Badge>
          <Badge variant="outline">{totalItems - passedItems - failedItems} remaining</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={progress} className="h-3" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground w-12 text-right">{progress}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search test items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4">
        {filteredCategories.map((cat) => {
          const catPassed = cat.items.filter((i) => checked[i.id] === "pass").length;
          const catTotal = cat.items.length;
          return (
            <Card key={cat.name}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-base ${cat.color}`}>{cat.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {catPassed}/{catTotal}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {cat.items.map((item) => {
                  const status = checked[item.id];
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                        status === "pass"
                          ? "bg-green-50 dark:bg-green-950/20"
                          : status === "fail"
                          ? "bg-red-50 dark:bg-red-950/20"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <button
                        onClick={() => toggle(item.id)}
                        className="flex items-center justify-center h-5 w-5 rounded border text-xs font-bold shrink-0"
                        style={{
                          borderColor: status === "pass" ? "#22c55e" : status === "fail" ? "#ef4444" : undefined,
                          backgroundColor: status === "pass" ? "#22c55e" : status === "fail" ? "#ef4444" : undefined,
                          color: status ? "#fff" : undefined,
                        }}
                      >
                        {status === "pass" ? "✓" : status === "fail" ? "✗" : ""}
                      </button>
                      <span
                        className={`text-sm flex-1 ${
                          status === "pass" ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {item.label}
                      </span>
                      <Input
                        placeholder="Notes..."
                        value={notes[item.id] || ""}
                        onChange={(e) => setNotes((p) => ({ ...p, [item.id]: e.target.value }))}
                        className="h-7 text-xs w-48"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TestChecklistPage;
