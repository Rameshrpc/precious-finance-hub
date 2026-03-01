
-- 1. Item Groups
CREATE TABLE public.item_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  metal_type TEXT NOT NULL DEFAULT 'gold' CHECK (metal_type IN ('gold', 'silver')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.item_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view item_groups" ON public.item_groups FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins manage item_groups" ON public.item_groups FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access item_groups" ON public.item_groups FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- 2. Items
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  item_group_id UUID NOT NULL REFERENCES public.item_groups(id),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view items" ON public.items FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins manage items" ON public.items FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access items" ON public.items FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- 3. Purities
CREATE TABLE public.purities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  metal_type TEXT NOT NULL DEFAULT 'gold' CHECK (metal_type IN ('gold', 'silver')),
  percentage NUMERIC(6,3) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view purities" ON public.purities FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins manage purities" ON public.purities FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access purities" ON public.purities FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- 4. Loan Schemes
CREATE TABLE public.loan_schemes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  product_type TEXT NOT NULL CHECK (product_type IN ('GL', 'PO', 'SA')),
  name TEXT NOT NULL,
  rate NUMERIC(6,2) NOT NULL,
  interest_type TEXT NOT NULL DEFAULT 'monthly' CHECK (interest_type IN ('monthly', 'daily', 'flat')),
  tenure_months INT NOT NULL DEFAULT 12,
  overdue_rate NUMERIC(6,2) NOT NULL DEFAULT 0,
  grace_period_days INT NOT NULL DEFAULT 0,
  charge_label TEXT NOT NULL DEFAULT 'Interest',
  allowed_metals TEXT[] NOT NULL DEFAULT '{gold}',
  gold_ltv_cap NUMERIC(5,2) NOT NULL DEFAULT 75,
  silver_ltv_cap NUMERIC(5,2) NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_schemes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view loan_schemes" ON public.loan_schemes FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins manage loan_schemes" ON public.loan_schemes FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access loan_schemes" ON public.loan_schemes FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE TRIGGER update_loan_schemes_updated_at BEFORE UPDATE ON public.loan_schemes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Areas
CREATE TABLE public.areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view areas" ON public.areas FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins manage areas" ON public.areas FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access areas" ON public.areas FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- 6. Agents
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  branch_id UUID REFERENCES public.branches(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view agents" ON public.agents FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins manage agents" ON public.agents FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access agents" ON public.agents FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- 7. Bank/NBFC partners
CREATE TABLE public.bank_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  account_number TEXT,
  ifsc TEXT,
  credit_limit NUMERIC(14,2) NOT NULL DEFAULT 0,
  rate NUMERIC(6,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view bank_partners" ON public.bank_partners FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins manage bank_partners" ON public.bank_partners FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access bank_partners" ON public.bank_partners FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- 8. Market Rates (upsert on tenant+date)
CREATE TABLE public.market_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gold_22k NUMERIC(10,2) NOT NULL DEFAULT 0,
  gold_24k NUMERIC(10,2) NOT NULL DEFAULT 0,
  silver_per_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, rate_date)
);
ALTER TABLE public.market_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view market_rates" ON public.market_rates FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins manage market_rates" ON public.market_rates FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access market_rates" ON public.market_rates FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE TRIGGER update_market_rates_updated_at BEFORE UPDATE ON public.market_rates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Managers can also manage masters
CREATE POLICY "Managers manage item_groups" ON public.item_groups FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers manage items" ON public.items FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers manage purities" ON public.purities FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers manage loan_schemes" ON public.loan_schemes FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers manage areas" ON public.areas FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers manage agents" ON public.agents FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers manage bank_partners" ON public.bank_partners FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers manage market_rates" ON public.market_rates FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
