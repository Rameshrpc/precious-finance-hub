
-- Add is_released to pledge_items
ALTER TABLE public.pledge_items ADD COLUMN IF NOT EXISTS is_released BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.pledge_items ADD COLUMN IF NOT EXISTS released_at TIMESTAMP WITH TIME ZONE;

-- Redemptions/Closures table
CREATE TABLE public.redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  loan_id UUID NOT NULL REFERENCES public.loans(id),
  redemption_number TEXT NOT NULL,
  principal NUMERIC NOT NULL DEFAULT 0,
  unpaid_charges NUMERIC NOT NULL DEFAULT 0,
  penalty NUMERIC NOT NULL DEFAULT 0,
  other_charges NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'cash',
  payment_reference TEXT,
  items_released JSONB DEFAULT '[]'::jsonb,
  partial_release BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view redemptions" ON public.redemptions FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Staff manage redemptions" ON public.redemptions FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Managers manage redemptions" ON public.redemptions FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage redemptions" ON public.redemptions FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access redemptions" ON public.redemptions FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Voucher lines for accounting
CREATE TABLE public.voucher_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  voucher_type TEXT NOT NULL,
  voucher_number TEXT,
  loan_id UUID REFERENCES public.loans(id),
  entity_type TEXT,
  entity_id UUID,
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  narration TEXT,
  voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.voucher_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view voucher_lines" ON public.voucher_lines FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Staff manage voucher_lines" ON public.voucher_lines FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Managers manage voucher_lines" ON public.voucher_lines FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage voucher_lines" ON public.voucher_lines FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access voucher_lines" ON public.voucher_lines FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_redemptions_loan ON public.redemptions(loan_id);
CREATE INDEX idx_voucher_lines_loan ON public.voucher_lines(loan_id);
