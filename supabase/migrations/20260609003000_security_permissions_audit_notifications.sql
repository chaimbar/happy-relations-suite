-- ================================================================
-- MIGRATION: Security Permissions, Audit Triggers, Notifications
-- Addresses: GAP-014 (Team Manager Isolation)
--            GAP-003 (Audit Log Triggers)
--            GAP-002 (Notification Queue)
-- ================================================================

-- ================================================================
-- PART 0: Fix is_admin() — align with profiles.role system
-- ================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_my_role() = 'admin'
$$;

-- ================================================================
-- PART 1: GAP-014 — Team Manager Isolation
-- ================================================================

-- Helper: returns IDs of employees managed by the current user
-- Requires: profiles.managed_by = manager's auth.uid()
CREATE OR REPLACE FUNCTION public.my_employee_ids()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id
  FROM public.employees e
  JOIN public.profiles p ON p.id = e.user_id
  WHERE p.managed_by = auth.uid()
$$;

-- ----------------------------------------
-- employees: role-based visibility
-- admin: all | manager: only their team | employee: only themselves
-- ----------------------------------------
DROP POLICY IF EXISTS "employees_select" ON public.employees;
DROP POLICY IF EXISTS "employees_insert" ON public.employees;
DROP POLICY IF EXISTS "employees_update" ON public.employees;
DROP POLICY IF EXISTS "employees_delete" ON public.employees;

CREATE POLICY "employees_select" ON public.employees
  FOR SELECT TO authenticated USING (
    CASE get_my_role()
      WHEN 'admin'   THEN true
      WHEN 'manager' THEN id IN (SELECT public.my_employee_ids())
      ELSE                user_id = auth.uid()
    END
  );

CREATE POLICY "employees_insert" ON public.employees
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "employees_update" ON public.employees
  FOR UPDATE TO authenticated
  USING (
    CASE get_my_role()
      WHEN 'admin'   THEN true
      WHEN 'manager' THEN id IN (SELECT public.my_employee_ids())
      ELSE                false
    END
  );

CREATE POLICY "employees_delete" ON public.employees
  FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ----------------------------------------
-- assignments: manager sees only their team's assignments
-- ----------------------------------------
DROP POLICY IF EXISTS "assignments_select" ON public.assignments;
DROP POLICY IF EXISTS "assignments_insert" ON public.assignments;
DROP POLICY IF EXISTS "assignments_update" ON public.assignments;
DROP POLICY IF EXISTS "assignments_delete" ON public.assignments;

CREATE POLICY "assignments_select" ON public.assignments
  FOR SELECT TO authenticated USING (
    CASE get_my_role()
      WHEN 'admin'   THEN true
      WHEN 'manager' THEN employee_id IN (SELECT public.my_employee_ids())
      ELSE                employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    END
  );

CREATE POLICY "assignments_insert" ON public.assignments
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "assignments_update" ON public.assignments
  FOR UPDATE TO authenticated
  USING (
    CASE get_my_role()
      WHEN 'admin'   THEN true
      WHEN 'manager' THEN employee_id IN (SELECT public.my_employee_ids())
      ELSE                false
    END
  );

CREATE POLICY "assignments_delete" ON public.assignments
  FOR DELETE TO authenticated
  USING (
    CASE get_my_role()
      WHEN 'admin'   THEN true
      WHEN 'manager' THEN employee_id IN (SELECT public.my_employee_ids())
      ELSE                false
    END
  );

-- ----------------------------------------
-- salary_records: sensitive financial data
-- admin: full access | manager: own team only | employee: no access
-- ----------------------------------------
DROP POLICY IF EXISTS "salary_records_select" ON public.salary_records;
DROP POLICY IF EXISTS "salary_records_insert" ON public.salary_records;
DROP POLICY IF EXISTS "salary_records_update" ON public.salary_records;
DROP POLICY IF EXISTS "salary_records_delete" ON public.salary_records;

CREATE POLICY "salary_records_select" ON public.salary_records
  FOR SELECT TO authenticated USING (
    CASE get_my_role()
      WHEN 'admin'   THEN true
      WHEN 'manager' THEN employee_id IN (SELECT public.my_employee_ids())
      ELSE                false
    END
  );

CREATE POLICY "salary_records_insert" ON public.salary_records
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "salary_records_update" ON public.salary_records
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "salary_records_delete" ON public.salary_records
  FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ================================================================
-- PART 2: GAP-003 — Audit Log Triggers
-- ================================================================

CREATE OR REPLACE FUNCTION public.log_to_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id    UUID;
  _user_email TEXT;
  _record_id  UUID;
  _name       TEXT;
BEGIN
  _user_id := auth.uid();

  BEGIN
    SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;
  EXCEPTION WHEN OTHERS THEN
    _user_email := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    _record_id := OLD.id;
    _name := COALESCE(
      (to_jsonb(OLD) ->> 'name'),
      (to_jsonb(OLD) ->> 'full_name'),
      _record_id::text
    );
    INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, entity_name, details)
    VALUES (_user_id, _user_email, 'DELETE', TG_TABLE_NAME, _record_id, _name,
            to_jsonb(OLD));
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    _record_id := NEW.id;
    _name := COALESCE(
      (to_jsonb(NEW) ->> 'name'),
      (to_jsonb(NEW) ->> 'full_name'),
      _record_id::text
    );
    INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, entity_name, details)
    VALUES (_user_id, _user_email, 'UPDATE', TG_TABLE_NAME, _record_id, _name,
            jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW)));
    RETURN NEW;

  ELSIF TG_OP = 'INSERT' THEN
    _record_id := NEW.id;
    _name := COALESCE(
      (to_jsonb(NEW) ->> 'name'),
      (to_jsonb(NEW) ->> 'full_name'),
      _record_id::text
    );
    INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, entity_name, details)
    VALUES (_user_id, _user_email, 'INSERT', TG_TABLE_NAME, _record_id, _name,
            to_jsonb(NEW));
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_employees') THEN
    CREATE TRIGGER audit_employees
      AFTER INSERT OR UPDATE OR DELETE ON public.employees
      FOR EACH ROW EXECUTE FUNCTION public.log_to_audit();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_clients') THEN
    CREATE TRIGGER audit_clients
      AFTER INSERT OR UPDATE OR DELETE ON public.clients
      FOR EACH ROW EXECUTE FUNCTION public.log_to_audit();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_sites') THEN
    CREATE TRIGGER audit_sites
      AFTER INSERT OR UPDATE OR DELETE ON public.sites
      FOR EACH ROW EXECUTE FUNCTION public.log_to_audit();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_assignments') THEN
    CREATE TRIGGER audit_assignments
      AFTER INSERT OR UPDATE OR DELETE ON public.assignments
      FOR EACH ROW EXECUTE FUNCTION public.log_to_audit();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_payments') THEN
    CREATE TRIGGER audit_payments
      AFTER INSERT OR UPDATE OR DELETE ON public.payments
      FOR EACH ROW EXECUTE FUNCTION public.log_to_audit();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_salary_records') THEN
    CREATE TRIGGER audit_salary_records
      AFTER INSERT OR UPDATE OR DELETE ON public.salary_records
      FOR EACH ROW EXECUTE FUNCTION public.log_to_audit();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_site_stages') THEN
    CREATE TRIGGER audit_site_stages
      AFTER INSERT OR UPDATE OR DELETE ON public.site_stages
      FOR EACH ROW EXECUTE FUNCTION public.log_to_audit();
  END IF;
END $$;

-- ================================================================
-- PART 3: GAP-002 — Notification Queue
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.notification_channel AS ENUM ('email', 'whatsapp', 'both');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.notification_status AS ENUM ('pending', 'sent', 'failed', 'skipped');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.notification_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel         public.notification_channel  NOT NULL DEFAULT 'email',
  recipient_email TEXT,
  recipient_phone TEXT,
  subject         TEXT,
  body            TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  event_data      JSONB,
  status          public.notification_status NOT NULL DEFAULT 'pending',
  attempts        INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at         TIMESTAMPTZ
);

GRANT INSERT, SELECT ON public.notification_queue TO authenticated;
GRANT ALL ON public.notification_queue TO service_role;

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_queue_select_admin" ON public.notification_queue
  FOR SELECT TO authenticated USING (get_my_role() = 'admin');

CREATE POLICY "notification_queue_insert_auth" ON public.notification_queue
  FOR INSERT TO authenticated WITH CHECK (true);

-- Enqueue notification when a payment is recorded
CREATE OR REPLACE FUNCTION public.notify_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_email TEXT;
  _site_name   TEXT;
BEGIN
  SELECT u.email INTO _admin_email
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE p.role = 'admin'
  LIMIT 1;

  SELECT name INTO _site_name FROM public.sites WHERE id = NEW.site_id;

  IF _admin_email IS NOT NULL THEN
    INSERT INTO public.notification_queue (
      channel, recipient_email, subject, body, event_type, event_data
    ) VALUES (
      'both',
      _admin_email,
      'תשלום חדש נרשם — ' || COALESCE(_site_name, 'אתר לא ידוע'),
      'סכום: ' || NEW.amount::text || ' ₪' ||
        CASE WHEN _site_name IS NOT NULL THEN ' | אתר: ' || _site_name ELSE '' END ||
        ' | תאריך: ' || NEW.payment_date::text,
      'payment_created',
      to_jsonb(NEW)
    );
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'notify_payment_created') THEN
    CREATE TRIGGER notify_payment_created
      AFTER INSERT ON public.payments
      FOR EACH ROW EXECUTE FUNCTION public.notify_on_payment();
  END IF;
END $$;

-- Index for processing pending notifications
CREATE INDEX IF NOT EXISTS idx_notification_queue_status
  ON public.notification_queue(status, created_at)
  WHERE status = 'pending';
