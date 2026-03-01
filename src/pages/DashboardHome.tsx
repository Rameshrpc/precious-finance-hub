import { useAuth } from "@/hooks/useAuth";
import { formatINR } from "@/lib/indian-locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Landmark,
  ShoppingCart,
  ScrollText,
  TrendingUp,
  IndianRupee,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "up" | "down";
  icon: React.ElementType;
  accent?: boolean;
}

const StatCard = ({ title, value, change, changeType, icon: Icon, accent }: StatCardProps) => (
  <Card className={accent ? "border-gold/30 shadow-gold" : "shadow-navy/5"}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={accent ? "p-2 rounded-lg gradient-gold" : "p-2 rounded-lg bg-primary/10"}>
        <Icon className={accent ? "h-4 w-4 text-gold-foreground" : "h-4 w-4 text-primary"} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold font-display">{value}</div>
      {change && (
        <div className="flex items-center gap-1 mt-1">
          {changeType === "up" ? (
            <ArrowUpRight className="h-3 w-3 text-success" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-destructive" />
          )}
          <span className={`text-xs ${changeType === "up" ? "text-success" : "text-destructive"}`}>
            {change}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </CardContent>
  </Card>
);

const DashboardHome = () => {
  const { profile, roles } = useAuth();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          {greeting()}, {profile?.full_name || "User"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's an overview of your precious metals portfolio
        </p>
        <div className="flex gap-2 mt-3">
          {roles.map((role) => (
            <Badge key={role} variant="secondary" className="capitalize">
              {role.replace("_", " ")}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Portfolio"
          value={formatINR(2_45_67_890)}
          change="+12.5%"
          changeType="up"
          icon={IndianRupee}
          accent
        />
        <StatCard
          title="Active Gold Loans"
          value="156"
          change="+8.3%"
          changeType="up"
          icon={Landmark}
        />
        <StatCard
          title="Purchase Orders"
          value="42"
          change="-2.1%"
          changeType="down"
          icon={ShoppingCart}
        />
        <StatCard
          title="Sale Agreements"
          value="28"
          change="+15.7%"
          changeType="up"
          icon={ScrollText}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gold" />
              Today's Metal Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div>
                  <p className="font-medium text-foreground">Gold (24K)</p>
                  <p className="text-sm text-muted-foreground">Per gram</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{formatINR(7_250)}</p>
                  <p className="text-xs text-success flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" /> +0.8%
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div>
                  <p className="font-medium text-foreground">Silver (999)</p>
                  <p className="text-sm text-muted-foreground">Per gram</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{formatINR(92.5, 1)}</p>
                  <p className="text-xs text-destructive flex items-center gap-0.5">
                    <ArrowDownRight className="h-3 w-3" /> -0.3%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: "Gold Loan #GL-2024-0156 disbursed", time: "2 hours ago", type: "GL" },
                { action: "Purchase Order #PO-2024-0042 approved", time: "4 hours ago", type: "PO" },
                { action: "Sale Agreement #SA-2024-0028 signed", time: "Yesterday", type: "SA" },
                { action: "Customer KYC verified - Rajesh Kumar", time: "Yesterday", type: "KYC" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] mt-0.5 font-mono shrink-0"
                  >
                    {item.type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
