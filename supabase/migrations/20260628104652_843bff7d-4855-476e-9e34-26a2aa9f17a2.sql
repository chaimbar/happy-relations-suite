
-- 1. assignments SELECT: restrict cost_estimated to admin/manager
DROP POLICY IF EXISTS "view assignments" ON public.assignments;
CREATE POLICY "view assignments" ON public.assignments FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'team_manager'::app_role)
  OR employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

-- 2. sites SELECT: restrict contract_price/materials_cost to admin/manager
DROP POLICY IF EXISTS "Authenticated view projects" ON public.sites;
CREATE POLICY "Managers view projects" ON public.sites FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'team_manager'::app_role)
);

-- 3. audit_logs INSERT: restrict to admin/manager
DROP POLICY IF EXISTS "insert audit" ON public.audit_logs;
CREATE POLICY "insert audit" ON public.audit_logs FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'team_manager'::app_role)
  )
);

-- 4. check_ins INSERT: restrict direct table inserts to admin/manager
-- (employees use submit_checkin SECURITY DEFINER RPC for self-checkin)
DROP POLICY IF EXISTS "insert check_ins" ON public.check_ins;
CREATE POLICY "insert check_ins" ON public.check_ins FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'team_manager'::app_role)
);

-- 5. SECURITY DEFINER functions: revoke EXECUTE from anon/authenticated
-- where not needed; keep grants only for public-facing QR check-in flow.
REVOKE EXECUTE ON FUNCTION public.get_all_users_for_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
