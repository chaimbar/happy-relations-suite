-- Unify the split-brain role system: public.user_roles becomes the single source of truth.
-- RLS policies call get_my_role() (user_role enum); the frontend uses user_roles (app_role enum).
-- Previously get_my_role() read profiles.role, so users created via the admin UI (which only
-- writes user_roles) got the wrong RLS permissions. This makes user_roles authoritative.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN bool_or(role = 'admin')        THEN 'admin'
    WHEN bool_or(role = 'team_manager') THEN 'manager'
    ELSE 'employee'
  END::user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
$$;

-- Backfill user_roles for users that only had profiles.role (e.g. seed admin)
INSERT INTO public.user_roles (user_id, role)
SELECT p.id,
  (CASE p.role WHEN 'admin' THEN 'admin' WHEN 'manager' THEN 'team_manager' ELSE 'employee' END)::app_role
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
  AND p.role IS NOT NULL;

-- One-time sync profiles.role FROM user_roles so any legacy reader stays correct
UPDATE public.profiles p SET role = sub.mapped
FROM (
  SELECT user_id,
    (CASE WHEN bool_or(role='admin') THEN 'admin'
          WHEN bool_or(role='team_manager') THEN 'manager'
          ELSE 'employee' END)::user_role AS mapped
  FROM public.user_roles GROUP BY user_id
) sub
WHERE p.id = sub.user_id AND p.role IS DISTINCT FROM sub.mapped;

-- Keep profiles.role synced whenever user_roles changes
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE target uuid := COALESCE(NEW.user_id, OLD.user_id);
BEGIN
  UPDATE public.profiles SET role = COALESCE((
    SELECT CASE WHEN bool_or(role='admin') THEN 'admin'
                WHEN bool_or(role='team_manager') THEN 'manager'
                ELSE 'employee' END::user_role
    FROM public.user_roles WHERE user_id = target
  ), 'employee'::user_role)
  WHERE id = target;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_sync_profile_role ON public.user_roles;
CREATE TRIGGER trg_sync_profile_role
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role();
