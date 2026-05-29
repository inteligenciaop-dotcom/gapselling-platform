CREATE TABLE IF NOT EXISTS public.students (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id  uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
  lead_id     uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  name        text NOT NULL,
  phone       text,
  plan        text,
  modalities  jsonb NOT NULL DEFAULT '[]'::jsonb,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_academy_id ON public.students (academy_id);
CREATE INDEX IF NOT EXISTS idx_students_lead_id ON public.students (lead_id);
NOTIFY pgrst, 'reload schema';
