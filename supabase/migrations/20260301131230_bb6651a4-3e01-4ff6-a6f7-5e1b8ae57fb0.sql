
-- Interest/Charge records for loans
CREATE TABLE public.interest_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  loan_id UUID NOT NULL REFERENCES public.loans(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  days INTEGER NOT NULL DEFAULT 30,
  principal NUMERIC NOT NULL DEFAULT 0,
  rate NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  penalty NUMERIC NOT NULL DEFAULT 0,
  paid NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  receipt_number TEXT,
  payment_mode TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interest_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view interest_records" ON public.interest_records FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Staff manage interest_records" ON public.interest_records FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Managers manage interest_records" ON public.interest_records FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage interest_records" ON public.interest_records FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access interest_records" ON public.interest_records FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  performed_by UUID,
  performed_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view audit_logs" ON public.audit_logs FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Staff can insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Managers manage audit_logs" ON public.audit_logs FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage audit_logs" ON public.audit_logs FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access audit_logs" ON public.audit_logs FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Indexes (skip idx_loans_tenant_status which already exists)
CREATE INDEX idx_interest_records_loan ON public.interest_records(loan_id);
CREATE INDEX idx_interest_records_tenant ON public.interest_records(tenant_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loans_customer ON public.loans(customer_id);
