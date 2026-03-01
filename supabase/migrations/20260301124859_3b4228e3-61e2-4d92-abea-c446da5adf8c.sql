
-- Create handle_updated_at function first
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_same_as_phone BOOLEAN NOT NULL DEFAULT true,
  whatsapp_phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  pincode TEXT,
  area TEXT,
  aadhaar TEXT,
  aadhaar_verified BOOLEAN NOT NULL DEFAULT false,
  pan TEXT,
  photo_url TEXT,
  nominee_name TEXT,
  nominee_relation TEXT,
  nominee_phone TEXT,
  category TEXT NOT NULL DEFAULT 'Regular' CHECK (category IN ('Regular', 'VIP', 'Corporate')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_customers_tenant ON public.customers(tenant_id);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_code ON public.customers(code);
CREATE INDEX idx_customers_branch ON public.customers(branch_id);

-- Updated_at trigger
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- RLS policies
CREATE POLICY "Super admins full access to customers"
ON public.customers FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant members can view own tenant customers"
ON public.customers FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can manage customers"
ON public.customers FOR ALL
USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'tenant_admin'))
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'tenant_admin'));

CREATE POLICY "Managers can manage customers in tenant"
ON public.customers FOR ALL
USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'manager'))
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff can insert customers"
ON public.customers FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can update customers"
ON public.customers FOR UPDATE
USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'staff'))
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'staff'));

-- Customer code sequence function
CREATE OR REPLACE FUNCTION public.generate_customer_code(p_tenant_id UUID, p_branch_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  branch_code TEXT;
  seq_num INT;
  new_code TEXT;
BEGIN
  SELECT UPPER(LEFT(name, 3)) INTO branch_code
  FROM public.branches WHERE id = p_branch_id;
  IF branch_code IS NULL THEN
    branch_code := 'GEN';
  END IF;
  SELECT COALESCE(MAX(
    CASE 
      WHEN code ~ ('^' || branch_code || '[0-9]+$') 
      THEN CAST(SUBSTRING(code FROM LENGTH(branch_code) + 1) AS INT)
      ELSE 0 
    END
  ), 0) + 1 INTO seq_num
  FROM public.customers
  WHERE tenant_id = p_tenant_id;
  new_code := branch_code || LPAD(seq_num::TEXT, 5, '0');
  RETURN new_code;
END;
$$;

-- Storage bucket for customer photos
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-photos', 'customer-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload customer photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'customer-photos');

CREATE POLICY "Anyone can view customer photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'customer-photos');

CREATE POLICY "Authenticated users can update customer photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'customer-photos');

CREATE POLICY "Authenticated users can delete customer photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'customer-photos');
