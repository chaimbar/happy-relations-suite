-- Add secondary phone / WhatsApp number to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone2 text;
