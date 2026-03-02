import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Role-based route access configuration.
 * Maps route path prefixes to the roles allowed to access them.
 * super_admin has access to everything (handled in checkRouteAccess).
 *
 * Roles: super_admin, tenant_admin, manager, staff, viewer
 */
const ROUTE_ACCESS: Record<string, AppRole[]> = {
  "/dashboard": ["super_admin", "tenant_admin", "manager", "staff", "viewer"],
  "/customers": ["super_admin", "tenant_admin", "manager", "staff"],
  "/transactions/new": ["super_admin", "tenant_admin", "manager", "staff"],
  "/transactions/pipeline": ["super_admin", "tenant_admin", "manager", "staff"],
  "/transactions/los": ["super_admin", "tenant_admin", "manager", "staff"],
  "/transactions/balance-transfer": ["super_admin", "tenant_admin", "manager", "staff"],
  "/transactions": ["super_admin", "tenant_admin", "manager", "staff"],
  "/vault": ["super_admin", "tenant_admin", "manager"],
  "/accounting/cash": ["super_admin", "tenant_admin", "manager", "staff"],
  "/accounting/chart-of-accounts": ["super_admin", "tenant_admin"],
  "/accounting": ["super_admin", "tenant_admin"],
  "/reports": ["super_admin", "tenant_admin", "manager", "staff", "viewer"],
  "/approvals": ["super_admin", "tenant_admin", "manager"],
  "/collection/grievance": ["super_admin", "tenant_admin", "manager", "staff"],
  "/collection/dpd": ["super_admin", "tenant_admin", "manager", "staff"],
  "/collection/npa": ["super_admin", "tenant_admin", "manager"],
  "/collection/telecaller": ["super_admin", "tenant_admin", "manager", "staff"],
  "/collection": ["super_admin", "tenant_admin", "manager", "staff"],
  "/communications": ["super_admin", "tenant_admin", "manager"],
  "/settings": ["super_admin", "tenant_admin"],
  "/admin": ["super_admin"],
  "/help": ["super_admin", "tenant_admin", "manager", "staff", "viewer"],
};

/**
 * Check if a set of user roles grants access to a given route.
 * super_admin always has full access.
 */
export function checkRouteAccess(pathname: string, userRoles: string[]): boolean {
  if (userRoles.includes("super_admin")) return true;

  const sortedPrefixes = Object.keys(ROUTE_ACCESS).sort(
    (a, b) => b.length - a.length
  );

  for (const prefix of sortedPrefixes) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      const allowedRoles = ROUTE_ACCESS[prefix];
      return userRoles.some((r) => allowedRoles.includes(r as AppRole));
    }
  }

  return false;
}

/**
 * Filter sidebar menu items based on user roles.
 */
export function canAccessPath(path: string, userRoles: string[]): boolean {
  return checkRouteAccess(path, userRoles);
}
