# Supabase — GapSelling

Migrations versionadas para schema multi-tenant e RLS.

## Arquivos

| Migration | Conteúdo |
|-----------|----------|
| `20260527120000_initial_schema.sql` | Tabelas, FKs, índices |
| `20260527120001_rls_policies.sql` | Helpers + políticas RLS |
| `20260527120002_existing_db_fixes.sql` | Ajustes para DB já existente no Supabase |
| `20260527120003_profiles_legacy_nullable.sql` | gym_name/address/phone nullable (cadastro novo) |
| `20260527120004_create_academy_rpc.sql` | Função atômica criar academia + vincular profile |

## Como aplicar

### Opção A — Supabase CLI (recomendado)

```bash
# Na raiz do projeto, com Supabase CLI instalado
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

### Opção B — SQL Editor (Dashboard Supabase)

1. Abra **SQL Editor** no projeto Supabase
2. Execute `20260527120000_initial_schema.sql` (pule se tabelas já existirem)
3. Execute `20260527120002_existing_db_fixes.sql` (se DB já existia antes)
4. Execute `20260527120003_profiles_legacy_nullable.sql`
5. Execute `20260527120001_rls_policies.sql`

## Fluxo suportado pelas políticas RLS

```
Cadastro (/register)
  → INSERT profiles (user_id, login_name, email) — academy_id NULL

Onboarding (/onboarding/academy)
  → INSERT academies (somente se usuário ainda não tem academy_id)
  → UPDATE profiles SET academy_id = ...

Login (/dashboard)
  → SELECT profiles + academies (tenant do usuário)
  → leads/campaigns/whatsapp: filtrados por get_user_academy_id()
```

## Helpers

- `get_user_academy_id()` — retorna `profiles.academy_id` do usuário logado
- `user_has_academy()` — `true` se usuário já vinculou uma academia

## Auth (Supabase Dashboard)

Em **Authentication → Providers → Email**, para dev local:

- Desative **Confirm email** se quiser login imediato após cadastro (fluxo onboarding sem confirmação)

## Verificação rápida

Após aplicar migrations, teste no SQL Editor (como usuário autenticado via app):

1. Cadastro cria profile sem `academy_id`
2. Onboarding cria academy e vincula profile
3. Segundo INSERT em `academies` pelo mesmo usuário deve falhar (RLS)
4. Usuário A não vê leads da academia do usuário B
