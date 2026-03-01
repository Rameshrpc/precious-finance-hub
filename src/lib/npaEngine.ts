/**
 * NPA Classification Engine
 * Classifies loans based on DPD and calculates provisions.
 */

export interface NPAClassification {
  classification: string;
  provisionRate: number;
  taskType: string | null;
}

export function classifyLoan(dpd: number, isManualLoss = false): NPAClassification {
  if (isManualLoss) return { classification: "loss", provisionRate: 100, taskType: "legal" };
  if (dpd <= 0) return { classification: "standard", provisionRate: 0.4, taskType: null };
  if (dpd <= 30) return { classification: "sma_0", provisionRate: 0.4, taskType: null };
  if (dpd <= 60) return { classification: "sma_1", provisionRate: 5, taskType: "call" };
  if (dpd <= 90) return { classification: "sma_2", provisionRate: 10, taskType: "field_visit" };
  if (dpd <= 365) return { classification: "sub_standard", provisionRate: 15, taskType: "legal" };
  if (dpd <= 730) return { classification: "doubtful_1", provisionRate: 25, taskType: "legal" };
  if (dpd <= 1095) return { classification: "doubtful_2", provisionRate: 40, taskType: "legal" };
  return { classification: "doubtful_3", provisionRate: 100, taskType: "legal" };
}

export function getClassificationLabel(c: string): string {
  const labels: Record<string, string> = {
    standard: "Standard",
    sma_0: "SMA-0 (1-30)",
    sma_1: "SMA-1 (31-60)",
    sma_2: "SMA-2 (61-90)",
    sub_standard: "Sub-Standard (NPA)",
    doubtful_1: "Doubtful-1",
    doubtful_2: "Doubtful-2",
    doubtful_3: "Doubtful-3",
    loss: "Loss",
  };
  return labels[c] || c;
}

export function getClassificationColor(c: string): string {
  if (c === "standard" || c === "sma_0") return "text-green-600";
  if (c === "sma_1") return "text-yellow-600";
  if (c === "sma_2") return "text-orange-500";
  return "text-destructive";
}

export function isNPA(classification: string): boolean {
  return ["sub_standard", "doubtful_1", "doubtful_2", "doubtful_3", "loss"].includes(classification);
}
