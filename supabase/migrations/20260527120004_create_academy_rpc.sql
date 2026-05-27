-- Cria academia e vincula ao profile em uma operação atômica (SECURITY DEFINER)
-- Parâmetros em ORDEM ALFABÉTICA (exigência do PostgREST / Supabase RPC)

DROP FUNCTION IF EXISTS public.create_academy_for_user(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.create_academy_for_user(
  p_address text,
  p_name text,
  p_phone text,
  p_slug text,
  p_website text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_academy_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Nome da academia é obrigatório';
  END IF;

  IF p_slug IS NULL OR trim(p_slug) = '' THEN
    RAISE EXCEPTION 'Slug da academia é obrigatório';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = v_user_id
      AND academy_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Usuário já possui uma academia vinculada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;

  INSERT INTO public.academies (name, slug, phone, address, website)
  VALUES (
    trim(p_name),
    trim(p_slug),
    NULLIF(trim(p_phone), ''),
    NULLIF(trim(p_address), ''),
    NULLIF(trim(p_website), '')
  )
  RETURNING id INTO v_academy_id;

  UPDATE public.profiles
  SET academy_id = v_academy_id
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Falha ao vincular academia ao perfil do usuário';
  END IF;

  RETURN v_academy_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_academy_for_user(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_academy_for_user(text, text, text, text, text) TO authenticated;

-- Força reload do schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
