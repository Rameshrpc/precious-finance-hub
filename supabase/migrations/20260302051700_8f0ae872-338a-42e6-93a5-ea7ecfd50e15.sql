
-- tenants: add multi-product columns
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS enabled_products TEXT DEFAULT 'GL';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS default_product TEXT DEFAULT 'GL';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS enable_silver BOOLEAN DEFAULT false;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS settings_json JSONB DEFAULT '{}';

-- loans: add missing columns (product_type already exists)
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS metal_composition TEXT DEFAULT 'gold';
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS total_gold_value DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS total_silver_value DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS ltv_ratio DECIMAL(5,2);
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS buyback_expiry_date DATE;

-- pledge_items: rate_at_creation (metal_type already exists)
ALTER TABLE public.pledge_items ADD COLUMN IF NOT EXISTS rate_at_creation DECIMAL(10,2);

-- RLS helper: get_enabled_products (uses profiles, not users)
CREATE OR REPLACE FUNCTION public.get_enabled_products()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.enabled_products
  FROM public.tenants t
  JOIN public.profiles p ON p.tenant_id = t.id
  WHERE p.id = auth.uid()
$$;
