-- =============================================================
-- GAP-011 / GAP-012 / GAP-013  Schema Sync
-- Aligns DB columns with Frontend field names
-- =============================================================

-- ─── GAP-011: identifier → id_number ────────────────────────
ALTER TABLE public.employees
  RENAME COLUMN identifier TO id_number;

-- ─── GAP-013: daily_cost_estimate → daily_cost_estimated ────
ALTER TABLE public.employees
  RENAME COLUMN daily_cost_estimate TO daily_cost_estimated;

-- ─── GAP-012: Add columns missing from DB ───────────────────
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS job_title             TEXT,
  ADD COLUMN IF NOT EXISTS employment_type       TEXT DEFAULT 'שכיר',
  ADD COLUMN IF NOT EXISTS start_date            DATE,
  ADD COLUMN IF NOT EXISTS timewatch_employee_id TEXT;

-- ─── BUG-2/4: Align salaries table with Frontend ────────────
-- Frontend expects: amount_actual, is_paid
ALTER TABLE public.salaries
  RENAME COLUMN amount TO amount_actual;

ALTER TABLE public.salaries
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false;
