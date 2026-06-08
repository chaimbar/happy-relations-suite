-- =============================================================
-- Schema documentation — GAP-011 / GAP-012 / GAP-013
-- =============================================================
-- The actual DB was provisioned by Lovable and already contains
-- all columns listed below. This file documents the resolved state
-- and is a no-op (all ALTER TABLE statements use IF NOT EXISTS /
-- IF EXISTS guards so it is safe to re-run).
-- =============================================================

-- employees table — actual columns (already exist):
--   id_number TEXT                         (resolved GAP-011)
--   daily_cost_estimated NUMERIC           (resolved GAP-013)
--   job_title TEXT                         (resolved GAP-012)
--   employment_type TEXT DEFAULT 'שכיר'    (resolved GAP-012)
--   start_date DATE                        (resolved GAP-012)
--   timewatch_employee_id TEXT             (resolved GAP-012)
--   user_id UUID NOT NULL                  (ownership column)

-- salary_records table — actual columns (already exist):
--   amount_actual NUMERIC NOT NULL
--   is_paid BOOLEAN NOT NULL DEFAULT false
--   user_id UUID NOT NULL

-- assignments table — actual columns (already exist):
--   site_id UUID NOT NULL  (FK → sites.id)
--   shift_type shift_type ENUM ('full','morning','afternoon')
--   cost_estimated NUMERIC

SELECT 1; -- no-op placeholder
