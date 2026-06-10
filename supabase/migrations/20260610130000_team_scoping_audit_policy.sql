-- MIGRATION: Team scoping direct link + audit_logs policy fix
-- 1. שיוך ישיר עובד→מנהל צוות (לפועלים אין חשבון משתמש, אז הקישור דרך profiles לא מספיק)
-- 2. מדיניות audit_logs קראה מ-profiles.role — מקור האמת הוא user_roles (דרך get_my_role)

-- 1. Direct manager assignment on employees
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS managed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_managed_by ON public.employees(managed_by);

-- 2. my_employee_ids: direct link OR legacy profile link
CREATE OR REPLACE FUNCTION public.my_employee_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT e.id FROM public.employees e WHERE e.managed_by = auth.uid()
  UNION
  SELECT e.id
  FROM public.employees e
  JOIN public.profiles p ON p.id = e.user_id
  WHERE p.managed_by = auth.uid()
$function$;

-- 3. audit_logs select: user_roles is the single source of truth, not profiles.role
DROP POLICY IF EXISTS audit_logs_select_admin ON public.audit_logs;
CREATE POLICY audit_logs_select_admin ON public.audit_logs
  FOR SELECT USING (public.get_my_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));
