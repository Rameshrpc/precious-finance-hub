
-- Approval requests table for maker-checker workflow
CREATE TABLE public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  request_type text NOT NULL, -- new_loan, gold_release, charge_waiver, scheme_change, forfeiture
  entity_type text NOT NULL DEFAULT 'loan',
  entity_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  details jsonb DEFAULT '{}'::jsonb,
  requested_by uuid REFERENCES auth.users(id),
  requested_by_name text,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_by_name text,
  review_comment text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view approval_requests" ON public.approval_requests FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Staff manage approval_requests" ON public.approval_requests FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Managers manage approval_requests" ON public.approval_requests FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage approval_requests" ON public.approval_requests FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access approval_requests" ON public.approval_requests FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_approval_requests_tenant ON public.approval_requests(tenant_id);
CREATE INDEX idx_approval_requests_status ON public.approval_requests(status);

-- Forfeitures table
CREATE TABLE public.forfeitures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  loan_id uuid NOT NULL REFERENCES loans(id),
  forfeiture_date timestamptz,
  status text NOT NULL DEFAULT 'forfeited', -- forfeited, sold
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.forfeitures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view forfeitures" ON public.forfeitures FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Managers manage forfeitures" ON public.forfeitures FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage forfeitures" ON public.forfeitures FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access forfeitures" ON public.forfeitures FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Forfeiture sales table
CREATE TABLE public.forfeiture_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  forfeiture_id uuid NOT NULL REFERENCES forfeitures(id),
  loan_id uuid NOT NULL REFERENCES loans(id),
  sale_price numeric NOT NULL DEFAULT 0,
  buyer_name text,
  buyer_phone text,
  principal numeric NOT NULL DEFAULT 0,
  profit_loss numeric NOT NULL DEFAULT 0,
  sold_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.forfeiture_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view forfeiture_sales" ON public.forfeiture_sales FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Managers manage forfeiture_sales" ON public.forfeiture_sales FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage forfeiture_sales" ON public.forfeiture_sales FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access forfeiture_sales" ON public.forfeiture_sales FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Auctions table
CREATE TABLE public.auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  loan_id uuid NOT NULL REFERENCES loans(id),
  reserve_price numeric NOT NULL DEFAULT 0,
  auction_date date,
  notice_sent_at timestamptz,
  sale_price numeric,
  buyer_name text,
  buyer_phone text,
  surplus_deficit numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'eligible', -- eligible, scheduled, completed
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view auctions" ON public.auctions FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Managers manage auctions" ON public.auctions FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage auctions" ON public.auctions FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access auctions" ON public.auctions FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_auctions_tenant ON public.auctions(tenant_id);
CREATE INDEX idx_auctions_status ON public.auctions(status);
CREATE INDEX idx_forfeitures_tenant ON public.forfeitures(tenant_id);
CREATE INDEX idx_forfeiture_sales_tenant ON public.forfeiture_sales(tenant_id);
