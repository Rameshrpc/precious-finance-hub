import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Gem, Package, Coins } from "lucide-react";

const products = [
  { key: "GL", label: "Gold Loan", description: "Traditional gold loan against pledged gold ornaments", icon: Gem, color: "text-yellow-500" },
  { key: "PO", label: "Purchase Order", description: "Gold/silver purchase and storage scheme for customers", icon: Package, color: "text-blue-500" },
  { key: "SA", label: "Savings Account", description: "Gold savings accumulation plan with periodic holding charges", icon: Coins, color: "text-emerald-500" },
];

const ProductsTab = () => {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ GL: true, PO: false, SA: false });

  const handleToggle = (key: string) => {
    if (enabled[key]) {
      toast.warning(`Disabling ${key} will archive active transactions as read-only`);
    } else {
      toast.success(`${key} enabled. Schemes and accounts auto-seeded.`);
    }
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <Card key={p.key} className={enabled[p.key] ? "border-primary/50" : "opacity-60"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p.icon className={`h-6 w-6 ${p.color}`} />
                  <CardTitle className="text-lg">{p.label}</CardTitle>
                </div>
                <Switch checked={enabled[p.key]} onCheckedChange={() => handleToggle(p.key)} />
              </div>
              <CardDescription>{p.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant={enabled[p.key] ? "default" : "secondary"}>{enabled[p.key] ? "Active" : "Disabled"}</Badge>
              {enabled[p.key] && (
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <p>✓ Schemes configured</p>
                  <p>✓ Chart of accounts seeded</p>
                  <p>✓ Voucher series set</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductsTab;
