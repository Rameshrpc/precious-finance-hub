import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Package, Gem, FileText, MapPin, UserCheck, Building2, TrendingUp } from "lucide-react";
import ItemGroupsTab from "@/components/masters/ItemGroupsTab";
import ItemsTab from "@/components/masters/ItemsTab";
import PuritiesTab from "@/components/masters/PuritiesTab";
import LoanSchemesTab from "@/components/masters/LoanSchemesTab";
import AreasTab from "@/components/masters/AreasTab";
import AgentsTab from "@/components/masters/AgentsTab";
import BankPartnersTab from "@/components/masters/BankPartnersTab";
import MarketRatesTab from "@/components/masters/MarketRatesTab";

const tabs = [
  { value: "item-groups", label: "Item Groups", icon: Layers },
  { value: "items", label: "Items", icon: Package },
  { value: "purities", label: "Purities", icon: Gem },
  { value: "loan-schemes", label: "Loan Schemes", icon: FileText },
  { value: "areas", label: "Areas", icon: MapPin },
  { value: "agents", label: "Agents", icon: UserCheck },
  { value: "bank-nbfc", label: "Bank/NBFC", icon: Building2 },
  { value: "market-rates", label: "Market Rates", icon: TrendingUp },
];

export default function MastersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Masters</h1>
      <Tabs defaultValue="item-groups" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 bg-muted">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-1.5 whitespace-nowrap text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm">
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="item-groups"><ItemGroupsTab /></TabsContent>
        <TabsContent value="items"><ItemsTab /></TabsContent>
        <TabsContent value="purities"><PuritiesTab /></TabsContent>
        <TabsContent value="loan-schemes"><LoanSchemesTab /></TabsContent>
        <TabsContent value="areas"><AreasTab /></TabsContent>
        <TabsContent value="agents"><AgentsTab /></TabsContent>
        <TabsContent value="bank-nbfc"><BankPartnersTab /></TabsContent>
        <TabsContent value="market-rates"><MarketRatesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
