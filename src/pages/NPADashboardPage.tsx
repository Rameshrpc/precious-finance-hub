import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useQuery } from "@tanstack/react-query";
import { formatINR } from "@/lib/formatters";
import { classifyLoan, getClassificationLabel, getClassificationColor, isNPA } from "@/lib/npaEngine";
import { AlertTriangle, TrendingDown, Shield, IndianRupee } from "lucide-react";

export default function NPADashboardPage() {
  const { tenantId } = useTenant();

  const { data: loans } = useQuery({
    queryKey: ["npa-loans", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("loans").select("*, customers(name, code, phone), interest_records(status, due_date)")
        .eq("tenant_id", tenantId).eq("status", "active").limit(500);
      return (data || []).map((l: any) => {
        const overdue = (l.interest_records || []).filter((r: any) => r.status === "overdue" || r.status === "pending");
        const oldestDue = overdue.length > 0 ? overdue.sort((a: any, b: any) => a.due_date.localeCompare(b.due_date))[0]?.due_date : null;
        const dpd = oldestDue ? Math.max(0, Math.floor((Date.now() - new Date(oldestDue).getTime()) / 86400000)) : 0;
        const cls = classifyLoan(dpd);
        return { ...l, dpd, ...cls };
      });
    },
  });

  const allLoans = loans || [];
  const npaLoans = allLoans.filter((l: any) => isNPA(l.classification));
  const totalOutstanding = allLoans.reduce((s: number, l: any) => s + Number(l.amount), 0);
  const npaOutstanding = npaLoans.reduce((s: number, l: any) => s + Number(l.amount), 0);
  const grossNPA = totalOutstanding > 0 ? ((npaOutstanding / totalOutstanding) * 100).toFixed(2) : "0";
  const totalProvision = allLoans.reduce((s: number, l: any) => s + (Number(l.amount) * l.provisionRate / 100), 0);

  const buckets = allLoans.reduce((acc: any, l: any) => {
    if (!acc[l.classification]) acc[l.classification] = { count: 0, amount: 0 };
    acc[l.classification].count++;
    acc[l.classification].amount += Number(l.amount);
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-display font-bold">NPA Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><AlertTriangle className="h-4 w-4" /> Total NPAs</div>
          <p className="text-2xl font-bold mt-1">{npaLoans.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><TrendingDown className="h-4 w-4" /> Gross NPA %</div>
          <p className="text-2xl font-bold mt-1 text-destructive">{grossNPA}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><IndianRupee className="h-4 w-4" /> NPA Outstanding</div>
          <p className="text-2xl font-bold mt-1">{formatINR(npaOutstanding)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Shield className="h-4 w-4" /> Provisions</div>
          <p className="text-2xl font-bold mt-1">{formatINR(totalProvision)}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="classification">
        <TabsList><TabsTrigger value="classification">Classification</TabsTrigger><TabsTrigger value="npaList">NPA Loans</TabsTrigger></TabsList>
        <TabsContent value="classification">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Classification</TableHead><TableHead>Count</TableHead><TableHead>Outstanding</TableHead><TableHead>Provision Rate</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([cls, v]: [string, any]) => (
                  <TableRow key={cls}>
                    <TableCell className={getClassificationColor(cls)}>{getClassificationLabel(cls)}</TableCell>
                    <TableCell>{v.count}</TableCell>
                    <TableCell>{formatINR(v.amount)}</TableCell>
                    <TableCell>{classifyLoan(cls === "standard" ? 0 : 91).provisionRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="npaList">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Loan #</TableHead><TableHead>Customer</TableHead><TableHead>Amount</TableHead>
                <TableHead>DPD</TableHead><TableHead>Classification</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {npaLoans.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.loan_number}</TableCell>
                    <TableCell className="text-xs">{l.customers?.name}</TableCell>
                    <TableCell className="text-xs">{formatINR(l.amount)}</TableCell>
                    <TableCell><Badge variant="destructive">{l.dpd}</Badge></TableCell>
                    <TableCell className={getClassificationColor(l.classification) + " text-xs"}>{getClassificationLabel(l.classification)}</TableCell>
                  </TableRow>
                ))}
                {npaLoans.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No NPA loans</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
