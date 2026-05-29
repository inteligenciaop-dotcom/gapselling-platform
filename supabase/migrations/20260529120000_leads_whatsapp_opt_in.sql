ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in_at timestamptz;

COMMENT ON COLUMN public.leads.whatsapp_opt_in IS 'Consentimento para contato via WhatsApp.';
NOTIFY pgrst, 'reload schema';
