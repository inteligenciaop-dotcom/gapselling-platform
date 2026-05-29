ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS contact_name text;

NOTIFY pgrst, 'reload schema';
