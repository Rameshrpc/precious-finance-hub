import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  BookOpen,
  HelpCircle,
  Sparkles,
  ArrowRight,
  FileText,
  Shield,
  MessageSquare,
  Settings,
  BarChart3,
  Users,
  Receipt,
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  section: string;
  icon: React.ElementType;
  content: string;
}

const articles: Article[] = [
  {
    id: "getting-started",
    title: "Getting Started with CofiZen",
    section: "Getting Started",
    icon: Sparkles,
    content: `## Welcome to CofiZen\n\nCofiZen is a comprehensive gold loan management platform supporting Gold Loans (GL), Purchase Orders (PO), and Sale Agreements (SA).\n\n### First Steps\n1. **Login** with your credentials at the login page\n2. Navigate to **Dashboard** to see your KPIs\n3. Go to **Settings** to configure your company, branches, and products\n4. Create your first **Customer** under the Customers tab\n5. Create your first **Transaction** under Transactions → New\n\n### Key Concepts\n- **Tenant**: Your company/organization in the multi-tenant system\n- **Branch**: Physical location where transactions happen\n- **Scheme**: Loan product configuration (rate, tenure, LTV caps)\n- **Pledge Items**: Gold/silver items pledged against a loan`,
  },
  {
    id: "gl-workflow",
    title: "Gold Loan (GL) Workflow",
    section: "Product Guides",
    icon: Receipt,
    content: `## Gold Loan Lifecycle\n\n### 1. Create Transaction\n- Select customer → Choose GL product → Add pledge items\n- System calculates LTV based on market rates and purity\n\n### 2. Disbursement\n- Choose mode: Cash / Bank Transfer / UPI\n- Accounting entries auto-post (Dr: Loan A/c, Cr: Cash/Bank)\n\n### 3. Interest Collection\n- Monthly/periodic interest collection\n- Receipt generated automatically\n- Late payment penalty applies after grace period\n\n### 4. Redemption (Closure)\n- Customer pays outstanding principal + charges\n- Pledge items released from vault\n- Closure certificate generated`,
  },
  {
    id: "po-workflow",
    title: "Purchase Order (PO) Workflow",
    section: "Product Guides",
    icon: Receipt,
    content: `## Purchase Order Lifecycle\n\n### 1. Purchase\n- Buy gold/silver from customer at market rate\n- Items stored in vault\n\n### 2. Storage Charges\n- Periodic storage fee collection\n\n### 3. Buyback\n- Customer repurchases items\n- Or items forfeited after expiry\n\n### 4. Forfeiture & Sale\n- If customer doesn't buyback, items can be sold\n- Profit/loss recorded`,
  },
  {
    id: "sa-workflow",
    title: "Sale Agreement (SA) Workflow",
    section: "Product Guides",
    icon: Receipt,
    content: `## Sale Agreement Lifecycle\n\n### 1. Agreement\n- Customer sells gold with agreement to repurchase\n- Margin amount collected upfront\n\n### 2. Holding Charges\n- Periodic holding fee collection\n\n### 3. Repurchase\n- Customer buys back within agreed period\n\n### 4. Margin Renewal\n- Extend agreement with additional margin payment`,
  },
  {
    id: "accounting",
    title: "Accounting Guide",
    section: "Accounting",
    icon: BarChart3,
    content: `## Accounting in CofiZen\n\n### Auto-Posting\nAll transactions automatically create double-entry journal vouchers.\n\n### Chart of Accounts\nPre-seeded per product type. Custom accounts can be added.\n\n### Reports\n- **Trial Balance**: Verify Dr = Cr\n- **P&L**: Income and expenses by product\n- **Balance Sheet**: Assets = Liabilities + Equity\n- **Day Book**: All entries for a given date\n- **Ledger**: Running balance per account`,
  },
  {
    id: "admin-guide",
    title: "Admin & Settings Guide",
    section: "Administration",
    icon: Settings,
    content: `## Administration\n\n### User Management\n- Invite users via email\n- Assign roles: Staff, Manager, Appraiser, Tenant Admin, Super Admin\n\n### Branches\n- Create branches with address and cash limits\n- Assign users and customers to branches\n\n### Products\n- Toggle GL/PO/SA products on/off\n- Auto-seeds schemes and accounts on enable\n\n### Approval Workflows\n- Configure amount thresholds for maker-checker\n- Route approvals to specific roles`,
  },
  {
    id: "whatsapp-setup",
    title: "WhatsApp Setup Guide",
    section: "Communications",
    icon: MessageSquare,
    content: `## WhatsApp Integration\n\n### Prerequisites\n- WAHA instance running and accessible\n- WAHA_API_URL configured in secrets\n\n### Setup Steps\n1. Go to **Settings → Notifications**\n2. Click **Connect WhatsApp Number**\n3. Scan QR code with WhatsApp\n4. Status should show green (connected)\n\n### Features\n- Inbox for conversations\n- Template messages with variables\n- Automated bot responses (status, balance)\n- Payment reminders and receipts`,
  },
  {
    id: "security",
    title: "Security Best Practices",
    section: "Administration",
    icon: Shield,
    content: `## Security\n\n### Row-Level Security (RLS)\nAll data is tenant-isolated. Users can only access their own tenant's data.\n\n### Data Masking\n- Aadhaar numbers masked by default (XXXX-XXXX-1234)\n- PAN masked (XXXXX1234X)\n- Reveal action logged to audit trail\n\n### 2FA\n- TOTP-based two-factor authentication\n- Mandatory for admin roles\n\n### Session Management\n- Auto-timeout after 15 minutes of inactivity\n- Session revocation available`,
  },
];

const faqs = [
  { q: "How do I create my first gold loan?", a: "Go to Transactions → New Transaction, select a customer, choose Gold Loan product, add pledge items, and submit." },
  { q: "How is LTV calculated?", a: "LTV = (Loan Amount ÷ Total Pledge Value) × 100. Separate caps apply for gold (typically 75%) and silver (typically 60%)." },
  { q: "Can I have multiple products enabled?", a: "Yes! Go to Settings → Products to enable Gold Loan, Purchase Order, and/or Sale Agreement." },
  { q: "How do I set up WhatsApp?", a: "Configure WAHA_API_URL secret, then go to Settings → Notifications → Connect WhatsApp Number and scan the QR code." },
  { q: "What happens when a loan is overdue?", a: "The daily cron job marks loans as overdue, applies penalty rates, and creates collection tasks automatically." },
  { q: "How do I handle partial release of pledged items?", a: "Open the transaction detail, click 'Partial Release', select items to release. Remaining items stay as collateral." },
  { q: "Can I import existing customer data?", a: "Yes, go to Settings → Import/Export and use the CSV/XLSX import wizard with column mapping." },
  { q: "How does the approval workflow work?", a: "Configure rules in Settings → Approval Workflows. Transactions above threshold amounts are routed for maker-checker approval." },
  { q: "What reports are available?", a: "Trial Balance, P&L, Balance Sheet, Day Book, Ledger, DPD Tracker, NPA Dashboard, Collection Reports, and more." },
  { q: "How do I add a new branch?", a: "Go to Settings → Branches and click Add Branch. Fill in name, address, phone, and cash limits." },
  { q: "What is the vault system?", a: "The vault tracks physical storage of pledged items using packets and slots. Packets group items, slots represent physical locations." },
  { q: "How does NPA classification work?", a: "Based on Days Past Due (DPD): SMA (1-30), Sub-Standard (31-90), Doubtful (91-365), Loss (365+)." },
  { q: "Can customers access their loan details?", a: "Yes, via the Borrower Portal at /customer-portal. Customers log in with phone OTP." },
  { q: "How do I handle a re-loan?", a: "From an existing loan detail page, click 'Re-Loan'. The old loan is closed and a new one created with the same collateral." },
  { q: "What is the interest calculator widget?", a: "An embeddable component that calculates eligible loan amount based on gold weight and purity. Can capture leads." },
  { q: "How do I revoke an API key?", a: "Go to Settings → API Keys, find the key, and click the deactivate/delete button." },
  { q: "What roles are available?", a: "Staff, Manager, Appraiser, Tenant Admin, and Super Admin. Each has different access levels." },
  { q: "How does the grievance system work?", a: "Create tickets with category and priority. SLA tracking ensures 24h acknowledgment and 7d resolution. Escalation levels L1-L3." },
  { q: "Can I customize print templates?", a: "Yes, go to Settings → Print Templates. Edit templates with merge fields like {customerName}, {loanNo}, {amount}." },
  { q: "How do I run the daily cron manually?", a: "Go to Settings → Cron Status and click 'Run Now'. This triggers interest accrual, overdue marking, and notifications." },
];

const sections = [...new Set(articles.map((a) => a.section))];

const HelpCenterPage = () => {
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filtered = search
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.content.toLowerCase().includes(search.toLowerCase())
      )
    : articles;

  const filteredFaqs = search
    ? faqs.filter(
        (f) =>
          f.q.toLowerCase().includes(search.toLowerCase()) ||
          f.a.toLowerCase().includes(search.toLowerCase())
      )
    : faqs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Help Center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Guides, FAQs, and documentation for CofiZen
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search help articles and FAQs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Knowledge Base */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Knowledge Base</h2>
        {sections.map((section) => {
          const sectionArticles = filtered.filter((a) => a.section === section);
          if (sectionArticles.length === 0) return null;
          return (
            <div key={section} className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{section}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sectionArticles.map((article) => (
                  <Sheet key={article.id}>
                    <SheetTrigger asChild>
                      <Card
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <CardContent className="p-4 flex items-start gap-3">
                          <article.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{article.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {article.content.substring(0, 100)}...
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        </CardContent>
                      </Card>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-lg overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <article.icon className="h-5 w-5 text-primary" />
                          {article.title}
                        </SheetTitle>
                      </SheetHeader>
                      <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
                        {article.content.split("\n").map((line, i) => {
                          if (line.startsWith("## "))
                            return (
                              <h2 key={i} className="text-lg font-bold mt-4 mb-2">
                                {line.replace("## ", "")}
                              </h2>
                            );
                          if (line.startsWith("### "))
                            return (
                              <h3 key={i} className="text-base font-semibold mt-3 mb-1">
                                {line.replace("### ", "")}
                              </h3>
                            );
                          if (line.startsWith("- "))
                            return (
                              <li key={i} className="text-sm ml-4">
                                {line.replace("- ", "")}
                              </li>
                            );
                          if (line.match(/^\d+\./))
                            return (
                              <li key={i} className="text-sm ml-4 list-decimal">
                                {line.replace(/^\d+\.\s*/, "")}
                              </li>
                            );
                          if (line.trim() === "") return <br key={i} />;
                          return (
                            <p key={i} className="text-sm text-muted-foreground">
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    </SheetContent>
                  </Sheet>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* FAQ */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Frequently Asked Questions
        </h2>
        <Accordion type="multiple" className="space-y-1">
          {filteredFaqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium text-left">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default HelpCenterPage;
