export const SETUP_EXEMPT_PATHS = [
  '/onboarding/setup',
  '/academy/settings',
]

export const navigationSections = [
  {
    title: 'Gestão',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', requiresSetup: true },
      { label: 'CRM', path: '/crm', icon: 'crm', requiresSetup: true },
      { label: 'Central de Leads', path: '/leads', icon: 'leads', requiresSetup: true },
      { label: 'Campanhas', path: '/campanhas', icon: 'campaigns', requiresSetup: true },
      { label: 'Alunos', path: '/alunos', icon: 'students', requiresSetup: true },
    ],
  },
  {
    title: 'IA',
    items: [
      { label: 'Chat IA', path: '/chat-ia', icon: 'chat', requiresSetup: true },
      { label: 'Configurações IA', path: '/configuracoes-ia', icon: 'ai-settings', requiresSetup: true },
      { label: 'Base de Conhecimento', path: '/base-conhecimento', icon: 'knowledge', requiresSetup: true },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Usuários', path: '/usuarios', icon: 'users', requiresSetup: true },
      { label: 'Configurações da Academia', path: '/academy/settings', icon: 'academy', requiresSetup: false },
      { label: 'Integrações', path: '/integracoes', icon: 'integrations', requiresSetup: true },
    ],
  },
]
