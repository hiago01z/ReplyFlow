<div align="center">
  <h1>⚡ ReplyFlow</h1>
  <p><strong>Sua reputação no piloto automático.</strong></p>
  <p>SaaS de gestão de reviews com IA para pequenas e médias empresas locais.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/Stripe-Pagamentos-635bff?logo=stripe" alt="Stripe" />
    <img src="https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai" alt="OpenAI" />
  </p>
</div>

---

## O que é o ReplyFlow?

ReplyFlow é um SaaS que responde automaticamente reviews do Google Meu Negócio usando IA personalizada — no tom certo, no nicho certo, sem intervenção manual.

**Problema resolvido:** Donos de negócios locais (clínicas, restaurantes, academias) perdem clientes por não responder reviews. Fazer isso manualmente consome horas.

**Solução:** A IA lê cada review e gera uma resposta personalizada para o negócio. O dono aprova com 1 clique (ou ativa o modo automático).

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes (Serverless) |
| Banco de Dados | PostgreSQL via Supabase |
| Autenticação | Supabase Auth (email + Google OAuth) |
| Pagamentos | Stripe (assinaturas recorrentes em BRL) |
| IA | OpenAI GPT-4o-mini |
| Filas | Upstash QStash |
| Cache / Rate Limit | Upstash Redis |
| Email | Resend |
| WhatsApp | Evolution API |
| Analytics | Vercel Analytics |
| Deploy | Vercel |

---

## Planos e Preços

| Plano | Preço | Locais | Destaque |
|-------|-------|--------|---------|
| Free | Grátis | 1 | 10 respostas/mês |
| Starter | R$ 97/mês | 1 | Respostas ilimitadas |
| **Pro** | **R$ 197/mês** | **3** | **Alerta WhatsApp + aprovação 1 clique** |
| Agência | R$ 497/mês | Ilimitado | Painel multi-cliente |

---

## Estrutura do Projeto

```
replyflow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, Register
│   │   ├── (dashboard)/        # Reviews, Locais, Billing, Settings
│   │   ├── onboarding/         # Fluxo pós-cadastro
│   │   └── api/                # API Routes
│   ├── components/             # Componentes React reutilizáveis
│   ├── lib/                    # Supabase, OpenAI, Stripe, Google
│   ├── hooks/                  # React Hooks customizados
│   └── types/                  # Tipos TypeScript globais
├── supabase/
│   └── migrations/             # Schema SQL com Row Level Security
├── docs/
│   └── setup.md                # Guia de setup local
└── _contextos/ (pasta raiz)    # Contextos do projeto (Obsidian)
```

---

## Setup Rápido

### Pré-requisitos
- Node.js 20+
- Conta no [Supabase](https://supabase.com)
- Conta no [Stripe](https://stripe.com)
- Conta na [OpenAI](https://platform.openai.com)

### 1. Instalar dependências

```bash
cd replyflow
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
# Preencher todas as variáveis
```

### 3. Criar banco de dados

No Supabase Dashboard → SQL Editor, execute:
```
supabase/migrations/001_initial_schema.sql
```

### 4. Rodar localmente

**Opção A — Script automatizado (recomendado):**
```powershell
.\dev.ps1
```
O script verifica Node.js, cria `.env.local`, instala dependências, verifica porta 3000 e abre o navegador automaticamente.

**Opção B — Manual:**
```bash
npm run dev
# http://localhost:3000
```

### 5. Webhook Stripe (desenvolvimento)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

> Guia completo em [docs/setup.md](docs/setup.md)

---

## Status do Desenvolvimento

| Etapa | Status |
|-------|--------|
| Etapa 1 — Definição Estratégica | ✅ Concluída |
| Etapa 2 — Modelo de Negócio | ✅ Concluída |
| Etapa 3 — Arquitetura Técnica | ✅ Concluída |
| Etapa 4 — MVP | ✅ Concluída |
| Etapa 5 — Estrutura do Projeto | ✅ Concluída |
| Etapa 6 — Sprint 1 (Fundação) | ✅ Concluída |
| Etapa 6 — Sprint 2 (Auth + Dashboard) | ✅ Concluída |
| Etapa 6 — Sprint 3 (Publicação + Alertas) | ✅ Concluída |
| Etapa 6 — Sprint 4 (Landing + Polimento) | ✅ Concluída |
| Etapa 6 — Sprint 5 (Validação Local) | ✅ Concluída |
| Etapa 6 — Sprint 6 (Design System) | ✅ Concluída |
| Etapa 6 — Sprint 7 (Auth + Toast + Demo) | ✅ Concluída |
| Etapa 6 — Sprint 8 (Modal + Dark Mode + CountUp) | ✅ Concluída |
| Etapa 6 — Sprint 9 (Analytics + Auto-publish) | ✅ Concluída |
| Etapa 6 — Sprint 10 (Limites de plano + WhatsApp + Favicon) | ✅ Concluída |
| Etapa 6 — Sprint 11 (Deploy Vercel + cron-job.org) | ✅ Concluída |
| Etapa 6 — Sprint 12 (Stripe + Google OAuth prod) | ✅ Concluída |
| Etapa 6 — Sprint 13 (SEO + Rate Limiting + Vercel Analytics) | ✅ Concluída |
| Etapa 6 — Sprint 14 (Dashboard Sparkline + TS/deps fixes) | ✅ Concluída |
| Etapa 6 — Sprint 15 (Alert email settings + Review highlight) | ✅ Concluída |
| Etapa 6 — Sprint 16 (Busca por texto + Export CSV) | ✅ Concluída |
| Etapa 6 — Sprint 17 (Upgrade banner + Location sync status) | ✅ Concluída |
| Etapa 6 — Sprint 18 (Sidebar badge + Analytics por local) | ✅ Concluída |
| Etapa 6 — Sprint 19 (Bulk actions em reviews) | ✅ Concluída |
| Etapa 6 — Sprint 20 (Notificações Realtime) | ✅ Concluída |
| Etapa 6 — Sprint 21 (WhatsApp 1-click approval) | ✅ Concluída |
| Etapa 6 — Sprint 22 (Relatório PDF mensal) | ✅ Concluída |
| Etapa 6 — Sprint 23 (Sync manual de reviews) | ✅ Concluída |
| Etapa 6 — Sprint 24 (Checklist de onboarding) | ✅ Concluída |
| Etapa 6 — Sprint 25 (Painel multi-cliente Agência) | ✅ Concluída |
| Etapa 6 — Sprint 26 (Add-on extra locais Stripe) | ✅ Concluída |
| Etapa 6 — Sprint 27 (Digest semanal por email) | ✅ Concluída |
| Etapa 6 — Sprint 28 (Landing features + cron fixes) | ✅ Concluída |
| Etapa 6 — Sprint 29 (Trial system 7 dias + Stripe webhook fix) | ✅ Concluída |
| Etapa 6 — Sprint 30 (UpgradeModal — gate visual de plano) | ✅ Concluída |
| Etapa 6 — Sprint 31 (Templates de resposta por nicho/rating) | ✅ Concluída |
| Etapa 6 — Sprint 32 (Rating Evolution Chart + Mobile polish) | ✅ Concluída |
| Etapa 6 — Sprint 33 (Webhook personalizado de notificação) | ✅ Concluída |
| Etapa 6 — Sprint 34 (Perfil público do local `/l/[slug]`) | ✅ Concluída |

---

## APIs Implementadas

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/reviews` | GET | Listar reviews com filtros (status, rating, locationId, search) |
| `/api/reviews/export` | GET | Exportar reviews filtrados como CSV (max 5000 linhas) |
| `/api/reviews/bulk` | POST | Gerar/publicar em lote (até 50 reviews) |
| `/api/reviews/[id]/approve` | GET | Aprovar e publicar via link WhatsApp (token HMAC) |
| `/api/reports/monthly` | GET | Relatório HTML/PDF mensal (Pro/Agency) |
| `/api/locations/[id]/sync` | POST | Sync manual de reviews para um local |
| `/api/agency/clients` | GET/POST | Listar/criar clientes da agência |
| `/api/reviews/[id]/generate` | POST | Gerar resposta com IA |
| `/api/reviews/[id]/publish` | POST | Publicar resposta no Google (GMB real) |
| `/api/reviews/[id]/ignore` | POST | Ignorar review |
| `/api/onboarding` | POST | Criar organização e primeiro local |
| `/api/webhooks/stripe` | POST | Webhook de eventos Stripe |
| `/api/cron/fetch-reviews` | GET | Cron job — busca reviews via GMB API (30min) |
| `/api/auth/callback` | GET | Callback OAuth Supabase |
| `/api/google/auth` | GET | Iniciar OAuth Google My Business |
| `/api/google/callback` | GET | Callback OAuth Google |
| `/api/billing/checkout` | POST | Criar Checkout Session Stripe |
| `/api/billing/portal` | POST | Redirecionar para Portal Stripe |
| `/api/settings` | PATCH | Atualizar nome da empresa, perfil, WhatsApp e webhook |
| `/api/settings/webhook/test` | POST | Enviar payload de teste para a URL de webhook configurada (Pro/Agency) |
| `/api/analytics` | GET | Métricas de reviews por período (7/30/90 dias) |
| `/api/demo/seed` | POST/DELETE | Inserir/remover reviews de demonstração |

---

## Contextos do Projeto (Obsidian)

Todo o planejamento estratégico e técnico está documentado em `_contextos/`:

| Arquivo | Conteúdo |
|---------|---------|
| `00_INDEX.md` | Mapa central e status atual |
| `01_ETAPA1_DEFINICAO_ESTRATEGICA.md` | 3 ideias analisadas + escolha |
| `02_ETAPA2_MODELO_DE_NEGOCIO.md` | Planos, MRR, CAC/LTV, crescimento |
| `03_ETAPA3_ARQUITETURA_TECNICA.md` | Stack, schema, diagrama, custos |
| `04_ETAPA4_MVP.md` | Features MVP, sprint plan |
| `05_ETAPA5_ESTRUTURA_PROJETO.md` | Pastas, padrões, setup |
| `06_DIARIO_EXECUCAO.md` | Log sessão a sessão |
| `07_REGRAS_PROJETO.md` | **Regras obrigatórias — leia sempre** (README, padrões, segurança) |
| `08_SPRINT5_VALIDACAO_DEPLOY.md` | Validação local, correções TypeScript, alertas de segurança |
| `09_DESIGN_SYSTEM.md` | Design system: tokens CSS, componentes UI, ícones Lucide, padrões de página |

---

## Licença

Proprietário — todos os direitos reservados.
