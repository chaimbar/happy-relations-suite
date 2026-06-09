
-- Tighten clients SELECT to admin/manager only
DROP POLICY IF EXISTS "Authenticated view clients" ON public.clients;
CREATE POLICY "Managers view clients" ON public.clients
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'team_manager'::app_role));

-- Tighten employees SELECT to admin/manager only
DROP POLICY IF EXISTS "Authenticated view employees" ON public.employees;
CREATE POLICY "Managers view employees" ON public.employees
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'team_manager'::app_role));

-- Block privilege escalation: explicitly forbid non-admin INSERT/UPDATE/DELETE on user_roles
CREATE POLICY "Only admins can modify roles - insert" ON public.user_roles
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can modify roles - update" ON public.user_roles
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can modify roles - delete" ON public.user_roles
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
