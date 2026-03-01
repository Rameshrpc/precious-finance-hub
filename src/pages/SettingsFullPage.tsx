import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, GitBranch, Package, FileText, Bell, Upload, ShieldCheck } from "lucide-react";
import CompanyTab from "@/components/settings/CompanyTab";
import UsersRolesTab from "@/components/settings/UsersRolesTab";
import BranchesTab from "@/components/settings/BranchesTab";
import ProductsTab from "@/components/settings/ProductsTab";
import PrintTemplatesTab from "@/components/settings/PrintTemplatesTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import ImportExportTab from "@/components/settings/ImportExportTab";
import ApprovalWorkflowsTab from "@/components/settings/ApprovalWorkflowsTab";

const tabs = [
  { value: "company", label: "Company", icon: Building2 },
  { value: "users", label: "Users & Roles", icon: Users },
  { value: "branches", label: "Branches", icon: GitBranch },
  { value: "products", label: "Products", icon: Package },
  { value: "templates", label: "Print Templates", icon: FileText },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "import-export", label: "Import / Export", icon: Upload },
  { value: "approvals", label: "Approval Workflows", icon: ShieldCheck },
];

const SettingsFullPage = () => {
  const [activeTab, setActiveTab] = useState("company");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="flex items-center gap-1.5 text-xs">
              <t.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="company"><CompanyTab /></TabsContent>
        <TabsContent value="users"><UsersRolesTab /></TabsContent>
        <TabsContent value="branches"><BranchesTab /></TabsContent>
        <TabsContent value="products"><ProductsTab /></TabsContent>
        <TabsContent value="templates"><PrintTemplatesTab /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab /></TabsContent>
        <TabsContent value="import-export"><ImportExportTab /></TabsContent>
        <TabsContent value="approvals"><ApprovalWorkflowsTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsFullPage;
