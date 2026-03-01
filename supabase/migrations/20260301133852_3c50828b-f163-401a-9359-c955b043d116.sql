
-- Create a test tenant
INSERT INTO public.tenants (id, name, plan, is_active)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Test Company', 'premium', true)
ON CONFLICT (id) DO NOTHING;

-- Create a test branch
INSERT INTO public.branches (id, tenant_id, name, phone, address)
VALUES ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Main Branch', '9999999999', 'Test Address')
ON CONFLICT (id) DO NOTHING;
