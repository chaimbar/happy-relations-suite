-- =============================================================
-- Financial Views — GAP-005 / GAP-008 / GAP-010 / GAP-019 / GAP-024
-- =============================================================
-- Context:
--   The live DB was provisioned by Lovable with `sites` (not `projects`),
--   `site_id` (not `project_id` in assignments), `cost_estimated`
--   (not `cost_snapshot`), and `salary_records` (not `salaries`).
--   The original view was broken — it targeted `public.projects`
--   and `assignments.cost_snapshot`, neither of which exists.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Rebuild project_profitability (targets sites, not projects)
-- ─────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.project_profitability;

CREATE OR REPLACE VIEW public.project_profitability AS
SELECT
  s.id,
  s.name,
  s.client_id,
  s.total_price,
  s.materials_cost,
  s.status::text                                          AS status,

  -- Estimated labor cost (sum of daily cost_estimated per assignment)
  COALESCE((
    SELECT SUM(a.cost_estimated)
    FROM public.assignments a
    WHERE a.site_id = s.id
  ), 0)                                                   AS estimated_labor_cost,

  -- Estimated profit
  s.total_price
    - s.materials_cost
    - COALESCE((
        SELECT SUM(a.cost_estimated)
        FROM public.assignments a
        WHERE a.site_id = s.id
      ), 0)                                               AS estimated_profit,

  -- Actual labor cost (salary_records directly linked to this site)
  COALESCE((
    SELECT SUM(sr.amount_actual)
    FROM public.salary_records sr
    WHERE sr.site_id = s.id
  ), 0)                                                   AS actual_labor_cost,

  -- Actual profit
  s.total_price
    - s.materials_cost
    - COALESCE((
        SELECT SUM(sr.amount_actual)
        FROM public.salary_records sr
        WHERE sr.site_id = s.id
      ), 0)                                               AS actual_profit,

  -- Labor variance: actual − estimated (positive = over budget)
  COALESCE((
    SELECT SUM(sr.amount_actual)
    FROM public.salary_records sr
    WHERE sr.site_id = s.id
  ), 0)
  - COALESCE((
      SELECT SUM(a.cost_estimated)
      FROM public.assignments a
      WHERE a.site_id = s.id
    ), 0)                                                 AS labor_variance,

  -- Total collected from payments (payments.project_id → sites.id in live DB)
  COALESCE((
    SELECT SUM(pay.paid_amount)
    FROM public.payments pay
    WHERE pay.project_id = s.id
  ), 0)                                                   AS total_collected,

  -- Balance due
  s.total_price - COALESCE((
    SELECT SUM(pay.paid_amount)
    FROM public.payments pay
    WHERE pay.project_id = s.id
  ), 0)                                                   AS balance_due

FROM public.sites s;

GRANT SELECT ON public.project_profitability TO authenticated;
GRANT SELECT ON public.project_profitability TO service_role;

-- ─────────────────────────────────────────────────────────────
-- 2. salary_site_allocation
--    Proportionally splits a salary_record across sites based
--    on how many assignment-days the employee worked per site
--    in that month.  Used when salary_records.site_id IS NULL.
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
