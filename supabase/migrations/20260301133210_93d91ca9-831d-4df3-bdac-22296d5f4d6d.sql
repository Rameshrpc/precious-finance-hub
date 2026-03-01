
-- Repledges table (bank-level repledge tracking)
CREATE TABLE public.repledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  packet_id uuid NOT NULL REFERENCES vault_packets(id),
  bank_partner_id uuid REFERENCES bank_partners(id),
  bank_name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  maturity_date date,
  status text NOT NULL DEFAULT 'active', -- active, closed
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.repledges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view repledges" ON public.repledges FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Managers manage repledges" ON public.repledges FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage repledges" ON public.repledges FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access repledges" ON public.repledges FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Repledge payments
CREATE TABLE public.repledge_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  repledge_id uuid NOT NULL REFERENCES repledges(id),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL DEFAULT 0,
  payment_type text NOT NULL DEFAULT 'interest', -- interest, principal, partial_release
  payment_mode text NOT NULL DEFAULT 'cash',
  reference text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.repledge_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view repledge_payments" ON public.repledge_payments FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Managers manage repledge_payments" ON public.repledge_payments FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage repledge_payments" ON public.repledge_payments FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access repledge_payments" ON public.repledge_payments FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Balance transfers
CREATE TABLE public.balance_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  new_loan_id uuid REFERENCES loans(id),
  from_lender text NOT NULL,
  original_amount numeric NOT NULL DEFAULT 0,
  transfer_amount numeric NOT NULL DEFAULT 0,
  documents jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending, completed
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.balance_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view balance_transfers" ON public.balance_transfers FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Staff manage balance_transfers" ON public.balance_transfers FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Managers manage balance_transfers" ON public.balance_transfers FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage balance_transfers" ON public.balance_transfers FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access balance_transfers" ON public.balance_transfers FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Chart of accounts
CREATE TABLE public.chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  code text NOT NULL,
  name text NOT NULL,
  account_type text NOT NULL DEFAULT 'asset', -- asset, liability, income, expense, equity
  parent_id uuid REFERENCES chart_of_accounts(id),
  product_type text, -- GL, PO, SA or null for all
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view chart_of_accounts" ON public.chart_of_accounts FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Managers manage chart_of_accounts" ON public.chart_of_accounts FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage chart_of_accounts" ON public.chart_of_accounts FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access chart_of_accounts" ON public.chart_of_accounts FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_repledges_tenant ON public.repledges(tenant_id);
CREATE INDEX idx_repledges_packet ON public.repledges(packet_id);
CREATE INDEX idx_repledge_payments_repledge ON public.repledge_payments(repledge_id);
CREATE INDEX idx_balance_transfers_tenant ON public.balance_transfers(tenant_id);
CREATE INDEX idx_chart_of_accounts_tenant ON public.chart_of_accounts(tenant_id);
CREATE INDEX idx_chart_of_accounts_type ON public.chart_of_accounts(account_type);
