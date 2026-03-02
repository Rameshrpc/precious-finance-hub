import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";

type AppRole = "super_admin" | "tenant_admin" | "manager" | "staff" | "viewer";

const ROLE_HIERARCHY: Record<AppRole, number> = {
  super_admin: 5,
  tenant_admin: 4,
  manager: 3,
  staff: 2,
  viewer: 1,
};

/**
 * Hook for role-based access control.
 * Returns helpers to check permissions based on the current user's roles.
 */
export function useRoleGuard() {
  const { roles, hasRole, profile } = useAuth();

  const highestLevel = useMemo(() => {
    let max = 0;
    for (const r of roles) {
      const level = ROLE_HIERARCHY[r as AppRole] || 0;
      if (level > max) max = level;
    }
    return max;
  }, [roles]);

  /** True if user has at least the given role level */
  const isAtLeast = (minRole: AppRole): boolean => {
    return highestLevel >= (ROLE_HIERARCHY[minRole] || 0);
  };

  /** True if user can perform destructive actions (close loan, delete, etc.) */
  const canDelete = isAtLeast("manager");

  /** True if user can create/edit loans and customers */
  const canWrite = isAtLeast("staff");

  /** True if user can access admin/settings pages */
  const canAdmin = isAtLeast("tenant_admin");

  /** True if user is super admin */
  const isSuperAdmin = hasRole("super_admin");

  /** True if user can approve requests */
  const canApprove = isAtLeast("manager");

  return {
    roles,
    highestLevel,
    isAtLeast,
    canDelete,
    canWrite,
    canAdmin,
    canApprove,
    isSuperAdmin,
    hasRole,
    branchId: profile?.branch_id,
  };
}
