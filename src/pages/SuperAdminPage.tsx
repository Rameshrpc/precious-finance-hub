import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatINR } from "@/lib/indian-locale";
import { formatCompact } from "@/lib/formatters";
import {
  Building2, Users, BarChart3, LogIn, Search, Gem, Package, Coins,
  CheckCircle2, ArrowRight, Crown, TrendingUp,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock growth data
const growthData = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  tenants: 10 + i * 3 + Math.floor(Math.random() * 5),
  mrr: 50000 + i * 15000 + Math.floor(Math.random() * 10000),
}));

const SuperAdminPage = () => {
  const [activeTab, setActiveTab] = useState("tenants");
  const [searchQ, setSearchQ] = useState("");
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(0);

  const { data: tenants = [] } = useQuery({
    queryKey: ["all_tenants"],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = tenants.filter((t: any) => t.name.toLowerCase().includes(searchQ.toLowerCase()));

  const wizardSteps = [
    { label: "Company Details", icon: Building2 },
    { label: "Add Branches", icon: Building2 },
    { label: "Select Products", icon: Package },
    { label: "Configure Schemes", icon: Gem },
    { label: "Create Admin User", icon: Users },
    { label: "Seed Demo Data", icon: BarChart3 },
    { label: "Go-Live Checklist", icon: CheckCircle2 },
  ];

  return (
    <div className="p-6 space-y-6">
      {impersonating && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium">⚠️ Viewing as: <strong>{impersonating}</strong></span>
          <Button size="sm" variant="outline" onClick={() => { setImpersonating(null); toast.info("Returned to Super Admin"); }}>Exit Impersonation</Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Crown className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Super Admin Panel</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tenants" className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Tenants</TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-1.5"><ArrowRight className="h-3.5 w-3.5" /> Onboarding</TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
        </TabsList>

        {/* Tenant List */}
        <TabsContent value="tenants" className="space-y-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tenants..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="pl-9" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Plan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><Badge variant="outline">{t.plan}</Badge></TableCell>
                      <TableCell>{t.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => { setImpersonating(t.name); toast.success(`Now viewing as ${t.name}`); }}>
                          <LogIn className="h-3.5 w-3.5 mr-1" /> Login As
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No tenants found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onboarding Wizard */}
        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>New Tenant Onboarding</CardTitle>
              <CardDescription>Step-by-step setup for new tenants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Step {wizardStep + 1} of {wizardSteps.length}</span>
                  <span>{Math.round(((wizardStep + 1) / wizardSteps.length) * 100)}%</span>
                </div>
                <Progress value={((wizardStep + 1) / wizardSteps.length) * 100} />
              </div>

              {/* Step indicators */}
              <div className="flex gap-2 flex-wrap">
                {wizardSteps.map((s, i) => (
                  <button key={i} onClick={() => setWizardStep(i)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${i === wizardStep ? "bg-primary text-primary-foreground" : i < wizardStep ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {i < wizardStep ? <CheckCircle2 className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Step Content */}
              <Card className="bg-muted/20">
                <CardContent className="pt-6">
                  {wizardStep === 0 && (
                    <div className="space-y-4">
                      <div className="space-y-2"><Label>Company Name</Label><Input placeholder="Enter company name" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>GST Number</Label><Input placeholder="22AAAAA0000A1Z5" /></div>
                        <div className="space-y-2"><Label>Phone</Label><Input placeholder="+91 98765 43210" /></div>
                      </div>
                    </div>
                  )}
                  {wizardStep === 1 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Add your branch locations</p>
                      <div className="space-y-2"><Label>Branch Name</Label><Input placeholder="Main Branch" /></div>
                      <div className="space-y-2"><Label>Address</Label><Input placeholder="Branch address" /></div>
                      <Button variant="outline" size="sm">+ Add Another Branch</Button>
                    </div>
                  )}
                  {wizardStep === 2 && (
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { key: "GL", label: "Gold Loan", icon: Gem, color: "text-yellow-500" },
                        { key: "PO", label: "Purchase Order", icon: Package, color: "text-blue-500" },
                        { key: "SA", label: "Savings Account", icon: Coins, color: "text-emerald-500" },
                      ].map((p) => (
                        <Card key={p.key} className="cursor-pointer hover:border-primary/50 transition-colors">
                          <CardContent className="pt-6 text-center">
                            <p.icon className={`h-8 w-8 mx-auto ${p.color}`} />
                            <p className="mt-2 font-medium">{p.label}</p>
                            <Switch className="mt-2" defaultChecked={p.key === "GL"} />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  {wizardStep === 3 && <p className="text-sm text-muted-foreground">Configure loan schemes for selected products. Default schemes will be auto-created.</p>}
                  {wizardStep === 4 && (
                    <div className="space-y-4">
                      <div className="space-y-2"><Label>Admin Email</Label><Input type="email" placeholder="admin@company.com" /></div>
                      <div className="space-y-2"><Label>Full Name</Label><Input placeholder="Admin Name" /></div>
                      <div className="space-y-2"><Label>Temporary Password</Label><Input type="password" placeholder="Min 8 characters" /></div>
                    </div>
                  )}
                  {wizardStep === 5 && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Seed demo data for testing?</p>
                      <div className="flex gap-3">
                        <Button variant="outline">Skip Demo Data</Button>
                        <Button>Seed 50 Sample Records</Button>
                      </div>
                    </div>
                  )}
                  {wizardStep === 6 && (
                    <div className="space-y-3">
                      {["Company details configured", "At least one branch added", "Products selected", "Schemes configured", "Admin user created", "Market rates set"].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className={`h-4 w-4 ${i < 5 ? "text-green-500" : "text-muted-foreground"}`} />
                          <span className={`text-sm ${i < 5 ? "" : "text-muted-foreground"}`}>{item}</span>
                        </div>
                      ))}
                      <Button className="mt-4">🚀 Go Live</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" disabled={wizardStep === 0} onClick={() => setWizardStep((s) => s - 1)}>Previous</Button>
                <Button disabled={wizardStep === wizardSteps.length - 1} onClick={() => setWizardStep((s) => s + 1)}>
                  {wizardStep === wizardSteps.length - 2 ? "Finish" : "Next"} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total Tenants</p><p className="text-2xl font-bold">{tenants.length}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">MRR</p><p className="text-2xl font-bold">{formatCompact(tenants.length * 25000)}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Active Rate</p><p className="text-2xl font-bold">{tenants.length ? Math.round((tenants.filter((t: any) => t.is_active).length / tenants.length) * 100) : 0}%</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Avg Revenue/Tenant</p><p className="text-2xl font-bold">{formatINR(25000)}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Growth Trend (12mo)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area type="monotone" dataKey="tenants" stackId="1" className="fill-primary/30 stroke-primary" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminPage;
