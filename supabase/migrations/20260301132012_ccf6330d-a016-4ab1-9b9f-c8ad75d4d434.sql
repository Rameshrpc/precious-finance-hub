
-- Re-loans linking table
CREATE TABLE public.re_loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  old_loan_id UUID NOT NULL REFERENCES public.loans(id),
  new_loan_id UUID NOT NULL REFERENCES public.loans(id),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.re_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view re_loans" ON public.re_loans FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Staff manage re_loans" ON public.re_loans FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Managers manage re_loans" ON public.re_loans FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage re_loans" ON public.re_loans FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access re_loans" ON public.re_loans FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Margin renewals for SA
CREATE TABLE public.margin_renewals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  loan_id UUID NOT NULL REFERENCES public.loans(id),
  margin_amount NUMERIC NOT NULL DEFAULT 0,
  new_scheme_id UUID REFERENCES public.loan_schemes(id),
  old_expiry DATE,
  new_expiry DATE NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'cash',
  payment_reference TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.margin_renewals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view margin_renewals" ON public.margin_renewals FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Staff manage margin_renewals" ON public.margin_renewals FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Managers manage margin_renewals" ON public.margin_renewals FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage margin_renewals" ON public.margin_renewals FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access margin_renewals" ON public.margin_renewals FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Vault packets
CREATE TABLE public.vault_packets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  branch_id UUID REFERENCES public.branches(id),
  packet_number TEXT NOT NULL,
  slot_id UUID,
  gold_weight NUMERIC NOT NULL DEFAULT 0,
  silver_weight NUMERIC NOT NULL DEFAULT 0,
  total_principal NUMERIC NOT NULL DEFAULT 0,
  loans_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.vault_packets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view vault_packets" ON public.vault_packets FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Staff manage vault_packets" ON public.vault_packets FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Managers manage vault_packets" ON public.vault_packets FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage vault_packets" ON public.vault_packets FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access vault_packets" ON public.vault_packets FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Vault packet loans junction
CREATE TABLE public.vault_packet_loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  packet_id UUID NOT NULL REFERENCES public.vault_packets(id) ON DELETE CASCADE,
  loan_id UUID NOT NULL REFERENCES public.loans(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.vault_packet_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inherit vault_packets access" ON public.vault_packet_loans FOR ALL USING (
  EXISTS (SELECT 1 FROM public.vault_packets vp WHERE vp.id = packet_id AND vp.tenant_id = get_user_tenant_id(auth.uid()))
);

-- Vault slots
CREATE TABLE public.vault_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  branch_id UUID REFERENCES public.branches(id),
  slot_name TEXT NOT NULL,
  slot_size TEXT NOT NULL DEFAULT 'M',
  is_occupied BOOLEAN NOT NULL DEFAULT false,
  packet_id UUID REFERENCES public.vault_packets(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.vault_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view vault_slots" ON public.vault_slots FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Staff manage vault_slots" ON public.vault_slots FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Managers manage vault_slots" ON public.vault_slots FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant admins manage vault_slots" ON public.vault_slots FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Super admins full access vault_slots" ON public.vault_slots FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add packet_id to pledge_items for vault tracking
ALTER TABLE public.pledge_items ADD COLUMN IF NOT EXISTS packet_id UUID REFERENCES public.vault_packets(id);

-- Indexes
CREATE INDEX idx_re_loans_old ON public.re_loans(old_loan_id);
CREATE INDEX idx_re_loans_new ON public.re_loans(new_loan_id);
CREATE INDEX idx_margin_renewals_loan ON public.margin_renewals(loan_id);
CREATE INDEX idx_vault_packets_tenant ON public.vault_packets(tenant_id);
CREATE INDEX idx_vault_packet_loans_packet ON public.vault_packet_loans(packet_id);
CREATE INDEX idx_vault_slots_tenant ON public.vault_slots(tenant_id);
