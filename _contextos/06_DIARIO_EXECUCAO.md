# 📓 Diário de Execução — ReplyFlow

> Log cronológico de tudo que foi feito. Sempre atualizar ao final de cada sessão.

---

## Sessão 1 — 2026-05-06

### O que foi feito:
- [x] Criado sistema de contextos em `_contextos/`
- [x] Criado `00_INDEX.md` como mapa central
- [x] Concluída **Etapa 1** — 3 ideias analisadas, ReplyFlow escolhida
- [x] **Etapa 2** — Modelagem do negócio completa (planos, MRR, CAC/LTV, estratégia de crescimento)
- [x] **Etapa 3** — Arquitetura técnica completa (stack, schema DB, diagrama, custos)
- [x] **Etapa 4** — MVP definido (features incluídas/excluídas, sprint plan 14 dias)
- [x] **Etapa 5** — Estrutura do projeto definida (pastas, padrões, setup local)
- [x] **Etapa 6 Sprint 1** — Arquivos base criados:
  - `replyflow/package.json` — dependências
  - `replyflow/src/types/index.ts` — tipagem completa
  - `replyflow/src/lib/supabase/` — client, server, middleware
  - `replyflow/src/lib/openai/generateResponse.ts` — geração de resposta com IA
  - `replyflow/src/lib/stripe/client.ts` — Stripe + planos
  - `replyflow/src/middleware.ts` — auth guard
  - `replyflow/src/app/page.tsx` — landing page
  - `replyflow/src/app/layout.tsx` — root layout
  - `replyflow/src/app/api/reviews/route.ts` — GET reviews
  - `replyflow/src/app/api/reviews/[id]/generate/route.ts` — POST gerar resposta IA
  - `replyflow/src/app/api/reviews/[id]/publish/route.ts` — POST publicar resposta
  - `replyflow/src/app/api/webhooks/stripe/route.ts` — webhook Stripe
  - `replyflow/src/app/api/cron/fetch-reviews/route.ts` — cron job reviews
  - `replyflow/supabase/migrations/001_initial_schema.sql` — schema completo com RLS
  - `replyflow/vercel.json` — cron config
  - `replyflow/docs/setup.md` — guia de setup

### Decisões tomadas:
- SaaS: **ReplyFlow** — gestão de reviews com IA para PMEs locais
- Stack: Next.js 14 + Supabase + OpenAI GPT-4o-mini + Stripe
- Mercado primário: Brasil / PMEs locais
- Modelo: assinatura mensal recorrente (R$97 / R$197 / R$497)

### Próxima ação:
**Sprint 2** — Integração completa:
1. Páginas de auth (login/register) com Supabase Auth
2. Onboarding flow (criar organização + primeiro local)
3. Dashboard de reviews (UI com shadcn/ui)
4. Integração Google My Business OAuth
5. Instalar dependências e testar rodando localmente

---

## Sessão 2 — 2026-05-06

### O que foi feito:
- [x] Criado `replyflow/README.md` — documentação completa do projeto
- [x] Criado `_contextos/07_REGRAS_PROJETO.md` — regras obrigatórias (README, diário, padrões, segurança)
- [x] Atualizado `00_INDEX.md` com novo contexto `07_REGRAS_PROJETO.md`
- [x] **Sprint 2 concluído** — todas as funcionalidades implementadas:
  - `src/app/(auth)/layout.tsx` — layout das páginas de auth
  - `src/app/(auth)/login/page.tsx` — login com email + Google OAuth
  - `src/app/(auth)/register/page.tsx` — cadastro com email + Google OAuth
  - `src/app/api/auth/callback/route.ts` — cria organização automaticamente para novos usuários OAuth
  - `src/app/onboarding/page.tsx` — fluxo de onboarding em 3 etapas (empresa → local → nicho/tom)
  - `src/app/api/onboarding/route.ts` — API para criar organização + primeiro local
  - `src/app/(dashboard)/layout.tsx` — layout com sidebar, verificação de auth e organização
  - `src/components/layout/Sidebar.tsx` — sidebar com navegação, badge de plano, logout
  - `src/app/(dashboard)/dashboard/page.tsx` — visão geral com métricas (pendentes, publicados, negativos)
  - `src/app/(dashboard)/reviews/page.tsx` — listagem com filtros (status, rating, local)
  - `src/components/reviews/ReviewList.tsx` — lista com filtros e paginação
  - `src/components/reviews/ReviewCard.tsx` — card expansível com geração de IA e publicação
  - `src/app/(dashboard)/locations/page.tsx` — gerenciar locais + botão de conectar Google
  - `src/app/api/reviews/[id]/ignore/route.ts` — ignorar review
  - `src/app/api/google/auth/route.ts` — iniciar OAuth Google My Business
  - `src/app/api/google/callback/route.ts` — callback OAuth, salva tokens no local
- [x] README atualizado com novos endpoints e sprints

### Decisões técnicas tomadas:
- Onboarding redireciona para `/onboarding` automaticamente para novos usuários OAuth (detectado no callback)
- Google OAuth salva `access_token` e `refresh_token` diretamente na tabela `locations` (isolamento por local)
- `ReviewCard` usa client-side fetch para gerar/publicar sem recarregar a página inteira (`router.refresh()` atualiza Server Components)

### Próxima ação:
**Sprint 3** — Publicação real + Alertas:
1. `lib/google/myBusiness.ts` — wrapper da Google My Business API para buscar e publicar reviews
2. Implementar o cron job real (`/api/cron/fetch-reviews`)
3. Alertas por e-mail via Resend (review negativo recebido)
4. Página de Billing com integração Stripe Checkout
5. `npm install` e testar localmente

---

## Sessão 3 — 2026-05-06

### O que foi feito:
- [x] **Sprint 3 concluído** — todas as funcionalidades implementadas:
  - `src/lib/google/myBusiness.ts` — `GoogleMyBusinessClient` com `listUnansweredReviews()`, `replyToReview()`, `listAccounts()`, `listLocations()`, refresh automático do access_token
  - `src/app/api/cron/fetch-reviews/route.ts` — cron job real: busca reviews via GMB API, upsert no DB, dispara alertas para reviews ≤ 2 estrelas
  - `src/lib/email/alerts.ts` — templates HTML `sendNegativeReviewAlert()` e `sendWelcomeEmail()` via Resend
  - `src/app/api/auth/callback/route.ts` — agora dispara e-mail de boas-vindas para novos usuários
  - `src/app/api/reviews/[id]/publish/route.ts` — implementação real da chamada GMB API (`replyToReview`)
  - `src/app/(dashboard)/billing/page.tsx` — página de billing com plano atual, botões de upgrade, portal Stripe
  - `src/app/api/billing/checkout/route.ts` — cria Stripe Checkout Session, redireciona para pagamento
  - `src/app/api/billing/portal/route.ts` — abre Stripe Customer Portal (cancelar, trocar cartão)
  - `src/app/(dashboard)/settings/page.tsx` — página de configurações (nome empresa + perfil)
  - `src/components/settings/SettingsForm.tsx` — formulário de settings (client component)
  - `src/app/api/settings/route.ts` — PATCH endpoint para atualizar org + user
- [x] README atualizado — Sprint 3 ✅, novos endpoints adicionados

### Decisões técnicas tomadas:
- GMB API: token refresh transparente dentro do `GoogleMyBusinessClient.fetch()` — sem exposição para o caller
- Cron job: falhas de e-mail silenciosas (`.catch(() => null)`) para não bloquear o loop de locais
- Billing: `POST` redirect via `status: 303` seguro (evita re-submissão de formulário)
- Settings: atualização parcial com Zod (campos opcionais — só atualiza o que for passado)

### Próxima ação:
**Sprint 4** — Landing page polish + testes + deploy:
1. Melhorar landing page (`src/app/page.tsx`) — depoimentos, FAQ, animações
2. Páginas de erro (`src/app/error.tsx`) e not-found (`src/app/not-found.tsx`)
3. `npm install` e testar localmente (`npm run dev`)
4. Corrigir erros de TypeScript (`npm run build`)
5. Deploy na Vercel com variáveis de ambiente configuradas

---

## Sessão 4 — 2026-05-06

### O que foi feito:
- [x] Criado `replyflow/dev.ps1` — script PowerShell para rodar o SaaS localmente:
  - Verifica Node.js, cria `.env.local` do `.env.example` se não existir
  - Valida variáveis críticas, instala dependências se `node_modules` ausente
  - Verifica/libera porta 3000, abre navegador em `localhost:3000` automaticamente
- [x] **Sprint 4 concluído**:
  - `src/app/page.tsx` — landing page reformulada com depoimentos (3 cards), FAQ com `<details>`, barra de social proof, mobile-responsivo, seção "Depoimentos" e "FAQ" no nav
  - `src/app/error.tsx` — global error boundary com botão "Tentar novamente" e link dashboard
  - `src/app/not-found.tsx` — página 404 clean
  - `src/components/ui/Skeleton.tsx` — `SkeletonCard`, `SkeletonStat`, `SkeletonReviewCard`
  - `src/app/(dashboard)/dashboard/loading.tsx` — loading state do dashboard
  - `src/app/(dashboard)/reviews/loading.tsx` — loading state da página de reviews
  - `supabase/migrations/002_sprint3_additions.sql` — campos `last_review_check`, `subscription_status`, índices e unique constraint
  - `supabase/seed.sql` — dados de demo (org, local, 4 reviews, 1 resposta publicada)
- [x] README atualizado — Sprint 4 ✅, instrução do `dev.ps1` adicionada

### Decisões técnicas:
- `dev.ps1` não usa `&&` (PowerShell não suporta) — usa ponto-e-vírgula e `Push-Location`/`Pop-Location`
- FAQ usa `<details>/<summary>` nativo HTML (sem JS) — mais leve e acessível
- Seed usa `DO $$ ... $$` para ser idempotente em relação ao usuário logado

### Próxima ação:
**Pronto para testar localmente:**
1. Preencher `.env.local` com credenciais reais (Supabase, Stripe, OpenAI)
2. Executar `.\dev.ps1` na pasta `replyflow/`
3. Rodar as migrations no Supabase Dashboard (001 → 002 → seed opcional)
4. Testar fluxo completo: register → onboarding → conectar Google → reviews
5. Deploy na Vercel quando validado

---
