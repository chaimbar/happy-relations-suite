-- =============================================================
-- Financial Views — Session 2 (GAP-005 / GAP-008 / GAP-010)
-- =============================================================
-- NOTE: `site_profitability`, `client_balance`, and `today_assignments`
-- were already created by Lovable in the initial setup.
-- This migration ONLY adds the new `salary_site_allocation` view.
-- DO NOT recreate the existing views — they already exist and work correctly.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- salary_site_allocation
--   Proportionally splits unlinked salary_records across sites
--   based on how many assignment-days the employee worked per
--   site in that month.  Used when salary_records.site_id IS NULL.
-- ─────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.salary_site_allocation;

CREATE OR REPLACE VIEW public.salary_site_allocation AS
SELECT
  sr.id                                                             AS salary_record_id,
  sr.employee_id,
  sr.month,
  sr.amount_actual,
  a.site_id,

  -- Total assignment days for this employee in the salary month
  COUNT(a.id) OVER (
    PARTITION BY sr.employee_id,
                 DATE_TRUNC('month', a.date::date)
  )                                                                 AS days_in_month,

  -- Assignment days specifically on this site
  COUNT(a.id) OVER (
    PARTITION BY sr.employee_id,
                 a.site_id,
                 DATE_TRUNC('month', a.date::date)
  )                                                                 AS days_on_site,

  -- Proportional salary amount attributed to this site
  ROUND(
    sr.amount_actual * (
      COUNT(a.id) OVER (
        PARTITION BY sr.employee_id,
                     a.site_id,
                     DATE_TRUNC('month', a.date::date)
      )::NUMERIC
      /
      NULLIF(
        COUNT(a.id) OVER (
          PARTITION BY sr.employee_id,
                       DATE_TRUNC('month', a.date::date)
        ),
        0
      )
    ),
    2
  )                                                                 AS allocated_amount

FROM public.salary_records sr
JOIN public.assignments a
  ON  a.employee_id = sr.employee_id
  AND DATE_TRUNC('month', a.date::date) = DATE_TRUNC('month', sr.month::date)
WHERE sr.site_id IS NULL;   -- only unlinked salary records need allocation

GRANT SELECT ON public.salary_site_allocation TO authenticated;
GRANT SELECT ON public.salary_site_allocation TO service_role;

-- ─────────────────────────────────────────────────────────────
-- End of migration
-- ─────────────────────────────────────────────────────────────
