import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TenantContextValue {
  tenantId: string | null;
  tenantName: string | null;
  plan: string | null;
  isActive: boolean;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenantId: null,
  tenantName: null,
  plan: null,
  isActive: true,
  loading: true,
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const [state, setState] = useState<TenantContextValue>({
    tenantId: null,
    tenantName: null,
    plan: null,
    isActive: true,
    loading: true,
  });

  useEffect(() => {
    if (!profile?.tenant_id) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const fetchTenant = async () => {
      const { data } = await supabase
        .from("tenants")
        .select("id, name, plan, is_active")
        .eq("id", profile.tenant_id!)
        .single();

      setState({
        tenantId: data?.id ?? null,
        tenantName: data?.name ?? null,
        plan: data?.plan ?? null,
        isActive: data?.is_active ?? true,
        loading: false,
      });
    };

    fetchTenant();
  }, [profile?.tenant_id]);

  return (
    <TenantContext.Provider value={state}>{children}</TenantContext.Provider>
  );
};
