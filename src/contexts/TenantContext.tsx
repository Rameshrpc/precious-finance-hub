import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TenantContextValue {
  tenantId: string | null;
  tenantName: string | null;
  plan: string | null;
  isActive: boolean;
  enabledProducts: string[];
  defaultProduct: string;
  enableSilver: boolean;
  settingsJson: Record<string, any>;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenantId: null,
  tenantName: null,
  plan: null,
  isActive: true,
  enabledProducts: ["GL"],
  defaultProduct: "GL",
  enableSilver: false,
  settingsJson: {},
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
    enabledProducts: ["GL"],
    defaultProduct: "GL",
    enableSilver: false,
    settingsJson: {},
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
        .select("id, name, plan, is_active, enabled_products, default_product, enable_silver, settings_json")
        .eq("id", profile.tenant_id!)
        .single();

      const enabledStr = (data as any)?.enabled_products || "GL";
      const products = enabledStr.split(",").map((s: string) => s.trim()).filter(Boolean);

      setState({
        tenantId: data?.id ?? null,
        tenantName: data?.name ?? null,
        plan: data?.plan ?? null,
        isActive: data?.is_active ?? true,
        enabledProducts: products,
        defaultProduct: (data as any)?.default_product || "GL",
        enableSilver: (data as any)?.enable_silver ?? false,
        settingsJson: (data as any)?.settings_json || {},
        loading: false,
      });
    };

    fetchTenant();
  }, [profile?.tenant_id]);

  return (
    <TenantContext.Provider value={state}>{children}</TenantContext.Provider>
  );
};
