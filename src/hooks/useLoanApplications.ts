import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const LOS_STAGES = ["applied", "docs_collected", "valued", "checked", "approved", "disbursed", "rejected"] as const;
export type LosStage = typeof LOS_STAGES[number];

export const STAGE_CONFIG: Record<string, { label: string; color: string; bgClass: string }> = {
  applied: { label: "Applied", color: "hsl(217 91% 60%)", bgClass: "bg-blue-500 text-white" },
  docs_collected: { label: "Documents", color: "hsl(25 95% 53%)", bgClass: "bg-orange-500 text-white" },
  valued: { label: "Valued", color: "hsl(271 91% 65%)", bgClass: "bg-purple-500 text-white" },
  checked: { label: "Checked", color: "hsl(48 96% 53%)", bgClass: "bg-yellow-400 text-black" },
  approved: { label: "Approved", color: "hsl(142 71% 45%)", bgClass: "bg-green-500 text-white" },
  disbursed: { label: "Disbursed", color: "hsl(49 89% 38%)", bgClass: "bg-accent text-accent-foreground" },
  rejected: { label: "Rejected", color: "hsl(0 72% 51%)", bgClass: "bg-destructive text-destructive-foreground" },
};

export const FUNNEL_STAGES = ["applied", "docs_collected", "valued", "checked", "approved", "disbursed"] as const;

export function useLoanApplications(filters?: { stage?: string; product?: string; branch?: string; dateFrom?: string; dateTo?: string }) {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["loan_applications", tenantId, filters],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase
        .from("loan_applications")
        .select("*, customers(name, code, phone), branches(name)")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });

      if (filters?.stage && filters.stage !== "all") q = q.eq("stage", filters.stage);
      if (filters?.product && filters.product !== "all") q = q.eq("product_type", filters.product);
      if (filters?.branch && filters.branch !== "all") q = q.eq("branch_id", filters.branch);
      if (filters?.dateFrom) q = q.gte("created_at", filters.dateFrom);
      if (filters?.dateTo) q = q.lte("created_at", filters.dateTo + "T23:59:59");

      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useStageCounts() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["los_stage_counts", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loan_applications")
        .select("stage")
        .eq("tenant_id", tenantId!);
      if (error) throw error;

      const counts: Record<string, number> = {};
      LOS_STAGES.forEach((s) => (counts[s] = 0));
      (data || []).forEach((r: any) => counts[r.stage]++);
      return counts;
    },
  });
}

export function useCreateApplication() {
  const { tenantId } = useTenant();
  const { user, profile } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      customer_id: string;
      product_type: string;
      purpose?: string;
      amount_requested: number;
      estimated_gold_weight?: number;
    }) => {
      // Generate app number
      const { data: appNum, error: fnErr } = await supabase.rpc("generate_application_number", {
        p_tenant_id: tenantId!,
      });
      if (fnErr) throw fnErr;

      const { data, error } = await supabase
        .from("loan_applications")
        .insert({
          tenant_id: tenantId!,
          branch_id: profile?.branch_id || null,
          customer_id: input.customer_id,
          application_number: appNum as string,
          product_type: input.product_type,
          purpose: input.purpose || null,
          amount_requested: input.amount_requested,
          estimated_gold_weight: input.estimated_gold_weight || null,
          stage: "applied",
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan_applications"] });
      qc.invalidateQueries({ queryKey: ["los_stage_counts"] });
      toast.success("Application created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateApplicationStage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stage, documents }: { id: string; stage: string; documents?: any }) => {
      const update: any = { stage };
      if (documents !== undefined) update.documents = documents;
      const { error } = await supabase.from("loan_applications").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan_applications"] });
      qc.invalidateQueries({ queryKey: ["los_stage_counts"] });
      toast.success("Stage updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
