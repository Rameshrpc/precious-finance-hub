import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export interface LoanWithCustomer {
  id: string;
  loan_number: string;
  product_type: string;
  amount: number;
  rate: number;
  tenure_months: number;
  status: string;
  gold_value: number;
  silver_value: number;
  total_pledge_value: number;
  gold_ltv: number;
  silver_ltv: number;
  overall_ltv: number;
  maturity_date: string | null;
  created_at: string;
  customer_id: string;
  branch_id: string | null;
  scheme_id: string | null;
  agent_id: string | null;
  disbursement_mode: string;
  disbursement_bank_name: string | null;
  disbursement_account: string | null;
  disbursement_ifsc: string | null;
  disbursement_upi_id: string | null;
  disbursement_cheque_no: string | null;
  purpose: string | null;
  notes: string | null;
  loan_application_id: string | null;
  updated_at: string;
  created_by: string | null;
  customer: {
    id: string;
    name: string;
    code: string;
    phone: string;
    city: string | null;
    photo_url: string | null;
  } | null;
}

export function useLoans() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["loans", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*, customer:customers(id, name, code, phone, city, photo_url)")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as LoanWithCustomer[];
    },
  });
}

export function useLoanDetail(loanId: string | undefined) {
  const { tenantId } = useTenant();

  const loanQuery = useQuery({
    queryKey: ["loan-detail", loanId],
    enabled: !!loanId && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*, customer:customers(id, name, code, phone, city, photo_url, aadhaar, pan, address, email)")
        .eq("id", loanId!)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const pledgeQuery = useQuery({
    queryKey: ["pledge-items", loanId],
    enabled: !!loanId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pledge_items")
        .select("*")
        .eq("loan_id", loanId!)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const interestQuery = useQuery({
    queryKey: ["interest-records", loanId],
    enabled: !!loanId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interest_records")
        .select("*")
        .eq("loan_id", loanId!)
        .order("due_date");
      if (error) throw error;
      return data || [];
    },
  });

  const auditQuery = useQuery({
    queryKey: ["audit-logs", "loan", loanId],
    enabled: !!loanId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "loan")
        .eq("entity_id", loanId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const schemeQuery = useQuery({
    queryKey: ["loan-scheme", loanQuery.data?.scheme_id],
    enabled: !!loanQuery.data?.scheme_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loan_schemes")
        .select("*")
        .eq("id", loanQuery.data!.scheme_id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  return {
    loan: loanQuery.data,
    loanLoading: loanQuery.isLoading,
    pledgeItems: pledgeQuery.data || [],
    interestRecords: interestQuery.data || [],
    auditLogs: auditQuery.data || [],
    scheme: schemeQuery.data,
  };
}
