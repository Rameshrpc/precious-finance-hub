
-- Table to track cron job execution history
CREATE TABLE public.cron_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  run_type text NOT NULL DEFAULT 'daily',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'running',
  charges_accrued integer NOT NULL DEFAULT 0,
  loans_updated integer NOT NULL DEFAULT 0,
  overdue_marked integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  error_details jsonb DEFAULT '[]'::jsonb,
  summary jsonb DEFAULT '{}'::jsonb,
  triggered_by text DEFAULT 'system'
);

-- Enable RLS
ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenant admins can view cron_runs"
ON public.cron_runs FOR SELECT
USING (
  (tenant_id = get_user_tenant_id(auth.uid()))
  AND (has_role(auth.uid(), 'tenant_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Super admins full access cron_runs"
ON public.cron_runs FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow edge function (service role) to insert/update via service_role key
-- The edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
