# GapSelling — Frontend

SPA React (Vite + Tailwind) da plataforma GapSelling.

## Estrutura de pastas

```
frontend/src/
├── pages/                 # Telas, agrupadas por domínio
│   ├── auth/                # Login, registro, recuperação de senha
│   ├── onboarding/          # Criação da academia
│   ├── dashboard/           # Dashboard e placeholders
│   ├── academy/             # Configurações da academia
│   ├── leads/               # Central de leads e relatórios
│   ├── crm/                 # Kanban CRM (+ components/)
│   └── system/              # Usuários e configurações
├── components/
│   ├── layout/              # AppLayout, Sidebar, PageHeader
│   ├── ui/                  # Componentes reutilizáveis (Modal, etc.)
│   ├── leads/               # Componentes específicos de leads
│   └── icons/
├── services/                # Camada de dados (Supabase, exportações)
├── utils/                   # Funções puras (slug, formatação)
├── contexts/                # Estado global (AuthContext)
└── config/                  # Navegação, constantes de UI
```

### Convenções

| Pasta | Uso |
|-------|-----|
| `pages/` | Uma rota principal por arquivo; subpastas por módulo de negócio |
| `services/` | Chamadas à API/banco; sem JSX |
| `components/` | UI reutilizável; preferir `ui/` para genéricos |
| `utils/` | Helpers sem dependência de React ou Supabase |

Quando o backend FastAPI existir, adicionar `services/api.js` como cliente HTTP e migrar gradualmente os `services/*.js` off Supabase direct.

## Desenvolvimento

```bash
cp .env.example .env
npm install
npm run dev
```

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anon (pública) |
| `VITE_APP_URL` | URL de produção (links de e-mail) |

## Build

```bash
npm run build    # saída em dist/
```

Deploy via Vercel — ver [README.md](../README.md) na raiz do monorepo.
