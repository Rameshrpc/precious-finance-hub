/**
 * Indian locale formatting utilities for CofiZen
 * Re-exports from formatters.ts for backward compatibility
 */

export { formatINR, formatDate as formatDateIN, formatWeight } from "./formatters";

/**
 * Product type labels
 */
export const PRODUCT_LABELS: Record<string, string> = {
  GL: "Gold Pledge Loan",
  PO: "Purchase-Sale",
  SA: "Sale Agreement",
};

/**
 * Metal type labels
 */
export const METAL_LABELS: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
};

/**
 * Role labels
 */
export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  tenant_admin: "Tenant Admin",
  manager: "Branch Manager",
  staff: "Loan Officer",
  viewer: "Viewer",
};
