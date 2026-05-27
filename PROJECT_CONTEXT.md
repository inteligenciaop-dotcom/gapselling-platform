# GapSelling SaaS

# Visão Geral

GapSelling é uma plataforma SaaS multi-tenant focada em automação comercial inteligente para academias utilizando Inteligência Artificial integrada ao WhatsApp.

O sistema permite:
- captação de leads
- organização comercial
- campanhas automatizadas
- atendimento via IA
- acompanhamento de conversas
- gestão comercial
- acompanhamento de matrículas

A IA deve atuar como um vendedor virtual da academia, utilizando o perfil e contexto específico de cada cliente.

---

# Objetivo do MVP

O objetivo do MVP é criar uma operação comercial automatizada para academias com foco em:

- geração de conversas
- qualificação de leads
- campanhas automáticas
- acompanhamento comercial
- conversão de matrícula

O sistema deve ser operacionalmente simples, escalável e rápido de evoluir.

---

# Público-Alvo

- academias
- studios
- centros esportivos
- negócios fitness

---

# Conceito Principal do Produto

Cada academia possui:
- identidade própria
- tom de comunicação
- modalidades
- planos
- preços
- diferenciais comerciais

A IA deve utilizar essas informações para conversar de forma personalizada com os leads.

O sistema NÃO deve utilizar respostas genéricas.

A IA deve se comportar como um vendedor da própria academia.

---

# Estrutura Multi-Tenant

O sistema deve obrigatoriamente funcionar em arquitetura multi-tenant.

Cada academia deve possuir:
- usuários próprios
- leads próprios
- campanhas próprias
- alunos próprios
- configurações próprias
- conversas próprias
- WhatsApp próprio

Os dados devem possuir isolamento lógico.

---

# Estrutura WhatsApp Multi-Tenant

Cada academia deverá possuir seu próprio número de WhatsApp integrado ao sistema.

O WhatsApp faz parte da arquitetura multi-tenant.

Cada tenant possuirá:
- número próprio
- sessões próprias
- campanhas próprias
- conversas próprias
- automações próprias
- contexto IA próprio

O número WhatsApp será configurado dentro do módulo:
"Configuração da Academia".

A integração deverá permitir:
- conexão WhatsApp individual
- gerenciamento de sessão
- envio de mensagens
- recebimento de mensagens
- acompanhamento de status conexão

A IA deve utilizar o contexto da academia vinculada ao número WhatsApp correspondente.

As automações do n8n deverão respeitar obrigatoriamente o contexto do tenant e do WhatsApp vinculado.

Objetivo:
garantir isolamento operacional completo entre academias.

---

# Stack Tecnológica

## Frontend
- React
- Vite
- JavaScript
- Lovable
- Cursor

## Backend
- FastAPI

## Banco de Dados
- Supabase
- PostgreSQL

## IA
- OpenAI API

## Automação
- n8n

## Infraestrutura
- DigitalOcean

## Deploy Frontend
- Vercel

---

# Estratégia Frontend

O frontend do projeto será desenvolvido utilizando:

- React
- Vite
- Lovable
- Cursor

O Lovable será utilizado principalmente para:
- estrutura visual
- layouts
- componentes
- páginas administrativas
- dashboards
- aceleração UI/UX

O Cursor será utilizado para:
- lógica frontend
- integrações
- componentização
- organização arquitetura
- estados
- APIs
- funcionalidades

A arquitetura frontend deve:
- manter componentização limpa
- facilitar manutenção
- permitir evolução rápida do MVP
- evitar complexidade desnecessária
- priorizar velocidade de entrega

O frontend deve possuir:
- visual moderno
- experiência SaaS
- responsividade
- organização modular

---

# Objetivo Técnico Atual

Estruturar:
- backend FastAPI
- autenticação
- multi-tenant
- APIs principais
- integração Supabase
- fluxo operacional do MVP

---

# Arquitetura Desejada

A arquitetura deve seguir:

- código modular
- backend desacoplado
- APIs REST
- componentização frontend
- escalabilidade SaaS
- separação frontend/backend
- organização por módulos
- simplicidade operacional
- evitar overengineering

---

# Módulos do MVP

## 1. Auth

Responsável por:
- login
- cadastro
- recuperação de senha
- autenticação JWT
- controle de usuários

Integração:
- Supabase Auth

---

## 2. Dashboard

Tela principal do sistema.

Objetivo:
mostrar visão operacional resumida da operação comercial.

O dashboard NÃO deve ser BI avançado inicialmente.

Deve possuir:
- cards de resumo
- leads do dia
- conversões
- campanhas ativas
- conversas ativas
- status IA
- pipeline resumido
- leads recentes
- últimas interações

Objetivo:
passar sensação de operação viva e funcionando.

---

## 3. Configuração da Academia

Responsável por:
- dados da academia
- perfil comercial
- modalidades
- planos
- valores
- diferenciais
- tom de comunicação
- configuração WhatsApp

A IA utilizará essas informações para personalizar as conversas.

O usuário poderá:
- preencher manualmente
OU
- permitir leitura automática via IA

A IA poderá analisar:
- website
- Instagram
- descrição da academia

Objetivo:
gerar perfil comercial automaticamente.

Esse módulo é extremamente importante para contextualização da IA.

---

## 4. Central de Leads

Principal módulo operacional do MVP.

Responsável por:
- cadastro manual de leads
- importação XLSX
- importação Google Sheets
- organização leads
- tags
- filtros
- status

Os leads serão utilizados nas campanhas IA.

---

## 5. CRM

CRM visual em formato Kanban.

Objetivo:
acompanhar evolução comercial dos leads.

Estrutura inicial simples.

Etapas padrão:
- Novo Lead
- Contato Iniciado
- Conversando
- Interesse
- Agendado
- Negociação
- Fechado
- Perdido

A IA poderá atualizar etapas automaticamente.

O CRM NÃO deve ser complexo no MVP.

Objetivo:
gestão operacional simples.

---

## 6. Campanhas

Módulo principal de automação IA.

Responsável por:
- seleção de leads
- agrupamento por tags
- configuração campanhas
- escolha de scripts IA
- ativação campanhas

O usuário poderá:
- usar scripts pré-definidos
OU
- criar prompts personalizados

Exemplos:
- Venda agressiva
- Gerar visitas
- Reativar leads
- Matrícula
- Follow-up

Ao ativar campanha:
- n8n inicia automação
- WhatsApp inicia conversa
- IA responde automaticamente
- IA conduz negociação

Esse é um dos principais diferenciais do produto.

---

## 7. Chat IA

Responsável por:
- acompanhamento conversas
- supervisão humana
- intervenção manual

O usuário poderá:
- visualizar conversas IA
- responder manualmente
- assumir atendimento quando necessário

Objetivo:
garantir controle humano da operação.

---

## 8. Alunos

Responsável por:
- visualizar alunos convertidos
- histórico básico
- dados aluno

Fluxo:
quando lead converte matrícula:
- deixa de ser lead
- vira aluno
- migra para tabela de alunos

---

# Fluxo Principal do Produto

Academia cria conta
↓
Configura perfil comercial
↓
Configura WhatsApp
↓
Leads entram no sistema
↓
Leads organizados por tags
↓
Usuário cria campanha
↓
IA inicia conversa WhatsApp
↓
Lead interage com IA
↓
CRM acompanha negociação
↓
Usuário supervisiona via Chat IA
↓
Lead converte
↓
Lead vira aluno

---

# Relatórios MVP

O sistema deve possuir:
- relatórios simples
- exportação XLSX/CSV
- visão operacional

Relatórios iniciais:
- leads
- campanhas
- conversões
- alunos
- conversas

Não desenvolver BI avançado inicialmente.

---

# Prioridades Técnicas Atuais

1. Estrutura backend FastAPI
2. Auth
3. Multi-tenant
4. Configuração Academia
5. Integração WhatsApp
6. Central Leads
7. CRM
8. Campanhas
9. Chat IA
10. Alunos
11. Relatórios básicos

---

# Regras Importantes

- foco total no MVP
- evitar complexidade excessiva
- evitar overengineering
- arquitetura limpa
- código modular
- commits pequenos
- priorizar velocidade de entrega
- manter estrutura escalável
- foco operacional antes de analytics
- simplicidade antes de sofisticação

---

# Objetivo Estratégico

Criar um SaaS AI-first capaz de automatizar atendimento e operação comercial de academias através de IA contextualizada via WhatsApp.