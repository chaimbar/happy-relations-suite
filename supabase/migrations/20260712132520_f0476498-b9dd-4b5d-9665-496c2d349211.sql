
-- Scope INSERT policies to authenticated only
DROP POLICY IF EXISTS "insert audit" ON public.audit_logs;
CREATE POLICY "insert audit" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager') OR has_role(auth.uid(),'employee')));

DROP POLICY IF EXISTS "insert check_ins" ON public.check_ins;
CREATE POLICY "insert check_ins" ON public.check_ins
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager') OR has_role(auth.uid(),'employee'));

-- Tighten SECURITY DEFINER function execute grants
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_all_users_for_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.backup_to_goyxe() FROM PUBLIC, anon, authenticated;
