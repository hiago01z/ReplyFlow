# Etapa 5 — Estrutura do Projeto

> Status: ✅ Concluída
> Data: 2026-05-06

---

## Estrutura de Pastas

```
replyflow/
├── .env.local                    # Variáveis de ambiente (nunca versionar)
├── .env.example                  # Template de variáveis (versionar)
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── components.json               # shadcn/ui config
│
├── public/
│   ├── logo.svg
│   └── og-image.png
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Landing page (/)
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/               # Grupo de rotas de auth
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/          # Grupo de rotas protegidas
│   │   │   ├── layout.tsx        # Layout com sidebar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # Visão geral
│   │   │   ├── reviews/
│   │   │   │   ├── page.tsx      # Lista de reviews
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Detalhe do review
│   │   │   ├── locations/
│   │   │   │   ├── page.tsx      # Gerenciar locais
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── billing/
│   │   │   │   └── page.tsx      # Planos e pagamento
│   │   │   └── settings/
│   │   │       └── page.tsx      # Configurações da conta
│   │   │
│   │   ├── onboarding/
│   │   │   └── page.tsx          # Fluxo pós-cadastro
│   │   │
│   │   └── api/                  # API Routes
│   │       ├── auth/
│   │       │   └── callback/
│   │       │       └── route.ts  # Supabase OAuth callback
│   │       ├── reviews/
│   │       │   ├── route.ts      # GET reviews
│   │       │   ├── ingest/
│   │       │   │   └── route.ts  # POST receber reviews (cron)
│   │       │   └── [id]/
│   │       │       ├── generate/
│   │       │       │   └── route.ts  # POST gerar resposta IA
│   │       │       └── publish/
│   │       │           └── route.ts  # POST publicar resposta
│   │       ├── locations/
│   │       │   └── route.ts      # CRUD locais
│   │       ├── google/
│   │       │   ├── auth/
│   │       │   │   └── route.ts  # Iniciar OAuth GMB
│   │       │   └── callback/
│   │       │       └── route.ts  # Callback OAuth GMB
│   │       ├── webhooks/
│   │       │   └── stripe/
│   │       │       └── route.ts  # Webhook Stripe
│   │       └── cron/
│   │           └── fetch-reviews/
│   │               └── route.ts  # Cron job (chamado pela Vercel)
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── reviews/
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── ReviewList.tsx
│   │   │   ├── ReviewFilters.tsx
│   │   │   └── ResponseEditor.tsx
│   │   ├── locations/
│   │   │   ├── LocationCard.tsx
│   │   │   └── LocationForm.tsx
│   │   ├── billing/
│   │   │   └── PlanCard.tsx
│   │   └── landing/
│   │       ├── Hero.tsx
│   │       ├── HowItWorks.tsx
│   │       ├── Pricing.tsx
│   │       └── Footer.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Supabase browser client
│   │   │   ├── server.ts         # Supabase server client
│   │   │   └── middleware.ts     # Supabase auth middleware
│   │   ├── openai/
│   │   │   └── generateResponse.ts  # Lógica de geração de resposta
│   │   ├── stripe/
│   │   │   ├── client.ts
│   │   │   └── plans.ts          # Definição dos planos
│   │   ├── google/
│   │   │   └── myBusiness.ts     # GMB API wrapper
│   │   └── utils.ts              # Helpers gerais
│   │
│   ├── hooks/
│   │   ├── useReviews.ts
│   │   ├── useLocations.ts
│   │   └── useUser.ts
│   │
│   ├── types/
│   │   ├── database.ts           # Tipos gerados pelo Supabase
│   │   └── index.ts              # Tipos globais da aplicação
│   │
│   └── middleware.ts             # Next.js middleware (auth guard)
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
│
└── docs/
    └── setup.md                  # Como rodar localmente
```

---

## Padrões de Código

### Nomenclatura
```
Arquivos:      kebab-case         → review-card.tsx, use-reviews.ts
Componentes:   PascalCase         → ReviewCard, ResponseEditor
Funções:       camelCase          → generateResponse(), fetchReviews()
Constantes:    UPPER_SNAKE_CASE   → MAX_LOCATIONS_PER_PLAN
Tipos/Interfaces: PascalCase      → Review, Organization, Location
```

### Convenções de Componentes React
```tsx
// ✅ Sempre tipar props
interface ReviewCardProps {
  review: Review
  onGenerateResponse: (id: string) => void
}

// ✅ Usar Server Components por padrão, 'use client' apenas quando necessário
// ✅ Exportar como default no arquivo de página
// ✅ Exportar como named export em componentes reutilizáveis
```

### API Routes
```ts
// ✅ Sempre validar body com Zod
// ✅ Sempre verificar autenticação antes de qualquer operação
// ✅ Retornar erros com status code correto
// ✅ Nunca expor stack traces em produção
```

### Banco de Dados
```ts
// ✅ Usar Supabase server client em API Routes (nunca o client-side)
// ✅ Row Level Security ativado para todas as tabelas
// ✅ Sempre filtrar por organization_id para isolar dados
```

---

## Setup Local (Passo a Passo)

```bash
# 1. Clonar e instalar
git clone <repo>
cd replyflow
npm install

# 2. Configurar variáveis
cp .env.example .env.local
# Preencher todas as variáveis no .env.local

# 3. Supabase local (opcional, ou usar projeto cloud)
npx supabase init
npx supabase start
npx supabase db push

# 4. Rodar em desenvolvimento
npm run dev
# Acessa em http://localhost:3000

# 5. Stripe webhook local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Vercel Config (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-reviews",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

---

## Próxima Etapa
→ [06_DIARIO_EXECUCAO.md](06_DIARIO_EXECUCAO.md) — Iniciar Etapa 6: Execução
