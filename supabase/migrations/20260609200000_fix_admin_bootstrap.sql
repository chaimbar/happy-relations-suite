-- Allow users to read their own role (fixes chicken-and-egg: user can't see isAdmin=true without reading own role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'users_read_own_roles'
  ) THEN
    CREATE POLICY "users_read_own_roles" ON public.user_roles
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Set chaimb407@gmail.com (user_id from production) as admin
-- user_id discovered from live network request to hozkrgoxtkcwnzsjnpuj project
INSERT INTO public.user_roles (user_id, role)
VALUES ('5f3f68d4-d79f-4846-86e9-93a24afb4101', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Also update profiles.role for RLS functions that read from profiles
UPDATE public.profiles
SET role = 'admin'
WHERE id = '5f3f68d4-d79f-4846-86e9-93a24afb4101';
