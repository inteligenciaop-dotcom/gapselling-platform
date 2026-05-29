CREATE TABLE IF NOT EXISTS public.ai_agent_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
  agent_type    text NOT NULL CHECK (agent_type IN ('vendedor', 'recepcionista', 'professor')),
  display_name  text NOT NULL,
  system_prompt text NOT NULL DEFAULT '',
  enabled       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academy_id, agent_type)
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_profiles_academy_id ON public.ai_agent_profiles (academy_id);
NOTIFY pgrst, 'reload schema';
