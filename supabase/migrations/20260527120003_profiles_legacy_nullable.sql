-- profiles: colunas legadas não são mais preenchidas no cadastro
-- Nome da academia vem de academies.name após onboarding

ALTER TABLE public.profiles
  ALTER COLUMN gym_name DROP NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN address DROP NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN phone DROP NOT NULL;

-- academy_id continua nullable até onboarding
ALTER TABLE public.profiles
  ALTER COLUMN academy_id DROP NOT NULL;
