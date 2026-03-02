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
    product: "Gold Pledge Loan",
    amount: "Loan Amount",
    charge: "Interest",
    chargeRate: "Interest Rate",
    close: "Redemption",
    closeVerb: "Redeem",
    default: "Auction",
    prefix: "GL",
    receiptPrefix: "GLR",
    closePrefix: "GLC",
    document: "Pledge Certificate",
  },
  PO: {
    product: "Purchase-Sale",
    amount: "Purchase Price",
    charge: "Storage Charge",
    chargeRate: "Storage Rate",
    close: "Buyback",
    closeVerb: "Buyback",
    default: "Forfeiture",
    prefix: "PO",
    receiptPrefix: "POR",
    closePrefix: "POD",
    document: "Sale Bill",
  },
  SA: {
    product: "Sale Agreement",
    amount: "Sale Consideration",
    charge: "Holding Charge",
    chargeRate: "Holding Rate",
    close: "Repurchase",
    closeVerb: "Repurchase",
    default: "Forfeiture",
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
