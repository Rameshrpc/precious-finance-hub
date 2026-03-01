import { supabase } from "@/integrations/supabase/client";

/**
 * Reveal a masked value for 10 seconds, logging access to audit_logs
 */
export async function revealSensitiveField(
  entityType: string,
  entityId: string,
  fieldName: string,
  tenantId: string,
  userId?: string,
  userName?: string
): Promise<void> {
  await supabase.from("audit_logs").insert({
    tenant_id: tenantId,
    entity_type: entityType,
    entity_id: entityId,
    action: `reveal_${fieldName}`,
    performed_by: userId,
    performed_by_name: userName,
    details: { field: fieldName, revealed_at: new Date().toISOString() },
  });
}
