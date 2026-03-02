import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { formatINR } from "@/lib/indian-locale";
import { ROLE_LABELS } from "@/lib/indian-locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/NotificationCenter";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Search,
  ChevronRight,
  LogOut,
  User,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/customers": "Customers",
  "/transactions": "Transactions",
  "/transactions/new": "New Transaction",
  "/transactions/los": "LOS Pipeline",
  "/transactions/los/new": "New Application",
  "/transactions/pipeline": "LOS Pipeline",
  "/vault": "Gold Vault",
  "/accounting": "Accounting",
  "/accounting/vouchers": "Vouchers",
  "/accounting/daybook": "Day Book",
  "/accounting/ledger": "Ledger",
  "/accounting/chart-of-accounts": "Chart of Accounts",
  "/accounting/cash": "Cash Management",
  "/accounting/trial-balance": "Trial Balance",
  "/accounting/pnl": "P&L",
  "/accounting/balance-sheet": "Balance Sheet",
  "/reports": "Reports",
  "/approvals": "Approvals",
  "/collection": "Collection",
  "/collection/dpd": "DPD Tracker",
  "/collection/npa": "NPA Dashboard",
  "/collection/grievance": "Grievance",
  "/communications/whatsapp": "WhatsApp Inbox",
  "/communications/templates": "Templates",
  "/settings": "Settings",
};

interface RateData {
  gold_22k: number;
  gold_24k: number;
  silver_per_kg: number;
}

const TopBar = () => {
  const { setMobileOpen } = useSidebarState();
  const location = useLocation();
  const { profile, roles, signOut } = useAuth();
  const { tenantId, enableSilver } = useTenant();

  const [todayRate, setTodayRate] = useState<RateData | null>(null);
  const [yesterdayRate, setYesterdayRate] = useState<RateData | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    const fetchRates = async () => {
      const { data } = await supabase
        .from("market_rates")
        .select("gold_22k, gold_24k, silver_per_kg, rate_date")
        .eq("tenant_id", tenantId)
        .order("rate_date", { ascending: false })
        .limit(2);
      if (data && data.length > 0) {
        setTodayRate({ gold_22k: data[0].gold_22k, gold_24k: data[0].gold_24k, silver_per_kg: data[0].silver_per_kg });
        if (data.length > 1) {
          setYesterdayRate({ gold_22k: data[1].gold_22k, gold_24k: data[1].gold_24k, silver_per_kg: data[1].silver_per_kg });
        }
      }
    };
    fetchRates();
  }, [tenantId]);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; path: string }[] = [];
  let accumulated = "";
  for (const seg of pathSegments) {
    accumulated += `/${seg}`;
    const label = breadcrumbMap[accumulated];
    if (label) breadcrumbs.push({ label, path: accumulated });
  }

  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const primaryRole = roles[0] || "staff";

  const goldPerGram = todayRate?.gold_22k ?? 0;
  const silverPerGram = todayRate ? Math.round(todayRate.silver_per_kg / 1000) : 0;
  const goldChange = todayRate && yesterdayRate ? todayRate.gold_22k - yesterdayRate.gold_22k : 0;
  const silverChange = todayRate && yesterdayRate
    ? Math.round(todayRate.silver_per_kg / 1000) - Math.round(yesterdayRate.silver_per_kg / 1000)
    : 0;

  const ChangeIcon = ({ val }: { val: number }) =>
    val > 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> :
    val < 0 ? <TrendingDown className="h-3 w-3 text-destructive" /> :
    <Minus className="h-3 w-3 text-muted-foreground" />;

  return (
    <header className="h-16 sticky top-0 z-20 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumb */}
      <nav className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3" />}
            <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Center search */}
      <div className="flex-1 flex justify-center max-w-md mx-auto">
        <div className="relative w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search... (Cmd+K)"
            className="pl-9 pr-4 h-9 bg-muted/50 border-0 focus-visible:ring-1 cursor-pointer"
            readOnly
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Rate widget - live from DB */}
        {todayRate && (
          <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-muted/50 text-xs">
            <span className="flex items-center gap-1 font-medium">
              <span className="text-gold">Au 22K</span>
              <span className="text-foreground">{formatINR(goldPerGram, 0)}/g</span>
              <ChangeIcon val={goldChange} />
            </span>
            {enableSilver && (
              <>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1 font-medium">
                  <span className="text-muted-foreground">Ag</span>
                  <span className="text-foreground">{formatINR(silverPerGram, 0)}/g</span>
                  <ChangeIcon val={silverChange} />
                </span>
              </>
            )}
          </div>
        )}

        {/* Notification Center */}
        <NotificationCenter />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:inline text-sm font-medium">
                {profile?.full_name?.split(" ")[0] || "User"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
              <Badge variant="secondary" className="mt-1 text-[10px]">
                {ROLE_LABELS[primaryRole] || primaryRole}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;
