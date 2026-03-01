const PlaceholderPage = ({ title, description }: { title: string; description?: string }) => (
  <div className="animate-fade-in">
    <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
    <p className="text-muted-foreground mt-1">{description || "This module is coming soon."}</p>
    <div className="mt-8 rounded-xl border-2 border-dashed border-border p-16 text-center">
      <p className="text-sm text-muted-foreground">Content area for {title}</p>
    </div>
  </div>
);

export const TransactionsPipelinePage = () => <PlaceholderPage title="LOS Pipeline" description="Loan origination pipeline view" />;
export const SettingsPage = () => <PlaceholderPage title="Settings" description="Application and tenant configuration" />;
