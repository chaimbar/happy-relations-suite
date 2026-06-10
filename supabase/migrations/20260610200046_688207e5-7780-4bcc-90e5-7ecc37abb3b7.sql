
-- 1) clients: rename name -> full_name
ALTER TABLE public.clients RENAME COLUMN name TO full_name;

-- 2) employees: rename daily_cost_estimate -> daily_cost_estimated + add fields
ALTER TABLE public.employees RENAME COLUMN daily_cost_estimate TO daily_cost_estimated;
ALTER TABLE public.employees RENAME COLUMN identifier TO id_number;
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS employment_type text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS timewatch_employee_id text,
  ADD COLUMN IF NOT EXISTS managed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 3) Rename projects -> sites; total_price -> contract_price; extend status enum
ALTER TYPE project_status RENAME TO site_status;
ALTER TYPE site_status ADD VALUE IF NOT EXISTS 'paused';
ALTER TABLE public.projects RENAME TO sites;
ALTER TABLE public.sites RENAME COLUMN total_price TO contract_price;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER INDEX IF EXISTS projects_pkey RENAME TO sites_pkey;

-- 4) site_stages
CREATE TABLE IF NOT EXISTS public.site_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name text NOT NULL,
  payment_amount numeric(12,2),
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  notes text,
  sort_order integer,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_stages TO authenticated;
GRANT ALL ON public.site_stages TO service_role;
ALTER TABLE public.site_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view site_stages" ON public.site_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage site_stages" ON public.site_stages FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "update site_stages" ON public.site_stages FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "delete site_stages" ON public.site_stages FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER tr_site_stages_updated BEFORE UPDATE ON public.site_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  date date NOT NULL,
  shift_type text NOT NULL DEFAULT 'full',
  cost_estimated numeric(10,2),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view assignments" ON public.assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage assignments" ON public.assignments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "update assignments" ON public.assignments FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "delete assignments" ON public.assignments FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE TRIGGER tr_assignments_updated BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) check_ins
CREATE TABLE IF NOT EXISTS public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  latitude numeric,
  longitude numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_ins TO authenticated;
GRANT ALL ON public.check_ins TO service_role;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view check_ins" ON public.check_ins FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert check_ins" ON public.check_ins FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update check_ins" ON public.check_ins FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "delete check_ins" ON public.check_ins FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- 7) materials
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view materials" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert materials" ON public.materials FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "update materials" ON public.materials FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "delete materials" ON public.materials FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER tr_materials_updated BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8) payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_date date NOT NULL DEFAULT (now()::date),
  payment_method text,
  reference text,
  notes text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view payments" ON public.payments FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "update payments" ON public.payments FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "delete payments" ON public.payments FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER tr_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9) salary_records
CREATE TABLE IF NOT EXISTS public.salary_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  month date NOT NULL,
  amount_actual numeric(12,2) NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_records TO authenticated;
GRANT ALL ON public.salary_records TO service_role;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view salary" ON public.salary_records FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "manage salary" ON public.salary_records FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "update salary" ON public.salary_records FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "delete salary" ON public.salary_records FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER tr_salary_updated BEFORE UPDATE ON public.salary_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10) audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view audit" ON public.audit_logs FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "insert audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 11) Views
CREATE OR REPLACE VIEW public.client_balance AS
SELECT
  c.id,
  c.full_name,
  COALESCE(SUM(s.contract_price),0)::numeric AS total_invoiced,
  COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.client_id = c.id),0)::numeric AS total_paid,
  COALESCE(SUM(s.contract_price),0)::numeric - COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.client_id = c.id),0)::numeric AS balance_due,
  COUNT(s.id)::int AS total_sites
FROM public.clients c
LEFT JOIN public.sites s ON s.client_id = c.id
GROUP BY c.id, c.full_name;
GRANT SELECT ON public.client_balance TO authenticated;

CREATE OR REPLACE VIEW public.site_profitability AS
SELECT
  s.id,
  s.name,
  s.client_id,
  s.contract_price,
  s.materials_cost,
  s.status::text AS status,
  COALESCE((SELECT SUM(a.cost_estimated) FROM public.assignments a WHERE a.site_id = s.id),0)::numeric AS labor_cost_estimated,
  COALESCE((SELECT SUM(sr.amount_actual) FROM public.salary_records sr WHERE sr.site_id = s.id),0)::numeric AS labor_cost_actual,
  (COALESCE(s.contract_price,0) - COALESCE(s.materials_cost,0) - COALESCE((SELECT SUM(a.cost_estimated) FROM public.assignments a WHERE a.site_id = s.id),0))::numeric AS profit_estimated,
  (COALESCE(s.contract_price,0) - COALESCE(s.materials_cost,0) - COALESCE((SELECT SUM(sr.amount_actual) FROM public.salary_records sr WHERE sr.site_id = s.id),0))::numeric AS profit_actual,
  (COALESCE((SELECT SUM(sr.amount_actual) FROM public.salary_records sr WHERE sr.site_id = s.id),0) - COALESCE((SELECT SUM(a.cost_estimated) FROM public.assignments a WHERE a.site_id = s.id),0))::numeric AS cost_variance
FROM public.sites s;
GRANT SELECT ON public.site_profitability TO authenticated;
