
-- Loans table
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  branch_id UUID REFERENCES public.branches(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  loan_application_id UUID REFERENCES public.loan_applications(id),
  agent_id UUID REFERENCES public.agents(id),
  loan_number TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('GL', 'PO', 'SA')),
  scheme_id UUID REFERENCES public.loan_schemes(id),
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  rate NUMERIC(6,2) NOT NULL DEFAULT 0,
  tenure_months INT NOT NULL DEFAULT 12,
  maturity_date DATE,
  gold_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  silver_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_pledge_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  gold_ltv NUMERIC(5,2) NOT NULL DEFAULT 0,
  silver_ltv NUMERIC(5,2) NOT NULL DEFAULT 0,
  overall_ltv NUMERIC(5,2) NOT NULL DEFAULT 0,
  disbursement_mode TEXT NOT NULL DEFAULT 'cash' CHECK (disbursement_mode IN ('cash', 'bank', 'upi', 'cheque')),
  disbursement_bank_name TEXT,
  disbursement_account TEXT,
  disbursement_ifsc TEXT,
  disbursement_upi_id TEXT,
  disbursement_cheque_no TEXT,
  purpose TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'overdue', 'npa', 'cancelled')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view loans" ON public.loans FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins manage loans" ON public.loans FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access loans" ON public.loans FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Managers manage loans" ON public.loans FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Staff can create and update loans" ON public.loans FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE INDEX idx_loans_tenant_status ON public.loans(tenant_id, status);
CREATE INDEX idx_loans_customer ON public.loans(customer_id);

-- Pledge Items table
CREATE TABLE public.pledge_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  item_id UUID REFERENCES public.items(id),
  item_name TEXT NOT NULL,
  metal_type TEXT NOT NULL DEFAULT 'gold' CHECK (metal_type IN ('gold', 'silver')),
  purity_id UUID REFERENCES public.purities(id),
  purity_name TEXT,
  purity_percentage NUMERIC(6,3) NOT NULL DEFAULT 91.6,
  description TEXT,
  gross_weight NUMERIC(10,3) NOT NULL DEFAULT 0,
  deduction NUMERIC(10,3) NOT NULL DEFAULT 0,
  net_weight NUMERIC(10,3) NOT NULL DEFAULT 0,
  rate_per_gram NUMERIC(10,2) NOT NULL DEFAULT 0,
  value NUMERIC(14,2) NOT NULL DEFAULT 0,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pledge_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view pledge_items" ON public.pledge_items FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins manage pledge_items" ON public.pledge_items FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access pledge_items" ON public.pledge_items FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Managers manage pledge_items" ON public.pledge_items FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Staff manage pledge_items" ON public.pledge_items FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));

CREATE INDEX idx_pledge_items_loan ON public.pledge_items(loan_id);

-- Generate next loan number
CREATE OR REPLACE FUNCTION public.generate_next_number(p_tenant_id uuid, p_prefix text)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_num INT;
  new_number TEXT;
BEGIN
  SELECT COALESCE(MAX(
    CASE
      WHEN loan_number ~ ('^' || p_prefix || '[0-9]+$')
      THEN CAST(SUBSTRING(loan_number FROM LENGTH(p_prefix) + 1) AS INT)
      ELSE 0
    END
  ), 0) + 1 INTO seq_num
  FROM public.loans
  WHERE tenant_id = p_tenant_id;
  new_number := p_prefix || LPAD(seq_num::TEXT, 6, '0');
  RETURN new_number;
END;
$$;
