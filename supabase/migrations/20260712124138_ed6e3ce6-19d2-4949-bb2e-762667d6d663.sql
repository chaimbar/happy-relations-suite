
CREATE TABLE public.site_additions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_additions TO authenticated;
GRANT ALL ON public.site_additions TO service_role;

ALTER TABLE public.site_additions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers view additions" ON public.site_additions FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "Managers insert additions" ON public.site_additions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "Managers update additions" ON public.site_additions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'team_manager'));
CREATE POLICY "Admins delete additions" ON public.site_additions FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER tr_site_additions_updated BEFORE UPDATE ON public.site_additions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_site_additions_site ON public.site_additions(site_id);
