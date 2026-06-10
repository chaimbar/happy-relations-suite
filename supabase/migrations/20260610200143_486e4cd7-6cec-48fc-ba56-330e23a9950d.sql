
-- Add user_id columns
ALTER TABLE public.clients        ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.assignments    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.site_stages    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.salary_records ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add cancelled status
ALTER TYPE site_status ADD VALUE IF NOT EXISTS 'cancelled';

-- pricing_scenarios
CREATE TABLE IF NOT EXISTS public.pricing_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  input_mode text NOT NULL,
  inputs jsonb,
  estimated_labor_cost numeric(12,2) NOT NULL DEFAULT 0,
  estimated_materials_cost numeric(12,2) NOT NULL DEFAULT 0,
  applied_buffer_pct numeric(6,2) NOT NULL DEFAULT 0,
  desired_margin_pct numeric(6,2) NOT NULL DEFAULT 0,
  suggested_price numeric(12,2) NOT NULL DEFAULT 0,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_scenarios TO authenticated;
GRANT ALL ON public.pricing_scenarios TO service_role;
ALTER TABLE public.pricing_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view pricing"   ON public.pricing_scenarios FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "insert pricing" ON public.pricing_scenarios FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "update pricing" ON public.pricing_scenarios FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "delete pricing" ON public.pricing_scenarios FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER tr_pricing_updated BEFORE UPDATE ON public.pricing_scenarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: get_all_users_for_admin (admin-only)
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(user_id uuid, email text, full_name text, role app_role, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT u.id, u.email::text, p.full_name, ur.role, u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin() TO authenticated;
