import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";

export interface Customer {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  code: string;
  name: string;
  phone: string;
  whatsapp_same_as_phone: boolean;
  whatsapp_phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  pincode: string | null;
  area: string | null;
  aadhaar: string | null;
  aadhaar_verified: boolean;
  pan: string | null;
  photo_url: string | null;
  nominee_name: string | null;
  nominee_relation: string | null;
  nominee_phone: string | null;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type CustomerInsert = Omit<Customer, "id" | "created_at" | "updated_at">;

interface UseCustomersParams {
  search?: string;
  branch_id?: string;
  category?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function useCustomers({
  search = "",
  branch_id,
  category,
  status,
  page = 0,
  pageSize = 25,
}: UseCustomersParams = {}) {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["customers", tenantId, search, branch_id, category, status, page, pageSize],
    queryFn: async () => {
      if (!tenantId) return { data: [], count: 0 };

      let query = supabase
        .from("customers")
        .select("*", { count: "exact" })
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,code.ilike.%${search}%`);
      }
      if (branch_id) query = query.eq("branch_id", branch_id);
      if (category) query = query.eq("category", category);
      if (status) query = query.eq("status", status);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data || []) as Customer[], count: count || 0 };
    },
    enabled: !!tenantId,
  });
}

export function useBranches() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ["branches", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("tenant_id", tenantId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
}

export function useSaveCustomer() {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (customer: Partial<Customer> & { name: string; phone: string }) => {
      if (!tenantId) throw new Error("No tenant");

      if (customer.id) {
        // Update
        const { data, error } = await supabase
          .from("customers")
          .update({
            name: customer.name,
            phone: customer.phone,
            whatsapp_same_as_phone: customer.whatsapp_same_as_phone ?? true,
            whatsapp_phone: customer.whatsapp_phone,
            email: customer.email,
            address: customer.address,
            city: customer.city,
            pincode: customer.pincode,
            area: customer.area,
            aadhaar: customer.aadhaar,
            aadhaar_verified: customer.aadhaar_verified ?? false,
            pan: customer.pan,
            photo_url: customer.photo_url,
            nominee_name: customer.nominee_name,
            nominee_relation: customer.nominee_relation,
            nominee_phone: customer.nominee_phone,
            category: customer.category || "Regular",
            status: customer.status || "active",
            branch_id: customer.branch_id,
          })
          .eq("id", customer.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Generate code via RPC
        const { data: code, error: codeErr } = await supabase.rpc("generate_customer_code", {
          p_tenant_id: tenantId,
          p_branch_id: customer.branch_id || null,
        });
        if (codeErr) throw codeErr;

        const { data, error } = await supabase
          .from("customers")
          .insert({
            tenant_id: tenantId,
            code: code as string,
            name: customer.name,
            phone: customer.phone,
            whatsapp_same_as_phone: customer.whatsapp_same_as_phone ?? true,
            whatsapp_phone: customer.whatsapp_phone,
            email: customer.email,
            address: customer.address,
            city: customer.city,
            pincode: customer.pincode,
            area: customer.area,
            aadhaar: customer.aadhaar,
            aadhaar_verified: customer.aadhaar_verified ?? false,
            pan: customer.pan,
            photo_url: customer.photo_url,
            nominee_name: customer.nominee_name,
            nominee_relation: customer.nominee_relation,
            nominee_phone: customer.nominee_phone,
            category: customer.category || "Regular",
            status: customer.status || "active",
            branch_id: customer.branch_id,
            created_by: user?.id,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export async function uploadCustomerPhoto(file: Blob, fileName: string): Promise<string> {
  const path = `photos/${Date.now()}-${fileName}`;
  const { error } = await supabase.storage
    .from("customer-photos")
    .upload(path, file, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("customer-photos").getPublicUrl(path);
  return data.publicUrl;
}
