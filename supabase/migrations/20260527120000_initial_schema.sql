-- GapSelling: schema inicial multi-tenant
-- Fonte: DATABASE_SCHEMA.md / Docs/Database/Schema.csv

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- academies (tenant raiz)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  logo_url   text,
  website    text,
  phone      text,
  address    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- profiles (usuário ↔ academia)
-- academy_id nullable: preenchido no onboarding pós-cadastro
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  login_name text NOT NULL,
  email      text NOT NULL,
  gym_name   text,
  address    text,
  phone      text,
  academy_id uuid REFERENCES public.academies (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Garante academy_id nullable (instalações existentes)
ALTER TABLE public.profiles
  ALTER COLUMN academy_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_academy_id ON public.profiles (academy_id);

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id  uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  tag         text,
  ai_prompt   text,
  active      boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_academy_id ON public.campaigns (academy_id);

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id  uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
  name        text NOT NULL,
  phone       text,
  email       text,
  status      text DEFAULT 'ativo',
  stage       text DEFAULT 'Novo Lead',
  source      text DEFAULT 'manual',
  created_at  timestamptz NOT NULL DEFAULT now(),
  campaign_id uuid REFERENCES public.campaigns (id) ON DELETE SET NULL,
  tag         text
);

CREATE INDEX IF NOT EXISTS idx_leads_academy_id ON public.leads (academy_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON public.leads (campaign_id);

-- ---------------------------------------------------------------------------
-- whatsapp_instances
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
  instance_name text NOT NULL,
  phone         text,
  status        text DEFAULT 'desconectado',
  qr_code       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_academy_id
  ON public.whatsapp_instances (academy_id);
