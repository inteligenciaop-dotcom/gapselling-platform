ALTER TABLE public.ai_agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_agent_profiles_select_tenant ON public.ai_agent_profiles;
CREATE POLICY ai_agent_profiles_select_tenant ON public.ai_agent_profiles FOR SELECT TO authenticated
  USING (academy_id = public.get_user_academy_id());
DROP POLICY IF EXISTS ai_agent_profiles_insert_tenant ON public.ai_agent_profiles;
CREATE POLICY ai_agent_profiles_insert_tenant ON public.ai_agent_profiles FOR INSERT TO authenticated
  WITH CHECK (academy_id = public.get_user_academy_id());
DROP POLICY IF EXISTS ai_agent_profiles_update_tenant ON public.ai_agent_profiles;
CREATE POLICY ai_agent_profiles_update_tenant ON public.ai_agent_profiles FOR UPDATE TO authenticated
  USING (academy_id = public.get_user_academy_id()) WITH CHECK (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS students_select_tenant ON public.students;
CREATE POLICY students_select_tenant ON public.students FOR SELECT TO authenticated
  USING (academy_id = public.get_user_academy_id());
DROP POLICY IF EXISTS students_insert_tenant ON public.students;
CREATE POLICY students_insert_tenant ON public.students FOR INSERT TO authenticated
  WITH CHECK (academy_id = public.get_user_academy_id());
DROP POLICY IF EXISTS students_update_tenant ON public.students;
CREATE POLICY students_update_tenant ON public.students FOR UPDATE TO authenticated
  USING (academy_id = public.get_user_academy_id()) WITH CHECK (academy_id = public.get_user_academy_id());
DROP POLICY IF EXISTS students_delete_tenant ON public.students;
CREATE POLICY students_delete_tenant ON public.students FOR DELETE TO authenticated
  USING (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS conversations_select_tenant ON public.conversations;
CREATE POLICY conversations_select_tenant ON public.conversations FOR SELECT TO authenticated
  USING (academy_id = public.get_user_academy_id());
DROP POLICY IF EXISTS conversations_insert_tenant ON public.conversations;
CREATE POLICY conversations_insert_tenant ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (academy_id = public.get_user_academy_id());
DROP POLICY IF EXISTS conversations_update_tenant ON public.conversations;
CREATE POLICY conversations_update_tenant ON public.conversations FOR UPDATE TO authenticated
  USING (academy_id = public.get_user_academy_id()) WITH CHECK (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS messages_select_tenant ON public.messages;
CREATE POLICY messages_select_tenant ON public.messages FOR SELECT TO authenticated
  USING (academy_id = public.get_user_academy_id());
DROP POLICY IF EXISTS messages_insert_tenant ON public.messages;
CREATE POLICY messages_insert_tenant ON public.messages FOR INSERT TO authenticated
  WITH CHECK (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS campaign_sends_select_tenant ON public.campaign_sends;
CREATE POLICY campaign_sends_select_tenant ON public.campaign_sends FOR SELECT TO authenticated
  USING (academy_id = public.get_user_academy_id());
DROP POLICY IF EXISTS campaign_sends_insert_tenant ON public.campaign_sends;
CREATE POLICY campaign_sends_insert_tenant ON public.campaign_sends FOR INSERT TO authenticated
  WITH CHECK (academy_id = public.get_user_academy_id());
DROP POLICY IF EXISTS campaign_sends_update_tenant ON public.campaign_sends;
CREATE POLICY campaign_sends_update_tenant ON public.campaign_sends FOR UPDATE TO authenticated
  USING (academy_id = public.get_user_academy_id()) WITH CHECK (academy_id = public.get_user_academy_id());

NOTIFY pgrst, 'reload schema';
