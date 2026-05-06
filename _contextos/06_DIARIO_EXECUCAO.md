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
