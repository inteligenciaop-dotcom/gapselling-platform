CREATE TABLE IF NOT EXISTS public.conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
  lead_id         uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  phone           text NOT NULL,
  agent_type      text NOT NULL DEFAULT 'vendedor' CHECK (agent_type IN ('vendedor', 'recepcionista', 'professor')),
  mode            text NOT NULL DEFAULT 'ai' CHECK (mode IN ('ai', 'human')),
  campaign_id     uuid REFERENCES public.campaigns (id) ON DELETE SET NULL,
  last_message_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_academy_id ON public.conversations (academy_id);
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON public.conversations (academy_id, phone);

CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  direction       text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type     text NOT NULL CHECK (sender_type IN ('lead', 'ai', 'agent', 'system')),
  body            text NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages (conversation_id, created_at);
NOTIFY pgrst, 'reload schema';
