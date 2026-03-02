
-- metal_types: reference table for gold/silver
CREATE TABLE IF NOT EXISTS public.metal_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT,
  rate_unit TEXT,
  default_ltv_cap DECIMAL(5,2),
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.metal_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view metal_types"
  ON public.metal_types FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins manage metal_types"
  ON public.metal_types FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

INSERT INTO public.metal_types (code, name, symbol, rate_unit, default_ltv_cap, display_order)
VALUES
  ('gold', 'Gold', 'G', 'per gram', 75.00, 1),
  ('silver', 'Silver', 'S', 'per gram', 55.00, 2)
ON CONFLICT (code) DO NOTHING;

-- voucher_series: tracks auto-numbering per product/type
CREATE TABLE IF NOT EXISTS public.voucher_series (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  product_type TEXT,
  type TEXT NOT NULL,
  prefix TEXT NOT NULL,
  current_number INTEGER DEFAULT 0,
  financial_year TEXT DEFAULT '2025-26',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.voucher_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins manage voucher_series"
  ON public.voucher_series FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));

CREATE POLICY "Managers manage voucher_series"
  ON public.voucher_series FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Super admins full access voucher_series"
  ON public.voucher_series FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant members can view voucher_series"
  ON public.voucher_series FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- vouchers: journal/payment/receipt vouchers
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  voucher_no TEXT,
  date DATE DEFAULT CURRENT_DATE,
  type TEXT DEFAULT 'journal',
  narration TEXT,
  product_type TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins manage vouchers"
  ON public.vouchers FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));

CREATE POLICY "Managers manage vouchers"
  ON public.vouchers FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Staff manage vouchers"
  ON public.vouchers FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Super admins full access vouchers"
  ON public.vouchers FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant members can view vouchers"
  ON public.vouchers FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Add tenant_id-scoped FK to voucher_lines if missing
-- voucher_lines already exists but references vouchers - update its voucher_id FK
-- Actually voucher_lines already has voucher_id referencing vouchers, so we just need vouchers to exist.
