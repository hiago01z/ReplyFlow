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

## Sessão 5 — 2026-05-06

### O que foi feito:
- [x] Criado `README.md` na **raiz do repositório** — resolve o problema do GitHub não exibir o README (o arquivo estava apenas em `replyflow/README.md`, subdiretório)
- [x] Sanitizado `replyflow/.env.example` — removidos credenciais reais que estavam no arquivo (Supabase, OpenAI, Stripe, Google, Resend); substituídos por placeholders com comentários de onde obter cada valor
- [x] Criado `replyflow/.env.local` com as credenciais recuperadas do `.env.example` original para rodar localmente
- [x] Criado `replyflow/.dropboxignore` — instrui o Dropbox a não sincronizar `node_modules/`, `.next/`, `out/`, `dist/`; resolve o problema de bloqueio de arquivos durante `npm install`
- [x] Executado `npm install` na pasta `replyflow/` — 472 pacotes instalados (Node.js v24.14.1, npm v11.11.0)
- [x] **Corrigido bug crítico** em `src/app/page.tsx` — arquivo tinha código duplicado (a landing page estava 2x no arquivo, com o componente fechando na linha 394 mas com mais JSX nas linhas 395-596); causava erro TypeScript TS1128. Arquivo truncado para as 394 linhas corretas
- [x] **Corrigidos 14 erros TypeScript** em 8 arquivos:
  - `src/lib/supabase/middleware.ts` — `cookiesToSet` sem tipo explícito
  - `src/lib/supabase/server.ts` — mesmo problema
  - `src/app/(dashboard)/billing/page.tsx` — cast direto `any[] as T | null` inválido → `as unknown as T`
  - `src/app/(dashboard)/settings/page.tsx` — mesmo problema
  - `src/app/api/billing/checkout/route.ts` — mesmo problema
  - `src/app/api/billing/portal/route.ts` — mesmo problema
  - `src/app/api/reviews/[id]/ignore/route.ts` — mesmo problema
  - `src/app/api/settings/route.ts` — `PostgrestFilterBuilder` não é `Promise` mas é `PromiseLike` → trocar tipo do array
- [x] Confirmado `npm run type-check` — **zero erros TypeScript**
- [x] Confirmado `npm run dev` — servidor sobe em 4.6s em `localhost:3000`
- [x] Criado `_contextos/08_SPRINT5_VALIDACAO_DEPLOY.md` — log técnico desta sessão

### Decisões técnicas tomadas:
- Padrão para joins Supabase sem geração de tipos: usar `as unknown as T | null` (seguro em runtime pois Supabase retorna o objeto correto em relacionamentos N:1; o TypeScript apenas não consegue inferir sem type generation)
- `PromiseLike<unknown>[]` em vez de `Promise<unknown>[]` para aceitar `PostgrestFilterBuilder` (que implementa `.then()` mas não `.catch()/.finally()`)
- `.dropboxignore` na pasta `replyflow/` para evitar que o Dropbox bloqueie `node_modules` durante `npm install`

### Alertas de segurança (ação necessária):
⚠️ As credenciais que estavam no `.env.example` foram removidas do arquivo, mas **já estavam no histórico git**. Regenerar obrigatoriamente:
- Supabase service role key
- OpenAI API key (`sk-proj-x7c8...`)
- Stripe secret key (`sk_test_51TRvy...`)
- Google OAuth client secret
- Resend API key

### Próxima ação:
**Sprint 6** — Melhorias e Deploy:
1. Regenerar credenciais expostas no histórico git
2. Corrigir Stripe Price IDs no `.env.local` (estão como `prod_...` em vez de `price_...`)
3. Rodar migrations Supabase (001 → 002 → seed)
4. Testar fluxo completo: register → onboarding → reviews
5. Deploy na Vercel com variáveis de ambiente configuradas

---

## Sessão 6 — 2026-05-06

### O que foi feito:
- [x] **Design system implementado** (`src/app/globals.css`):
  - CSS variables: `--brand-*`, `--bg-page` (#f5f5fa), `--bg-card`, `--border`, `--shadow-*`, `--radius-*`
  - Utilitários customizados: `.card`, `.card-sm`, `.brand-gradient`, `.animate-fade-in`, `.animate-slide-up`
- [x] Criado `src/lib/utils.ts` — helper `cn()` com clsx + tailwind-merge
- [x] **Componentes UI compartilhados:**
  - `src/components/ui/Button.tsx` — 5 variants (primary/secondary/ghost/danger/outline), 3 sizes, loading spinner
  - `src/components/ui/Badge.tsx` — 8 cores + `dot` prop para status indicator
  - `src/components/ui/Input.tsx` — Input e Textarea com label, error, hint
- [x] **Redesign completo de todas as páginas (inspiração Linear/Vercel):**
  - `(auth)/layout.tsx` — split-screen: painel de marca gradiente à esquerda, formulário à direita
  - `(auth)/login/page.tsx` e `register/page.tsx` — Button + Input, Google OAuth
  - `components/layout/Sidebar.tsx` — Lucide icons, avatar de iniciais, badge de plano colorido
  - `(dashboard)/dashboard/page.tsx` — 4 stat cards linkáveis, progress bar de reply rate, CTA contextual
  - `components/reviews/ReviewCard.tsx` — estrelas SVG, avatar gradiente, Badge de status, accordion
  - `components/reviews/ReviewList.tsx` — barra de filtros com SlidersHorizontal, empty state com Search icon
  - `(dashboard)/locations/page.tsx` — badges Wifi para conectado, info box azul
  - `(dashboard)/billing/page.tsx` — ícones por plano (Zap/Crown/Building2), badge "MAIS POPULAR" no Pro
  - `components/settings/SettingsForm.tsx` e `settings/page.tsx` — seções com ícones Building2/User/Mail
  - `app/onboarding/page.tsx` — chips de step progress, grid de nicho 3×2, seletor de tom com checkmark
- [x] Criado `_contextos/09_DESIGN_SYSTEM.md` — documentação completa do design system

### Decisões de design:
- **Lucide React** como biblioteca exclusiva de ícones
- **Sem shadcn/chakra** — sistema proprietário sobre Tailwind (sem lock-in, total controle)
- `cn()` de clsx + tailwind-merge para composição de classes sem conflito de override
- Split-screen em auth: diferenciação visual forte entre marca e funcionalidade
- `#f5f5fa` como fundo (não branco puro) — menos fadiga visual em sessões longas

### Próxima ação:
- Iniciar servidor de desenvolvimento para testar visualmente todas as páginas redesenhadas
- Sprint 7: Toast notifications, Modal reutilizável, modo escuro

---

## Sessão 7 — 2026-05-06

### O que foi feito:
- [x] **Diagnóstico CSS** — `postcss.config.js` ausente + `autoprefixer` não instalado → Tailwind não processava. Criado o config e instalado o autoprefixer. Servidor reiniciado em Next.js 15.3.9
- [x] **Sistema de Toast** (`src/components/ui/Toast.tsx`):
  - `ToastProvider` adicionado ao root layout
  - `useToast()` hook com métodos `success`, `error`, `warning`, `info`
  - Entrada/saída com animação CSS (opacity + translateY), auto-dismiss em 4s
  - Máximo 5 toasts simultâneos, canto inferior direito
- [x] **Tela de confirmação de e-mail** (`src/app/(auth)/confirm-email/page.tsx`):
  - Rota `/confirm-email?email=...`
  - Dicas de troubleshooting (spam, remetente supabase)
  - Registro atualizado para detectar se sessão foi criada imediatamente (confirmação desativada) ou não
- [x] **Recuperação de senha** — fluxo completo:
  - `/forgot-password` — formulário de solicitação de link via Supabase `resetPasswordForEmail()`
  - `/reset-password` — formulário de nova senha com listener `PASSWORD_RECOVERY` do Supabase
  - Link "Esqueceu a senha?" na página de login conectado (antes apontava para `#`)
- [x] **Demo seed** (`src/app/api/demo/seed/route.ts`):
  - `POST /api/demo/seed` — insere 6 reviews fictícios (mix de ratings, status pending/published)
  - `DELETE /api/demo/seed` — remove reviews de demo
  - Reviews identificados por prefixo `demo_` no `google_review_id`
- [x] **DemoSeedButton** (`src/components/dashboard/DemoSeedButton.tsx`):
  - Banner no dashboard quando há local mas não há reviews
  - Botão "Carregar demo" chama a API e usa `router.refresh()` + toast de sucesso
  - Botão "X" para dispensar o banner
- [x] **SettingsForm** — migrado de banner inline de sucesso para `useToast()`
- [x] **TypeScript** — zero erros após correção do `useRef` tipo e `searchParams: Promise<>` no Next.js 15

### Correção de auth para testes:
- Google OAuth: erro `"Unsupported provider: provider is not enabled"` → Google não está ativado no Supabase. Para testar, usar e-mail/senha
- Supabase com confirmação de e-mail: desativar em Authentication → Email → "Enable email confirmations" para dev

### Próxima ação:
- Sprint 8: Modal reutilizável, modo escuro, melhorias na landing page (hero animado, preview do produto)

---
