const PlaceholderPage = ({ title, description }: { title: string; description?: string }) => (
  <div className="animate-fade-in">
    <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
    <p className="text-muted-foreground mt-1">{description || "This module is coming soon."}</p>
    <div className="mt-8 rounded-xl border-2 border-dashed border-border p-16 text-center">
      <p className="text-sm text-muted-foreground">Content area for {title}</p>
    </div>
  </div>
);

export const TransactionsNewPage = () => <PlaceholderPage title="New Transaction" description="Create a new gold loan, purchase or sale" />;
export const TransactionsListPage = () => <PlaceholderPage title="All Transactions" description="View and filter all transactions" />;
export const TransactionsPipelinePage = () => <PlaceholderPage title="LOS Pipeline" description="Loan origination pipeline view" />;
export const VaultPage = () => <PlaceholderPage title="Gold Vault" description="Physical gold and silver inventory management" />;
export const VouchersPage = () => <PlaceholderPage title="Vouchers" description="Create and manage accounting vouchers" />;
export const DayBookPage = () => <PlaceholderPage title="Day Book" description="Daily transaction journal" />;
export const LedgerPage = () => <PlaceholderPage title="Ledger" description="Account-wise ledger view" />;
export const TrialBalancePage = () => <PlaceholderPage title="Trial Balance" description="Periodic trial balance report" />;
export const WhatsAppInboxPage = () => <PlaceholderPage title="WhatsApp Inbox" description="Customer communication via WhatsApp" />;
export const TemplatesPage = () => <PlaceholderPage title="Templates" description="Message and document templates" />;
export const SettingsPage = () => <PlaceholderPage title="Settings" description="Application and tenant configuration" />;
