
-- =========================
-- ENUMS חדשים
-- =========================
CREATE TYPE public.payment_status AS ENUM ('pending', 'partial', 'paid');

-- =========================
-- ASSIGNMENTS — שיבוץ עובדים
-- =========================
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cost_snapshot NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, project_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view assignments" ON public.assignments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers insert assignments" ON public.assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'team_manager'));
CREATE POLICY "Managers update assignments" ON public.assignments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'team_manager'));
CREATE POLICY "Admins delete assignments" ON public.assignments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_assignments_date ON public.assignments(date);
CREATE INDEX idx_assignments_employee ON public.assignments(employee_id);
CREATE INDEX idx_assignments_project ON public.assignments(project_id);

-- =========================
-- PROJECT STAGES — שלבי פרויקט
-- =========================
CREATE TABLE public.project_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  payment_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_stages TO authenticated;
GRANT ALL ON public.project_stages TO service_role;

ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view stages" ON public.project_stages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers insert stages" ON public.project_stages
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'team_manager'));
CREATE POLICY "Managers update stages" ON public.project_stages
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'team_manager'));
CREATE POLICY "Admins delete stages" ON public.project_stages
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_project_stages_updated_at
  BEFORE UPDATE ON public.project_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- MATERIALS — חומרים
-- =========================
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view materials" ON public.materials
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers insert materials" ON public.materials
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'team_manager'));
CREATE POLICY "Managers update materials" ON public.materials
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'team_manager'));
CREATE POLICY "Admins delete materials" ON public.materials
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- PAYMENTS — תשלומים
-- =========================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.payment_status NOT NULL DEFAULT 'pending',
  payment_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view payments" ON public.payments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers insert payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'team_manager'));
CREATE POLICY "Managers update payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'team_manager'));
CREATE POLICY "Admins delete payments" ON public.payments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_payments_client ON public.payments(client_id);
CREATE INDEX idx_payments_project ON public.payments(project_id);

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- SALARIES — שכר חודשי
-- =========================
CREATE TABLE public.salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.salaries TO authenticated;
GRANT ALL ON public.salaries TO service_role;

ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view salaries" ON public.salaries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage salaries" ON public.salaries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================
-- VIEW: project_profitability
-- =========================
CREATE OR REPLACE VIEW public.project_profitability AS
SELECT
  p.id,
  p.name,
  p.client_id,
  p.total_price,
  p.materials_cost,
  p.status,
  COALESCE((
    SELECT SUM(a.cost_snapshot)
    FROM public.assignments a
    WHERE a.project_id = p.id
  ), 0) AS estimated_labor_cost,
  p.total_price
    - p.materials_cost
    - COALESCE((SELECT SUM(a.cost_snapshot) FROM public.assignments a WHERE a.project_id = p.id), 0)
  AS estimated_profit,
  COALESCE((
    SELECT SUM(pay.paid_amount)
    FROM public.payments pay
    WHERE pay.project_id = p.id
  ), 0) AS total_collected,
  p.total_price - COALESCE((
    SELECT SUM(pay.paid_amount)
    FROM public.payments pay
    WHERE pay.project_id = p.id
  ), 0) AS balance_due
FROM public.projects p;

GRANT SELECT ON public.project_profitability TO authenticated;
