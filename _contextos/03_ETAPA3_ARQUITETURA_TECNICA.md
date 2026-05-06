# Etapa 3 — Arquitetura Técnica

> Status: ✅ Concluída
> Data: 2026-05-06

---

## Stack Escolhida

```
Frontend:   Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Backend:    Next.js API Routes + Serverless Functions (Vercel)
Banco:      PostgreSQL via Supabase (managed, free tier generoso)
Auth:       Supabase Auth (JWT, OAuth Google/GitHub)
Pagamento:  Stripe (assinaturas recorrentes)
IA:         OpenAI GPT-4o-mini (custo-benefício ideal)
Queue:      Upstash QStash (filas serverless para processar reviews)
Cache:      Upstash Redis (rate limiting + cache de respostas)
Email:      Resend (transacional, 3.000 emails/mês grátis)
WhatsApp:   Evolution API (self-hosted) ou Twilio WhatsApp API
Monitoramento: Sentry (erros) + Vercel Analytics
Deploy:     Vercel (frontend + API) — plano gratuito até escalar
```

---

## Justificativas das Escolhas

### Next.js 14 (App Router)
- Full-stack em um único repo — menor complexidade operacional
- Server Components reduzem JS no cliente → performance superior
- API Routes substituem backend separado no MVP
- Deploy gratuito na Vercel com edge functions
- SEO nativo (crítico para landing page e blog)

### Supabase (PostgreSQL)
- PostgreSQL gerenciado sem custo operacional
- Row Level Security (RLS) nativo — segurança sem esforço
- Realtime subscriptions para dashboard ao vivo
- Auth integrado (elimina serviço separado)
- Free tier: 500MB banco, 50.000 usuários, 2GB storage
- **Alternativa descartada:** Firebase (NoSQL dificulta queries relacionais complexas para reports)

### Stripe
- Padrão de mercado para SaaS — documentação excelente
- Webhooks confiáveis para controle de assinaturas
- Portal do cliente nativo (sem construir gestão de plano)
- Suporte a BRL nativo
- **Alternativa:** Hotmart/Kiwify — descartado (sem API para SaaS)

### OpenAI GPT-4o-mini
- Custo: ~$0.15/1M tokens input, $0.60/1M tokens output
- Estimativa: 500 tokens/resposta × 10.000 respostas/mês = ~$3/mês no início
- Qualidade suficiente para respostas de reviews (não precisa de GPT-4)
- Fácil troca para outro modelo no futuro

### Upstash (Redis + QStash)
- Serverless — sem servidor dedicado
- QStash: fila de mensagens para processar reviews sem bloquear request
- Redis: rate limiting para não explodir cota da OpenAI
- Free tier cobre o MVP inteiro

### Evolution API (WhatsApp)
- Open source, self-hosted no Railway ou Render ($5/mês)
- Sem limite de mensagens (vs Twilio que cobra por mensagem)
- **Risco:** Meta pode derrubar a conta → mitigar com número dedicado por cliente

---

## Diagrama de Arquitetura

```
[Google My Business API] ──────────────────────────────────┐
[TripAdvisor Scraper]  ────────────────────────────────────►│
[Facebook Graph API]  ─────────────────────────────────────►│ Webhook/Cron
                                                             │
                                              ┌──────────────▼──────────────┐
                                              │   Next.js API Routes        │
                                              │   /api/reviews/ingest       │
                                              └──────────────┬──────────────┘
                                                             │
                                              ┌──────────────▼──────────────┐
                                              │   Upstash QStash Queue      │
                                              │   (processa async)          │
                                              └──────────────┬──────────────┘
                                                             │
                                              ┌──────────────▼──────────────┐
                                              │   Worker: Gerar Resposta    │
                                              │   OpenAI GPT-4o-mini        │
                                              └──────────┬──────────────────┘
                                                         │
                    ┌──────────────────────────┬─────────▼─────────┐
                    │                          │                   │
         ┌──────────▼──────┐     ┌─────────────▼──────┐  ┌────────▼────────┐
         │  Auto-publish   │     │ WhatsApp Approval  │  │ Salva no banco │
         │  (se habilitado)│     │ (aguarda 1 clique) │  │  Supabase DB   │
         └─────────────────┘     └────────────────────┘  └────────────────┘

[Dashboard Next.js] ◄──── Supabase Realtime ──── [Supabase PostgreSQL]
[Stripe Webhooks]   ────► /api/webhooks/stripe ──► Atualiza plano usuário
```

---

## Schema do Banco de Dados

```sql
-- Usuários e organizações
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free', -- free | starter | pro | agency
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  organization_id UUID REFERENCES organizations(id),
  role TEXT DEFAULT 'owner', -- owner | member
  name TEXT,
  whatsapp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locais monitorados
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  google_place_id TEXT,
  niche TEXT, -- clinica | restaurante | academia | petshop | outro
  tone TEXT DEFAULT 'amigavel', -- formal | amigavel | descontraido
  auto_publish BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews coletados
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  platform TEXT NOT NULL, -- google | tripadvisor | facebook
  external_id TEXT NOT NULL,
  author_name TEXT,
  rating INTEGER, -- 1-5
  content TEXT,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- pending | draft | approved | published | ignored
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_id)
);

-- Respostas geradas
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id),
  content TEXT NOT NULL,
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alertas enviados
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id),
  channel TEXT, -- whatsapp | email
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# Evolution API (WhatsApp)
EVOLUTION_API_URL=
EVOLUTION_API_KEY=

# Resend (email)
RESEND_API_KEY=

# Google My Business
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# App
NEXTAUTH_URL=
NEXTAUTH_SECRET=
```

---

## Estimativa de Custo Mensal (MVP — 200 clientes)

| Serviço | Custo |
|---------|-------|
| Vercel Pro | $20/mês |
| Supabase Pro | $25/mês |
| OpenAI (10k respostas) | ~$3/mês |
| Upstash | $0 (free tier) |
| Resend | $0 (free tier) |
| Evolution API (Railway) | $5/mês |
| **Total infra** | **~$53/mês** |
| **Com MRR de R$28.000** | **Margem ~99%** |

---

## Próxima Etapa
→ [04_ETAPA4_MVP.md](04_ETAPA4_MVP.md)
