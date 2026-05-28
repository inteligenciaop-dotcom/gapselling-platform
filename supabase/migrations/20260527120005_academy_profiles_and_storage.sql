-- Perfil comercial da academia (contexto IA) + bucket de logos
-- Depende de: academies, profiles (migration 20000)
-- Inclui helpers RLS caso 20001 ainda não tenha sido aplicada

-- ---------------------------------------------------------------------------
-- Helpers RLS (idempotente — seguro reexecutar)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_academy_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT academy_id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_academy()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND academy_id IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.get_user_academy_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_academy_id() TO authenticated;

REVOKE ALL ON FUNCTION public.user_has_academy() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_academy() TO authenticated;

-- ---------------------------------------------------------------------------
-- academy_profiles (1:1 com academies)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_profiles (  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id         uuid NOT NULL UNIQUE REFERENCES public.academies (id) ON DELETE CASCADE,
  modalities         text,
  plans              text,
  pricing            text,
  differentials      text,
  communication_tone text,
  description        text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_profiles_academy_id
  ON public.academy_profiles (academy_id);

ALTER TABLE public.academy_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "academy_profiles_select_tenant" ON public.academy_profiles;
CREATE POLICY "academy_profiles_select_tenant"
  ON public.academy_profiles
  FOR SELECT
  TO authenticated
  USING (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS "academy_profiles_insert_tenant" ON public.academy_profiles;
CREATE POLICY "academy_profiles_insert_tenant"
  ON public.academy_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS "academy_profiles_update_tenant" ON public.academy_profiles;
CREATE POLICY "academy_profiles_update_tenant"
  ON public.academy_profiles
  FOR UPDATE
  TO authenticated
  USING (academy_id = public.get_user_academy_id())
  WITH CHECK (academy_id = public.get_user_academy_id());

-- ---------------------------------------------------------------------------
-- Storage: logos por academia (pasta = academy_id)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academy-logos',
  'academy-logos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "academy_logos_select" ON storage.objects;
CREATE POLICY "academy_logos_select"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'academy-logos');

DROP POLICY IF EXISTS "academy_logos_insert" ON storage.objects;
CREATE POLICY "academy_logos_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'academy-logos'
    AND (storage.foldername(name))[1] = public.get_user_academy_id()::text
  );

DROP POLICY IF EXISTS "academy_logos_update" ON storage.objects;
CREATE POLICY "academy_logos_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'academy-logos'
    AND (storage.foldername(name))[1] = public.get_user_academy_id()::text
  )
  WITH CHECK (
    bucket_id = 'academy-logos'
    AND (storage.foldername(name))[1] = public.get_user_academy_id()::text
  );

DROP POLICY IF EXISTS "academy_logos_delete" ON storage.objects;
CREATE POLICY "academy_logos_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'academy-logos'
    AND (storage.foldername(name))[1] = public.get_user_academy_id()::text
  );
