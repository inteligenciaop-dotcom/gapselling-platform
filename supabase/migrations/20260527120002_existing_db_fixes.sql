-- Ajustes para instalações Supabase já existentes (tabelas criadas manualmente)

-- academy_id nullable no onboarding
ALTER TABLE public.profiles
  ALTER COLUMN academy_id DROP NOT NULL;

-- legado: gym_name/address/phone não são mais usados no cadastro
ALTER TABLE public.profiles
  ALTER COLUMN gym_name DROP NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN address DROP NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN phone DROP NOT NULL;

-- UNIQUE em user_id (1 profile por usuário)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON public.profiles (user_id);

-- FK profiles → academies (se coluna existir sem constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_academy_id_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_academy_id_fkey
      FOREIGN KEY (academy_id) REFERENCES public.academies (id) ON DELETE SET NULL;
  END IF;
END $$;

-- FK profiles → auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_user_id_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- FKs tenant-scoped (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_academy_id_fkey'
  ) THEN
    ALTER TABLE public.campaigns
      ADD CONSTRAINT campaigns_academy_id_fkey
      FOREIGN KEY (academy_id) REFERENCES public.academies (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_academy_id_fkey'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_academy_id_fkey
      FOREIGN KEY (academy_id) REFERENCES public.academies (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_instances_academy_id_fkey'
  ) THEN
    ALTER TABLE public.whatsapp_instances
      ADD CONSTRAINT whatsapp_instances_academy_id_fkey
      FOREIGN KEY (academy_id) REFERENCES public.academies (id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;
