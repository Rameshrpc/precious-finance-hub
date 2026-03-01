import { useLocation } from "react-router-dom";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useAuth } from "@/hooks/useAuth";
import { formatINR } from "@/lib/indian-locale";
import { ROLE_LABELS } from "@/lib/indian-locale";
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
  Bell,
  ChevronRight,
  LogOut,
  User,
  Settings,
  TrendingUp,
  TrendingDown,
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
  "/accounting/trial-balance": "Trial Balance",
  "/accounting/pnl": "P&L",
  "/accounting/balance-sheet": "Balance Sheet",
  "/reports": "Reports",
  "/approvals": "Approvals",
  "/collection": "Collection",
  "/communications/whatsapp": "WhatsApp Inbox",
  "/communications/templates": "Templates",
  "/settings": "Settings",
};

const TopBar = () => {
  const { setMobileOpen } = useSidebarState();
  const location = useLocation();
  const { profile, roles, signOut } = useAuth();

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
            className="pl-9 pr-4 h-9 bg-muted/50 border-0 focus-visible:ring-1"
            readOnly
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Rate widget */}
        <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-muted/50 text-xs">
          <span className="flex items-center gap-1 font-medium">
            <span className="text-gold">Au 22K</span>
            <span className="text-foreground">{formatINR(6_842, 0)}/g</span>
            <TrendingUp className="h-3 w-3 text-success" />
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1 font-medium">
            <span className="text-silver">Ag</span>
            <span className="text-foreground">{formatINR(92, 0)}/g</span>
            <TrendingDown className="h-3 w-3 text-destructive" />
          </span>
        </div>

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
