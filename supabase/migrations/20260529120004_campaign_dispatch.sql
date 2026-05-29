ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'broadcast',
  ADD COLUMN IF NOT EXISTS opening_message text,
  ADD COLUMN IF NOT EXISTS follow_up_interval_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3;

CREATE TABLE IF NOT EXISTS public.campaign_sends (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id   uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
  campaign_id  uuid NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
  lead_id      uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'replied', 'cancelled')),
  attempt      integer NOT NULL DEFAULT 0,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at      timestamptz,
  last_error   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, lead_id, attempt)
);

CREATE INDEX IF NOT EXISTS idx_campaign_sends_pending ON public.campaign_sends (academy_id, status, scheduled_at);
NOTIFY pgrst, 'reload schema';
