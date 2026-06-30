
-- 1. assignments: SELECT to authenticated only
DROP POLICY IF EXISTS "view assignments" ON public.assignments;
CREATE POLICY "view assignments" ON public.assignments FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager')
  OR employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

-- 2. sites: SELECT to authenticated only
DROP POLICY IF EXISTS "Managers view projects" ON public.sites;
CREATE POLICY "Managers view projects" ON public.sites FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));

-- 3. check_ins: only admin/manager or own check-ins
DROP POLICY IF EXISTS "view check_ins" ON public.check_ins;
CREATE POLICY "view check_ins" ON public.check_ins FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager')
  OR employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

-- 4. materials: financial data → admin/manager only
DROP POLICY IF EXISTS "view materials" ON public.materials;
CREATE POLICY "view materials" ON public.materials FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));

-- 5. site_stages: financial data → admin/manager only
DROP POLICY IF EXISTS "view site_stages" ON public.site_stages;
CREATE POLICY "view site_stages" ON public.site_stages FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));

-- 6. employees: allow regular employees to see own record
CREATE POLICY "Employees view own record" ON public.employees FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 7. Fix search_path on backup_to_goyxe
ALTER FUNCTION public.backup_to_goyxe() SET search_path = public;

-- 8. Revoke broad EXECUTE on SECURITY DEFINER functions; grant minimally
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_all_users_for_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_employee_checkin_info(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_employee_checkin_info(uuid) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.submit_checkin(uuid, numeric, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_checkin(uuid, numeric, numeric) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.backup_to_goyxe() FROM PUBLIC, anon, authenticated;
