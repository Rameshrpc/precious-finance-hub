/**
 * Indian locale formatting utilities for CofiZen
 */

/**
 * Format number to Indian currency format: ₹12,34,567.00
 */
export function formatINR(amount: number, decimals = 2): string {
  const parts = amount.toFixed(decimals).split(".");
  const intPart = parts[0];
  const decPart = parts[1];

  // Indian grouping: last 3, then groups of 2
  const lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);

  const formatted = rest.length
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
    : lastThree;

  return `₹${formatted}${decPart ? "." + decPart : ""}`;
}

/**
 * Format date to DD/MM/YYYY
 */
export function formatDateIN(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format weight in grams
 */
export function formatWeight(grams: number, decimals = 3): string {
  return `${grams.toFixed(decimals)} g`;
}

/**
 * Product type labels
 */
export const PRODUCT_LABELS: Record<string, string> = {
  GL: "Gold Loan",
  PO: "Purchase Order",
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
