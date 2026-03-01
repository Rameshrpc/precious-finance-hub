import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

// Generic hook factory for simple CRUD masters
function useMasterTable<T extends { id: string }>(
  table: "item_groups" | "items" | "purities" | "loan_schemes" | "areas" | "agents" | "bank_partners" | "market_rates",
  selectStr = "*"
) {
  const { tenantId } = useTenant();
  const qc = useQueryClient();
  const key = [table, tenantId];

  const query = useQuery({
    queryKey: key,
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select(selectStr)
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as T[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (row: Partial<T> & { tenant_id?: string }) => {
      const payload = { ...row, tenant_id: tenantId! };
      const { data, error } = await supabase.from(table).upsert(payload as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success("Saved successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from(table).update({ is_active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, upsert: upsertMutation.mutateAsync, remove: deleteMutation.mutateAsync, toggle: toggleMutation.mutateAsync };
}

export function useItemGroups() {
  return useMasterTable<any>("item_groups");
}

export function useItems() {
  return useMasterTable<any>("items", "*, item_groups(name, metal_type)");
}

export function usePurities() {
  return useMasterTable<any>("purities");
}

export function useLoanSchemes() {
  return useMasterTable<any>("loan_schemes");
}

export function useAreas() {
  return useMasterTable<any>("areas");
}

export function useAgents() {
  return useMasterTable<any>("agents", "*, branches(name)");
}

export function useBankPartners() {
  return useMasterTable<any>("bank_partners");
}

export function useMarketRates() {
  return useMasterTable<any>("market_rates");
}

// Special upsert for market rates by date
export function useUpsertMarketRate() {
  const { tenantId } = useTenant();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (row: { rate_date: string; gold_22k: number; gold_24k: number; silver_per_kg: number }) => {
      const { data, error } = await supabase
        .from("market_rates")
        .upsert({ ...row, tenant_id: tenantId! }, { onConflict: "tenant_id,rate_date" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["market_rates", tenantId] });
      toast.success("Rates saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBranches() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ["branches", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("tenant_id", tenantId!);
      if (error) throw error;
      return data;
    },
  });
}
