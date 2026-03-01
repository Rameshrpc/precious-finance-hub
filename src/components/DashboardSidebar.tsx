import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Landmark,
  Users,
  Building2,
  FileText,
  ShoppingCart,
  ScrollText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Gold Loans", path: "/dashboard/gold-loans", icon: Landmark },
  { label: "Purchase Orders", path: "/dashboard/purchase-orders", icon: ShoppingCart },
  { label: "Sale Agreements", path: "/dashboard/sale-agreements", icon: ScrollText },
  { label: "Customers", path: "/dashboard/customers", icon: Users },
  { label: "Reports", path: "/dashboard/reports", icon: FileText },
];

const adminItems: NavItem[] = [
  { label: "Branches", path: "/dashboard/branches", icon: Building2, roles: ["super_admin", "tenant_admin"] },
  { label: "Users", path: "/dashboard/users", icon: Users, roles: ["super_admin", "tenant_admin"] },
  { label: "Settings", path: "/dashboard/settings", icon: Settings, roles: ["super_admin", "tenant_admin"] },
];

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile, roles, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const visibleAdminItems = adminItems.filter(
    (item) => !item.roles || item.roles.some((r) => roles.includes(r))
  );

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col gradient-navy transition-all duration-300 border-r border-sidebar-border",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-display font-bold text-sm">C</span>
        </div>
        {!collapsed && (
          <div className="animate-slide-in">
            <p className="font-display font-bold text-sidebar-foreground text-sm leading-none">CofiZen</p>
            <p className="text-[10px] text-gold tracking-widest uppercase mt-0.5">Gold & Silver</p>
          </div>
        )}
      </div>

      <Separator className="bg-sidebar-border mx-3" />

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(item.path)
                ? "bg-sidebar-accent text-gold"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="animate-slide-in">{item.label}</span>}
          </Link>
        ))}

        {visibleAdminItems.length > 0 && (
          <>
            <Separator className="bg-sidebar-border !my-3 mx-1" />
            {!collapsed && (
              <p className="px-3 text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider mb-1">
                Admin
              </p>
            )}
            {visibleAdminItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.path)
                    ? "bg-sidebar-accent text-gold"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="animate-slide-in">{item.label}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed && profile && (
          <div className="px-2 mb-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile.full_name || profile.email}
            </p>
            <p className="text-xs text-sidebar-muted truncate">{profile.email}</p>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
