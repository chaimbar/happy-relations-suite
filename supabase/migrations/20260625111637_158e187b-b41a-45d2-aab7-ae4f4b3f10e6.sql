ALTER TABLE public.sites ALTER COLUMN client_id SET NOT NULL;
NOTIFY pgrst, 'reload schema';