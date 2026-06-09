-- Employees must NOT read/write financial data. Lock payments + clients to admin/manager.
-- (salary_records is already role-gated; sites/materials stay operational-visible.)

DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments FOR SELECT
  USING (get_my_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

DROP POLICY IF EXISTS payments_insert ON public.payments;
CREATE POLICY payments_insert ON public.payments FOR INSERT
  WITH CHECK (get_my_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

DROP POLICY IF EXISTS payments_update ON public.payments;
CREATE POLICY payments_update ON public.payments FOR UPDATE
  USING (get_my_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

DROP POLICY IF EXISTS clients_select ON public.clients;
CREATE POLICY clients_select ON public.clients FOR SELECT
  USING (get_my_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

DROP POLICY IF EXISTS clients_insert ON public.clients;
CREATE POLICY clients_insert ON public.clients FOR INSERT
  WITH CHECK (get_my_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

DROP POLICY IF EXISTS clients_update ON public.clients;
CREATE POLICY clients_update ON public.clients FOR UPDATE
  USING (get_my_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));
