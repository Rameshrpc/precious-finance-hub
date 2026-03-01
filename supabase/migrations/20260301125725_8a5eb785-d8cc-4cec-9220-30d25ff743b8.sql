
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  holiday_date DATE NOT NULL,
  name TEXT NOT NULL,
  holiday_type TEXT NOT NULL DEFAULT 'custom' CHECK (holiday_type IN ('national', 'state', 'custom')),
  branch_id UUID REFERENCES public.branches(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view holidays" ON public.holidays FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins manage holidays" ON public.holidays FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access holidays" ON public.holidays FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Managers manage holidays" ON public.holidays FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE INDEX idx_holidays_tenant_date ON public.holidays(tenant_id, holiday_date);
