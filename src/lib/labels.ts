/**
 * Dynamic product-type labels for GL / PO / SA
 * Usage: getLabel("GL", "charge") → "Interest"
 */

export interface ProductLabels {
  product: string;
  amount: string;
  charge: string;
  chargeRate: string;
  close: string;
  closeVerb: string;
  default: string;
  prefix: string;
  receiptPrefix: string;
  closePrefix: string;
  document: string;
}

const LABELS: Record<string, ProductLabels> = {
  GL: {
    product: "Gold Loan",
    amount: "Loan Amount",
    charge: "Interest",
    chargeRate: "Interest Rate",
    close: "Loan Closure",
    closeVerb: "Close Loan",
    default: "Gold Pledge Loan",
    prefix: "GL",
    receiptPrefix: "GLR",
    closePrefix: "GLC",
    document: "Pledge Card",
  },
  PO: {
    product: "Purchase Order",
    amount: "Purchase Amount",
    charge: "Storage Charge",
    chargeRate: "Storage Rate",
    close: "Delivery",
    closeVerb: "Deliver",
    default: "Purchase-Sale Sec 325",
    prefix: "PO",
    receiptPrefix: "POR",
    closePrefix: "POD",
    document: "Purchase Receipt",
  },
  SA: {
    product: "Sale Agreement",
    amount: "Sale Amount",
    charge: "Holding Charge",
    chargeRate: "Holding Rate",
    close: "Settlement",
    closeVerb: "Settle",
    default: "Sale Agreement",
    prefix: "SA",
    receiptPrefix: "SAR",
    closePrefix: "SAS",
    document: "Sale Agreement",
  },
};

export function getLabel(productType: string, key: keyof ProductLabels): string {
  return LABELS[productType]?.[key] ?? key;
}

export function useLabels(productType: string) {
  const labels = LABELS[productType] || LABELS.GL;
  return {
    ...labels,
    get: (key: keyof ProductLabels) => getLabel(productType, key),
  };
}

export { LABELS };
