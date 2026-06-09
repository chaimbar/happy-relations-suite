-- Security hardening: fix SECURITY DEFINER views + pin function search_path + revoke anon execute
ALTER VIEW public.client_balance SET (security_invoker = on);
ALTER VIEW public.today_assignments SET (security_invoker = on);
ALTER VIEW public.salary_site_allocation SET (security_invoker = on);
ALTER VIEW public.site_profitability SET (security_invoker = on);

ALTER FUNCTION public.handle_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_assignment_cost() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_all_users_for_admin() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.get_all_users_for_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_employee_checkin_info(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_employee_ids() FROM anon;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_to_audit() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_payment() FROM anon, authenticated;
