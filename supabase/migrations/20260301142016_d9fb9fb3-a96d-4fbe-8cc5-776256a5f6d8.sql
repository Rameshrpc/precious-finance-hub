
-- Grievance tickets table
CREATE TABLE public.grievances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  customer_id UUID REFERENCES public.customers(id),
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID,
  escalation_level TEXT NOT NULL DEFAULT 'L1',
  sla_ack_at TIMESTAMPTZ,
  sla_resolve_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view grievances" ON public.grievances FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Staff manage grievances" ON public.grievances FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Managers manage grievances" ON public.grievances FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage grievances" ON public.grievances FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access grievances" ON public.grievances FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Cash register table
CREATE TABLE public.cash_register (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  branch_id UUID REFERENCES public.branches(id),
  register_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  total_inflows NUMERIC NOT NULL DEFAULT 0,
  total_outflows NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC NOT NULL DEFAULT 0,
  physical_count NUMERIC,
  discrepancy NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  verified_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, branch_id, register_date)
);

ALTER TABLE public.cash_register ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view cash_register" ON public.cash_register FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Staff manage cash_register" ON public.cash_register FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Managers manage cash_register" ON public.cash_register FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage cash_register" ON public.cash_register FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access cash_register" ON public.cash_register FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- API Keys table
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{read}',
  rate_limit INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins manage api_keys" ON public.api_keys FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access api_keys" ON public.api_keys FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
