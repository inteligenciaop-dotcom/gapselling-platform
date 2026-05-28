-- URL do Instagram da academia (opcional — usado para leitura automática do perfil)

ALTER TABLE public.academies
  ADD COLUMN IF NOT EXISTS instagram_url text;
