import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Configurable maker-checker approval engine.
 * Maps transaction types + amount thresholds to required approver roles.
 */

interface ApprovalRule {
  type: string;
  minAmount: number;
  maxAmount: number;
  requiredRole: AppRole;
}

// Default rules — could be overridden from tenant settings
const DEFAULT_RULES: ApprovalRule[] = [
  { type: "new_loan", minAmount: 0, maxAmount: 500000, requiredRole: "manager" },
  { type: "new_loan", minAmount: 500001, maxAmount: Infinity, requiredRole: "tenant_admin" },
  { type: "gold_release", minAmount: 0, maxAmount: Infinity, requiredRole: "manager" },
  { type: "charge_waiver", minAmount: 0, maxAmount: 10000, requiredRole: "manager" },
  { type: "charge_waiver", minAmount: 10001, maxAmount: Infinity, requiredRole: "tenant_admin" },
  { type: "scheme_change", minAmount: 0, maxAmount: Infinity, requiredRole: "manager" },
  { type: "forfeiture", minAmount: 0, maxAmount: Infinity, requiredRole: "tenant_admin" },
];

const ROLE_HIERARCHY: Record<AppRole, number> = {
  viewer: 0,
  staff: 1,
  manager: 2,
  tenant_admin: 3,
  super_admin: 4,
};

/**
 * Check if an action needs approval and what role is required.
 */
export function checkApproval(
  userRoles: AppRole[],
  type: string,
  amount: number
): { needsApproval: boolean; requiredRole: AppRole | null } {
  const rule = DEFAULT_RULES.find(
    (r) => r.type === type && amount >= r.minAmount && amount <= r.maxAmount
  );

  if (!rule) return { needsApproval: false, requiredRole: null };

  const userMaxLevel = Math.max(...userRoles.map((r) => ROLE_HIERARCHY[r] || 0));
  const requiredLevel = ROLE_HIERARCHY[rule.requiredRole] || 0;

  // Auto-approve if user has sufficient role
  if (userMaxLevel >= requiredLevel) {
    return { needsApproval: false, requiredRole: null };
  }

  return { needsApproval: true, requiredRole: rule.requiredRole };
}

/**
 * Submit a transaction for approval.
 */
export async function submitForApproval(params: {
  tenantId: string;
  entityId: string;
  entityType?: string;
  requestType: string;
  amount: number;
  requestedBy: string;
  requestedByName: string;
  details?: Record<string, any>;
}) {
  const { error } = await supabase.from("approval_requests").insert({
    tenant_id: params.tenantId,
    entity_id: params.entityId,
    entity_type: params.entityType || "loan",
    request_type: params.requestType,
    amount: params.amount,
    requested_by: params.requestedBy,
    requested_by_name: params.requestedByName,
    details: params.details || {},
    status: "pending",
  });
  if (error) throw error;
}

/**
 * Approve a pending request.
 */
export async function approveTransaction(
  requestId: string,
  reviewerId: string,
  reviewerName: string,
  comment?: string
) {
  const { error } = await supabase
    .from("approval_requests")
    .update({
      status: "approved",
      reviewed_by: reviewerId,
      reviewed_by_name: reviewerName,
      review_comment: comment || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) throw error;
}

/**
 * Reject a pending request.
 */
export async function rejectTransaction(
  requestId: string,
  reviewerId: string,
  reviewerName: string,
  reason: string
) {
  const { error } = await supabase
    .from("approval_requests")
    .update({
      status: "rejected",
      reviewed_by: reviewerId,
      reviewed_by_name: reviewerName,
      review_comment: reason,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) throw error;
}
