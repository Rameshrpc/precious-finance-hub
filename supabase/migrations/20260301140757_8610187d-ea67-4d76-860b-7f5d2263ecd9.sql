
-- NPA Classifications table
CREATE TABLE public.npa_classifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  loan_id uuid NOT NULL REFERENCES public.loans(id),
  classification text NOT NULL DEFAULT 'standard',
  previous_classification text,
  dpd integer NOT NULL DEFAULT 0,
  provision_rate numeric NOT NULL DEFAULT 0,
  provision_amount numeric NOT NULL DEFAULT 0,
  classified_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.npa_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access npa_classifications" ON public.npa_classifications FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Tenant admins manage npa_classifications" ON public.npa_classifications FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Managers manage npa_classifications" ON public.npa_classifications FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant members can view npa_classifications" ON public.npa_classifications FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Collection Tasks table
CREATE TABLE public.collection_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  loan_id uuid NOT NULL REFERENCES public.loans(id),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  task_type text NOT NULL DEFAULT 'call',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  dpd integer NOT NULL DEFAULT 0,
  notes text,
  ptp_date date,
  ptp_amount numeric DEFAULT 0,
  disposition text,
  next_followup date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.collection_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access collection_tasks" ON public.collection_tasks FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Tenant admins manage collection_tasks" ON public.collection_tasks FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Managers manage collection_tasks" ON public.collection_tasks FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Staff manage collection_tasks" ON public.collection_tasks FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Tenant members can view collection_tasks" ON public.collection_tasks FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Notification Log table  
CREATE TABLE public.notification_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  customer_id uuid REFERENCES public.customers(id),
  loan_id uuid REFERENCES public.loans(id),
  channel text NOT NULL DEFAULT 'sms',
  template text,
  message text,
  status text NOT NULL DEFAULT 'queued',
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access notification_log" ON public.notification_log FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Tenant admins manage notification_log" ON public.notification_log FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Managers manage notification_log" ON public.notification_log FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Staff manage notification_log" ON public.notification_log FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Tenant members can view notification_log" ON public.notification_log FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Scheduled Reports table
CREATE TABLE public.scheduled_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  report_type text NOT NULL,
  frequency text NOT NULL DEFAULT 'daily',
  recipients text[] NOT NULL DEFAULT '{}',
  format text NOT NULL DEFAULT 'pdf',
  filters jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_run_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access scheduled_reports" ON public.scheduled_reports FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Tenant admins manage scheduled_reports" ON public.scheduled_reports FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Managers manage scheduled_reports" ON public.scheduled_reports FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Tenant members can view scheduled_reports" ON public.scheduled_reports FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Collection task interactions table
CREATE TABLE public.collection_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  task_id uuid NOT NULL REFERENCES public.collection_tasks(id),
  loan_id uuid NOT NULL REFERENCES public.loans(id),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  interaction_type text NOT NULL DEFAULT 'call',
  disposition text,
  ptp_date date,
  ptp_amount numeric DEFAULT 0,
  notes text,
  next_followup date,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.collection_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access collection_interactions" ON public.collection_interactions FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Tenant admins manage collection_interactions" ON public.collection_interactions FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));
CREATE POLICY "Managers manage collection_interactions" ON public.collection_interactions FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Staff manage collection_interactions" ON public.collection_interactions FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Tenant members can view collection_interactions" ON public.collection_interactions FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
