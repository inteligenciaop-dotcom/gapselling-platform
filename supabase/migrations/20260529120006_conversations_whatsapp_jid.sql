ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS whatsapp_jid text;

CREATE INDEX IF NOT EXISTS idx_conversations_whatsapp_jid
  ON public.conversations (academy_id, whatsapp_jid);

NOTIFY pgrst, 'reload schema';
