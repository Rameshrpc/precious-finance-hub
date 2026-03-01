import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Role-based route access configuration.
 * Maps route path prefixes to the roles allowed to access them.
 * super_admin has access to everything (handled in checkRouteAccess).
 */
const ROUTE_ACCESS: Record<string, AppRole[]> = {
  // tenant_admin: everything except explicitly blocked routes
  "/dashboard": ["super_admin", "tenant_admin", "manager", "staff"],
  "/customers": ["super_admin", "tenant_admin", "manager"],
  "/transactions/new": ["super_admin", "tenant_admin", "manager", "staff"],
  "/transactions/pipeline": ["super_admin", "tenant_admin", "manager", "staff"],
  "/transactions": ["super_admin", "tenant_admin", "manager", "staff"],
  "/vault": ["super_admin", "tenant_admin", "manager"],
  "/accounting": ["super_admin", "tenant_admin"],
  "/reports": ["super_admin", "tenant_admin", "manager", "staff"],
  "/approvals": ["super_admin", "tenant_admin", "manager"],
  "/collection": ["super_admin", "tenant_admin", "manager", "staff"],
  "/communications": ["super_admin", "tenant_admin", "manager"],
  "/settings": ["super_admin", "tenant_admin"],
};

/**
 * Check if a set of user roles grants access to a given route.
 * super_admin always has full access.
 */
export function checkRouteAccess(pathname: string, userRoles: string[]): boolean {
  // super_admin bypasses all checks
  if (userRoles.includes("super_admin")) return true;

  // Find the most specific matching route prefix
  const sortedPrefixes = Object.keys(ROUTE_ACCESS).sort(
    (a, b) => b.length - a.length
  );

  for (const prefix of sortedPrefixes) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      const allowedRoles = ROUTE_ACCESS[prefix];
      return userRoles.some((r) => allowedRoles.includes(r as AppRole));
    }
  }

  // No matching rule → deny
  return false;
}

/**
 * Filter sidebar menu items based on user roles.
 */
export function canAccessPath(path: string, userRoles: string[]): boolean {
  return checkRouteAccess(path, userRoles);
}
