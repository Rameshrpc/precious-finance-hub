import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useTenant } from "@/contexts/TenantContext";
import {
  LayoutDashboard,
  Users,
  FilePlus,
  List,
  GitBranch,
  Lock,
  Receipt,
  BookOpen,
  BookText,
  TrendingUp,
  PieChart,
  DollarSign,
  BarChart3,
  CheckSquare,
  PhoneCall,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronSubRight,
  Banknote,
  Landmark,
  Bell,
  Gavel,
  Layers,
  Building2,
  UserCog,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ROLE_LABELS } from "@/lib/indian-locale";
import { canAccessPath } from "@/lib/role-access";
import { useState } from "react";

interface NavItem {
  label: string;
  path?: string;
  icon: React.ElementType;
  requireProducts?: string[];
  children?: (NavItem & { path: string })[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Customers", path: "/customers", icon: Users },
      { label: "LOS Pipeline", path: "/transactions/los", icon: GitBranch },
      { label: "Active Loans", path: "/transactions", icon: Landmark },
    ],
  },
  {
    title: "TRANSACTIONS",
    items: [
      { label: "New Transaction", path: "/transactions/new", icon: FilePlus },
      { label: "Collect Charges", path: "/collection/queue", icon: Receipt },
      { label: "Loan Closures", path: "/transactions/forfeitures", icon: CheckSquare },
      { label: "Auctions", path: "/transactions/auctions", icon: Gavel },
      { label: "Balance Transfer", path: "/transactions/balance-transfer", icon: Banknote },
    ],
  },
  {
    title: "VAULT & ACCOUNTING",
    items: [
      { label: "Gold Vault", path: "/vault", icon: Lock },
      {
        label: "Accounting",
        icon: BookOpen,
        children: [
          { label: "Vouchers", path: "/accounting/vouchers", icon: Receipt },
          { label: "Day Book", path: "/accounting/daybook", icon: BookText },
          { label: "Ledger", path: "/accounting/ledger", icon: FileText },
          { label: "Chart of Accounts", path: "/accounting/chart", icon: BookOpen },
          { label: "Cash Mgmt", path: "/accounting/cash", icon: DollarSign },
          { label: "Trial Balance", path: "/accounting/trial-balance", icon: TrendingUp },
          { label: "P&L", path: "/accounting/pnl", icon: PieChart },
          { label: "Balance Sheet", path: "/accounting/balance-sheet", icon: DollarSign },
        ],
      },
    ],
  },
  {
    title: "COLLECTION",
    items: [
      { label: "Collection Queue", path: "/collection", icon: PhoneCall },
      { label: "DPD Tracker", path: "/collection/dpd", icon: BarChart3 },
      { label: "NPA Dashboard", path: "/collection/npa", icon: TrendingUp },
      { label: "Telecaller", path: "/collection/telecaller", icon: PhoneCall },
      { label: "Grievance", path: "/collection/grievance", icon: FileText },
    ],
  },
  {
    title: "REPORTS",
    items: [
      { label: "Reports & Analytics", path: "/reports", icon: BarChart3 },
      { label: "Notifications", path: "/notifications", icon: Bell },
      { label: "Approvals", path: "/approvals", icon: CheckSquare },
    ],
  },
  {
    title: "COMMUNICATIONS",
    items: [
      { label: "WhatsApp Inbox", path: "/communications/whatsapp", icon: MessageSquare },
      { label: "Templates", path: "/communications/templates", icon: FileText },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { label: "Settings", path: "/settings", icon: Settings },
      { label: "Users", path: "/settings/users", icon: UserCog },
      { label: "Branches", path: "/settings/branches", icon: Building2 },
      { label: "Schemes", path: "/settings/schemes", icon: Layers },
      { label: "Masters", path: "/settings/masters", icon: List },
      { label: "Profile", path: "/settings/profile", icon: User },
    ],
  },
  {
    title: "ADMIN",
    items: [
      { label: "Admin Panel", path: "/admin", icon: Settings },
      { label: "Test Checklist", path: "/admin/test-checklist", icon: CheckSquare },
      { label: "Cron Status", path: "/settings/cron-status", icon: BarChart3 },
      { label: "Help Center", path: "/help", icon: BookOpen },
    ],
  },
];

const AppSidebar = () => {
  const { collapsed, setCollapsed } = useSidebarState();
  const location = useLocation();
  const { profile, roles, signOut } = useAuth();
  const { tenantName, enabledProducts } = useTenant();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const isActive = (path?: string) => path ? location.pathname === path : false;
  const isChildActive = (item: NavItem) =>
    item.children?.some((c) => location.pathname.startsWith(c.path)) ?? false;

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const primaryRole = roles[0] || "staff";

  const isProductVisible = (item: NavItem): boolean => {
    if (!item.requireProducts || item.requireProducts.length === 0) return true;
    return item.requireProducts.every((p) => enabledProducts.includes(p));
  };

  const filterItems = (items: NavItem[]): NavItem[] => {
    return items
      .map((item) => {
        if (!isProductVisible(item)) return null;
        if (item.children) {
          const visibleChildren = item.children.filter(
            (c) => canAccessPath(c.path, roles) && isProductVisible(c)
          );
          if (visibleChildren.length === 0) return null;
          return { ...item, children: visibleChildren };
        }
        if (item.path && !canAccessPath(item.path, roles)) return null;
        return item;
      })
      .filter(Boolean) as NavItem[];
  };

  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const renderNavItem = (item: NavItem) => {
    const hasChildren = !!item.children?.length;
    const active = isActive(item.path);
    const childActive = isChildActive(item);
    const isOpen = openMenus[item.label] || childActive;

    const iconEl = <item.icon className="h-4 w-4 flex-shrink-0" />;

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => !collapsed && toggleMenu(item.label)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              childActive
                ? "text-gold border-l-2 border-gold bg-sidebar-accent"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{iconEl}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              iconEl
            )}
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                ) : (
                  <ChevronSubRight className="h-3.5 w-3.5 opacity-50" />
                )}
              </>
            )}
          </button>
          {!collapsed && isOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
              {item.children!.map((child) => (
                <Link
                  key={child.path}
                  to={child.path}
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                    isActive(child.path)
                      ? "text-gold bg-sidebar-accent"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                  )}
                >
                  <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{child.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    const linkContent = (
      <Link
        to={item.path!}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          active
            ? "text-gold border-l-2 border-gold bg-sidebar-accent"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{iconEl}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          iconEl
        )}
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );

    return <div key={item.label}>{linkContent}</div>;
  };

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col gradient-navy transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 shrink-0">
        <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0 shadow-gold">
          <span className="font-display font-bold text-sm text-gold-foreground">C</span>
        </div>
        {!collapsed && (
          <div className="animate-slide-in overflow-hidden">
            <p className="font-display font-bold text-sidebar-foreground text-sm leading-none">
              Cofi<span className="text-gold-shimmer">Zen</span>
            </p>
            <p className="text-[10px] text-gold tracking-widest uppercase mt-0.5">
              {tenantName || "Gold & Silver"}
            </p>
          </div>
        )}
      </div>

      <Separator className="bg-sidebar-border mx-3" />

      {/* Nav with section labels */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navGroups.map((group) => {
          const visibleItems = filterItems(group.items);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.title} className="mb-1">
              {!collapsed && (
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-sidebar-foreground/40 uppercase">
                  {group.title}
                </p>
              )}
              {collapsed && <Separator className="bg-sidebar-border mx-1 my-1" />}
              <div className="space-y-0.5">
                {visibleItems.map(renderNavItem)}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-sidebar-accent text-gold text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-slide-in">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {profile?.full_name || profile?.email || "User"}
              </p>
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 h-4 border-gold/40 text-gold mt-0.5"
              >
                {ROLE_LABELS[primaryRole] || primaryRole}
              </Badge>
            </div>
          )}
          <div className="flex gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent h-7 w-7"
              onClick={signOut}
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent h-7 w-7"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
