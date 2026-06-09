-- ================================================================
-- BONUS FEATURE: Pricing Simulator — pricing_scenarios table
-- Saves price-quote scenarios computed from historical cost data.
-- Access: admin + manager only (pricing is a management action).
-- ================================================================

CREATE TABLE IF NOT EXISTS public.pricing_scenarios (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     TEXT NOT NULL,
  client_id                UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  input_mode               TEXT NOT NULL DEFAULT 'workdays',  -- 'workdays' | 'stages'
  inputs                   JSONB NOT NULL DEFAULT '{}'::jsonb,
  estimated_labor_cost     NUMERIC NOT NULL DEFAULT 0,
  estimated_materials_cost NUMERIC NOT NULL DEFAULT 0,
  applied_buffer_pct       NUMERIC NOT NULL DEFAULT 0,
  desired_margin_pct       NUMERIC NOT NULL DEFAULT 0,
  suggested_price          NUMERIC NOT NULL DEFAULT 0,
  converted_site_id        UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  created_by               UUID DEFAULT auth.uid(),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_scenarios TO authenticated;
GRANT ALL ON public.pricing_scenarios TO service_role;

ALTER TABLE public.pricing_scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pricing_scenarios_select" ON public.pricing_scenarios;
DROP POLICY IF EXISTS "pricing_scenarios_insert" ON public.pricing_scenarios;
DROP POLICY IF EXISTS "pricing_scenarios_update" ON public.pricing_scenarios;
DROP POLICY IF EXISTS "pricing_scenarios_delete" ON public.pricing_scenarios;

CREATE POLICY "pricing_scenarios_select" ON public.pricing_scenarios
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "pricing_scenarios_insert" ON public.pricing_scenarios
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "pricing_scenarios_update" ON public.pricing_scenarios
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "pricing_scenarios_delete" ON public.pricing_scenarios
  FOR DELETE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

-- Audit trail (reuses existing log_to_audit() function)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_pricing_scenarios') THEN
    CREATE TRIGGER audit_pricing_scenarios
      AFTER INSERT OR UPDATE OR DELETE ON public.pricing_scenarios
      FOR EACH ROW EXECUTE FUNCTION public.log_to_audit();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pricing_scenarios_created_at
  ON public.pricing_scenarios(created_at DESC);
