
-- Loan Applications table for LOS pipeline
CREATE TABLE public.loan_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  branch_id UUID REFERENCES public.branches(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  application_number TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('GL', 'PO', 'SA')),
  purpose TEXT,
  amount_requested NUMERIC(14,2) NOT NULL DEFAULT 0,
  estimated_gold_weight NUMERIC(10,3),
  stage TEXT NOT NULL DEFAULT 'applied' CHECK (stage IN ('applied', 'docs_collected', 'valued', 'checked', 'approved', 'disbursed', 'rejected')),
  assigned_to UUID,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Tenant members can view loan_applications" ON public.loan_applications
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins manage loan_applications" ON public.loan_applications
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));

CREATE POLICY "Super admins full access loan_applications" ON public.loan_applications
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers manage loan_applications" ON public.loan_applications
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Staff can create and update loan_applications" ON public.loan_applications
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));

-- Auto-generate application number
CREATE OR REPLACE FUNCTION public.generate_application_number(p_tenant_id uuid)
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
      WHEN application_number ~ '^APP[0-9]+$'
      THEN CAST(SUBSTRING(application_number FROM 4) AS INT)
      ELSE 0
    END
  ), 0) + 1 INTO seq_num
  FROM public.loan_applications
  WHERE tenant_id = p_tenant_id;

  new_number := 'APP' || LPAD(seq_num::TEXT, 6, '0');
  RETURN new_number;
END;
$$;

-- Updated_at trigger
CREATE TRIGGER update_loan_applications_updated_at
  BEFORE UPDATE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_loan_applications_tenant_stage ON public.loan_applications(tenant_id, stage);
CREATE INDEX idx_loan_applications_customer ON public.loan_applications(customer_id);

-- Storage bucket for LOS documents
INSERT INTO storage.buckets (id, name, public) VALUES ('los-documents', 'los-documents', false);

CREATE POLICY "Authenticated users can upload los docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'los-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view los docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'los-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update los docs"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'los-documents' AND auth.role() = 'authenticated');
