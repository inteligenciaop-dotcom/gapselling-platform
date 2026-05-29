-- Garante isolamento multi-tenant (leads/campaigns/whatsapp por academia)
-- Idempotente: seguro reexecutar no SQL Editor se RLS ainda não estiver ativo.

-- ---------------------------------------------------------------------------
-- Helpers RLS
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
-- Força RLS nas tabelas tenant-scoped
-- ---------------------------------------------------------------------------
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Remove políticas permissivas comuns (criadas manualmente no Dashboard)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.leads;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.leads;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.leads;
DROP POLICY IF EXISTS "Allow public read access" ON public.leads;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.campaigns;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.campaigns;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.campaigns;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.campaigns;

-- academies
DROP POLICY IF EXISTS "academies_select_own" ON public.academies;
CREATE POLICY "academies_select_own"
  ON public.academies
  FOR SELECT
  TO authenticated
  USING (id = public.get_user_academy_id());

DROP POLICY IF EXISTS "academies_insert_onboarding" ON public.academies;
CREATE POLICY "academies_insert_onboarding"
  ON public.academies
  FOR INSERT
  TO authenticated
  WITH CHECK (NOT public.user_has_academy());

DROP POLICY IF EXISTS "academies_update_own" ON public.academies;
CREATE POLICY "academies_update_own"
  ON public.academies
  FOR UPDATE
  TO authenticated
  USING (id = public.get_user_academy_id())
  WITH CHECK (id = public.get_user_academy_id());

-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- campaigns
DROP POLICY IF EXISTS "campaigns_select_tenant" ON public.campaigns;
CREATE POLICY "campaigns_select_tenant"
  ON public.campaigns FOR SELECT TO authenticated
  USING (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS "campaigns_insert_tenant" ON public.campaigns;
CREATE POLICY "campaigns_insert_tenant"
  ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS "campaigns_update_tenant" ON public.campaigns;
CREATE POLICY "campaigns_update_tenant"
  ON public.campaigns FOR UPDATE TO authenticated
  USING (academy_id = public.get_user_academy_id())
  WITH CHECK (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS "campaigns_delete_tenant" ON public.campaigns;
CREATE POLICY "campaigns_delete_tenant"
  ON public.campaigns FOR DELETE TO authenticated
  USING (academy_id = public.get_user_academy_id());

-- leads
DROP POLICY IF EXISTS "leads_select_tenant" ON public.leads;
CREATE POLICY "leads_select_tenant"
  ON public.leads FOR SELECT TO authenticated
  USING (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS "leads_insert_tenant" ON public.leads;
CREATE POLICY "leads_insert_tenant"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS "leads_update_tenant" ON public.leads;
CREATE POLICY "leads_update_tenant"
  ON public.leads FOR UPDATE TO authenticated
  USING (academy_id = public.get_user_academy_id())
  WITH CHECK (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS "leads_delete_tenant" ON public.leads;
CREATE POLICY "leads_delete_tenant"
  ON public.leads FOR DELETE TO authenticated
  USING (academy_id = public.get_user_academy_id());

-- whatsapp_instances
DROP POLICY IF EXISTS "whatsapp_select_tenant" ON public.whatsapp_instances;
CREATE POLICY "whatsapp_select_tenant"
  ON public.whatsapp_instances FOR SELECT TO authenticated
  USING (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS "whatsapp_insert_tenant" ON public.whatsapp_instances;
CREATE POLICY "whatsapp_insert_tenant"
  ON public.whatsapp_instances FOR INSERT TO authenticated
  WITH CHECK (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS "whatsapp_update_tenant" ON public.whatsapp_instances;
CREATE POLICY "whatsapp_update_tenant"
  ON public.whatsapp_instances FOR UPDATE TO authenticated
  USING (academy_id = public.get_user_academy_id())
  WITH CHECK (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS "whatsapp_delete_tenant" ON public.whatsapp_instances;
CREATE POLICY "whatsapp_delete_tenant"
  ON public.whatsapp_instances FOR DELETE TO authenticated
  USING (academy_id = public.get_user_academy_id());

-- Leads legados sem academy_id não devem vazar entre tenants
-- (ficam invisíveis até backfill manual no SQL Editor)
COMMENT ON COLUMN public.leads.academy_id IS
  'Tenant obrigatório. Leads com academy_id NULL são bloqueados pelas políticas RLS.';

NOTIFY pgrst, 'reload schema';
