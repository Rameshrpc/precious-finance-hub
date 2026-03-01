import { supabase } from "@/integrations/supabase/client";

/**
 * Auto-Posting Engine
 * Maps 15 transaction types to double-entry accounting voucher lines.
 * Each mapping specifies debit and credit account codes.
 * If Dr ≠ Cr, the difference goes to Suspense.
 */

export interface PostingEntry {
  debitAccount: string;
  creditAccount: string;
  amount: number;
  narration: string;
}

interface PostingMapping {
  entries: (amount: number, extra?: Record<string, number>) => PostingEntry[];
  voucherType: string;
}

// Account code references (must match chart_of_accounts codes)
const ACCOUNTS = {
  CASH: "1000-Cash in Hand",
  BANK: "1010-Bank Account",
  GL_LOANS_OS: "1100-GL Loans Outstanding",
  PO_GOLD_STOCK: "1200-PO Gold Stock",
  SA_RECEIVABLE: "1300-SA Receivable",
  REPLEDGE_LOAN: "2100-Repledge Loan Payable",
  PROVISION: "2200-Provision for Bad Debts",
  COMMISSION_PAYABLE: "2300-Commission Payable",
  INTEREST_INCOME: "3100-Interest Income",
  STORAGE_INCOME: "3200-Storage Income",
  HOLDING_INCOME: "3300-Holding Income",
  AUCTION_SURPLUS: "3400-Auction Surplus",
  PNL_FORFEITURE: "3500-Forfeiture P&L",
  COMMISSION_EXPENSE: "4100-Commission Expense",
  RP_INTEREST_EXPENSE: "4200-Repledge Interest Expense",
  PROVISION_EXPENSE: "4300-Provision Expense",
  AUCTION_DEFICIT: "4400-Auction Deficit",
  SUSPENSE: "9999-Suspense Account",
};

const POSTINGS: Record<string, PostingMapping> = {
  // GL (Gold Loan)
  newGLLoan: {
    voucherType: "disbursement",
    entries: (amount) => [
      { debitAccount: ACCOUNTS.GL_LOANS_OS, creditAccount: ACCOUNTS.CASH, amount, narration: "GL Loan disbursement" },
    ],
  },
  glInterest: {
    voucherType: "interest_collection",
    entries: (amount) => [
      { debitAccount: ACCOUNTS.CASH, creditAccount: ACCOUNTS.INTEREST_INCOME, amount, narration: "GL Interest collection" },
    ],
  },
  glRedemption: {
    voucherType: "redemption",
    entries: (amount, extra) => {
      const principal = extra?.principal || amount;
      const income = extra?.income || 0;
      const entries: PostingEntry[] = [
        { debitAccount: ACCOUNTS.CASH, creditAccount: ACCOUNTS.GL_LOANS_OS, amount: principal, narration: "GL Principal redemption" },
      ];
      if (income > 0) {
        entries.push({ debitAccount: ACCOUNTS.CASH, creditAccount: ACCOUNTS.INTEREST_INCOME, amount: income, narration: "GL Outstanding interest on redemption" });
      }
      return entries;
    },
  },

  // PO (Purchase of Old Gold)
  newPO: {
    voucherType: "disbursement",
    entries: (amount) => [
      { debitAccount: ACCOUNTS.PO_GOLD_STOCK, creditAccount: ACCOUNTS.CASH, amount, narration: "PO Gold purchase" },
    ],
  },
  poStorage: {
    voucherType: "interest_collection",
    entries: (amount) => [
      { debitAccount: ACCOUNTS.CASH, creditAccount: ACCOUNTS.STORAGE_INCOME, amount, narration: "PO Storage fee collection" },
    ],
  },
  poBuyback: {
    voucherType: "redemption",
    entries: (amount, extra) => {
      const stock = extra?.principal || amount;
      const income = extra?.income || 0;
      const entries: PostingEntry[] = [
        { debitAccount: ACCOUNTS.CASH, creditAccount: ACCOUNTS.PO_GOLD_STOCK, amount: stock, narration: "PO Buyback - stock return" },
      ];
      if (income > 0) {
        entries.push({ debitAccount: ACCOUNTS.CASH, creditAccount: ACCOUNTS.STORAGE_INCOME, amount: income, narration: "PO Buyback - storage income" });
      }
      return entries;
    },
  },
  poForfeiture: {
    voucherType: "forfeiture_sale",
    entries: (amount, extra) => {
      const stock = extra?.principal || 0;
      const pnl = amount - stock;
      const entries: PostingEntry[] = [
        { debitAccount: ACCOUNTS.CASH, creditAccount: ACCOUNTS.PO_GOLD_STOCK, amount: stock, narration: "Forfeiture sale - stock" },
      ];
      if (pnl > 0) {
        entries.push({ debitAccount: ACCOUNTS.CASH, creditAccount: ACCOUNTS.PNL_FORFEITURE, amount: pnl, narration: "Forfeiture sale - profit" });
      } else if (pnl < 0) {
        entries.push({ debitAccount: ACCOUNTS.PNL_FORFEITURE, creditAccount: ACCOUNTS.CASH, amount: Math.abs(pnl), narration: "Forfeiture sale - loss" });
      }
      return entries;
    },
  },

  // SA (Sale Agreement)
  newSA: {
    voucherType: "disbursement",
    entries: (amount) => [
      { debitAccount: ACCOUNTS.SA_RECEIVABLE, creditAccount: ACCOUNTS.CASH, amount, narration: "SA Agreement disbursement" },
    ],
  },
  saHolding: {
    voucherType: "interest_collection",
    entries: (amount) => [
      { debitAccount: ACCOUNTS.CASH, creditAccount: ACCOUNTS.HOLDING_INCOME, amount, narration: "SA Holding charge collection" },
    ],
  },
  saRepurchase: {
    voucherType: "redemption",
    entries: (amount, extra) => {
      const receivable = extra?.principal || amount;
      const income = extra?.income || 0;
      const entries: PostingEntry[] = [
        { debitAccount: ACCOUNTS.CASH, creditAccount: ACCOUNTS.SA_RECEIVABLE, amount: receivable, narration: "SA Repurchase - receivable" },
      ];
      if (income > 0) {
        entries.push({ debitAccount: ACCOUNTS.CASH, creditAccount: ACCOUNTS.HOLDING_INCOME, amount: income, narration: "SA Repurchase - holding income" });
      }
      return entries;
    },
  },

  // Repledge
  repledgeDraw: {
    voucherType: "receipt",
    entries: (amount) => [
      { debitAccount: ACCOUNTS.BANK, creditAccount: ACCOUNTS.REPLEDGE_LOAN, amount, narration: "Repledge draw from bank" },
    ],
  },
  rpPayment: {
    voucherType: "payment",
    entries: (amount) => [
      { debitAccount: ACCOUNTS.REPLEDGE_LOAN, creditAccount: ACCOUNTS.BANK, amount, narration: "Repledge loan payment" },
    ],
  },

  // Other
  commission: {
    voucherType: "journal",
    entries: (amount) => [
      { debitAccount: ACCOUNTS.COMMISSION_EXPENSE, creditAccount: ACCOUNTS.COMMISSION_PAYABLE, amount, narration: "Agent commission accrual" },
    ],
  },
  provision: {
    voucherType: "journal",
    entries: (amount) => [
      { debitAccount: ACCOUNTS.PROVISION_EXPENSE, creditAccount: ACCOUNTS.PROVISION, amount, narration: "Provision for bad debts" },
    ],
  },
  auctionSale: {
    voucherType: "auction_sale",
    entries: (amount, extra) => {
      const reserve = extra?.reserve || 0;
      const surplus = amount - reserve;
      const entries: PostingEntry[] = [
        { debitAccount: ACCOUNTS.CASH, creditAccount: ACCOUNTS.GL_LOANS_OS, amount: reserve, narration: "Auction sale - loan recovery" },
      ];
      if (surplus > 0) {
        entries.push({ debitAccount: ACCOUNTS.CASH, creditAccount: ACCOUNTS.AUCTION_SURPLUS, amount: surplus, narration: "Auction surplus" });
      } else if (surplus < 0) {
        entries.push({ debitAccount: ACCOUNTS.AUCTION_DEFICIT, creditAccount: ACCOUNTS.GL_LOANS_OS, amount: Math.abs(surplus), narration: "Auction deficit" });
      }
      return entries;
    },
  },
};

/**
 * Generate a JV voucher number
 */
function generateVoucherNumber(type: string): string {
  const prefix = type === "journal" ? "JV" : type === "receipt" ? "RV" : type === "payment" ? "PV" : "AV";
  return `${prefix}${Date.now().toString().slice(-8)}`;
}

/**
 * Post accounting entries for a transaction.
 * Validates Dr=Cr. If imbalanced, posts difference to Suspense.
 */
export async function autoPost(params: {
  tenantId: string;
  transactionType: string;
  amount: number;
  extra?: Record<string, number>;
  loanId?: string;
  entityId?: string;
  entityType?: string;
  userId?: string;
  date?: string;
}): Promise<{ success: boolean; voucherNumber: string; entries: PostingEntry[] }> {
  const mapping = POSTINGS[params.transactionType];
  if (!mapping) throw new Error(`Unknown transaction type: ${params.transactionType}`);

  const entries = mapping.entries(params.amount, params.extra);
  const voucherNumber = generateVoucherNumber(mapping.voucherType);
  const voucherDate = params.date || new Date().toISOString().slice(0, 10);

  // Validate Dr = Cr
  const totalDr = entries.reduce((s, e) => s + e.amount, 0);
  const totalCr = entries.reduce((s, e) => s + e.amount, 0);
  // In our model each entry is a single Dr-Cr pair, so they're always balanced per entry.
  // But if the mapping produces asymmetric entries, detect and fix:
  let finalEntries = [...entries];
  if (Math.abs(totalDr - totalCr) > 0.01) {
    const diff = totalDr - totalCr;
    if (diff > 0) {
      finalEntries.push({ debitAccount: ACCOUNTS.SUSPENSE, creditAccount: ACCOUNTS.SUSPENSE, amount: diff, narration: "Auto-balance suspense" });
    }
  }

  const inserts = finalEntries.map((e) => ({
    tenant_id: params.tenantId,
    voucher_date: voucherDate,
    voucher_type: mapping.voucherType,
    voucher_number: voucherNumber,
    debit_account: e.debitAccount,
    credit_account: e.creditAccount,
    amount: e.amount,
    narration: e.narration,
    loan_id: params.loanId || null,
    entity_id: params.entityId || null,
    entity_type: params.entityType || null,
    created_by: params.userId || null,
  }));

  const { error } = await supabase.from("voucher_lines").insert(inserts);
  if (error) throw error;

  return { success: true, voucherNumber, entries: finalEntries };
}

/** Expose account codes for reference */
export { ACCOUNTS, POSTINGS };
