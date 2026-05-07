# Setup — ReplyFlow

## Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com)
- Conta no [Stripe](https://stripe.com)
- Conta na [OpenAI](https://platform.openai.com)
- Conta no [Resend](https://resend.com)
- Conta no [Upstash](https://upstash.com) (Redis — rate limiting)
- Stripe CLI (para webhooks locais)

## 1. Clonar e instalar dependências

```bash
git clone <seu-repo>
cd replyflow
npm install
```

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha todas as variáveis em `.env.local`:

| Variável | Onde obter |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_PRICE_STARTER_MONTHLY` | Stripe Dashboard → Products |
| `STRIPE_PRICE_PRO_MONTHLY` | Stripe Dashboard → Products |
| `STRIPE_PRICE_AGENCY_MONTHLY` | Stripe Dashboard → Products |
| `UPSTASH_REDIS_REST_URL` | [console.upstash.com](https://console.upstash.com) → Redis → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | [console.upstash.com](https://console.upstash.com) → Redis → REST API |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | Seu domínio verificado no Resend |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3000/api/google/callback` (dev) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (dev) / URL de produção |
| `CRON_SECRET` | Qualquer string aleatória longa (ex: `openssl rand -hex 32`) |
| `EVOLUTION_API_URL` | Sua instância Evolution API (opcional — plano Pro) |
| `EVOLUTION_API_KEY` | Chave da Evolution API (opcional) |

## 3. Configurar banco de dados (Supabase)

No [Supabase Dashboard](https://app.supabase.com) → **SQL Editor**, execute as migrations em ordem:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_sprint3_additions.sql
supabase/migrations/003_auto_publish_config.sql
```

## 4. Configurar Stripe

1. Crie os produtos no [Stripe Dashboard](https://dashboard.stripe.com/products):
   - **ReplyFlow Starter** — R$97/mês recorrente
   - **ReplyFlow Pro** — R$197/mês recorrente
   - **ReplyFlow Agência** — R$497/mês recorrente
2. Copie os `price_id` (começam com `price_`) para o `.env.local`
3. Configure o webhook em **Developers → Webhooks → Add endpoint**:
   - URL: `https://seudominio.com/api/webhooks/stripe`
   - Eventos: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

## 5. Configurar Google OAuth (Google My Business)

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto e habilite as APIs:
   - **My Business Business Information API**
   - **My Business Account Management API**
3. Configure OAuth 2.0 → adicione redirect URIs:
   - `http://localhost:3000/api/google/callback` (desenvolvimento)
   - `https://seudominio.com/api/google/callback` (produção)
4. Copie `Client ID` e `Client Secret` para `.env.local`

## 6. Configurar Upstash Redis (rate limiting)

1. Acesse [upstash.com](https://upstash.com) → **Create Database**
2. Região: `South America (sa-east-1)` — São Paulo
3. Plano: **Free** (10.000 req/dia gratuito)
4. Aba **REST API** → copie `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`

## 7. Configurar Cron Job (produção)

O Vercel Hobby não suporta crons customizados. Use o [cron-job.org](https://cron-job.org) (grátis):

1. Crie uma conta e clique em **+ Create Cronjob**
2. URL: `https://seudominio.com/api/cron/fetch-reviews?secret=SEU_CRON_SECRET`
3. Schedule: a cada 30 minutos (`*/30 * * * *`)
4. Salve e ative

## 8. Rodar localmente

**Opção A — Script automatizado (Windows):**
```powershell
.\dev.ps1
```

**Opção B — Manual:**
```bash
npm run dev
# http://localhost:3000
```

## 9. Testar webhooks Stripe (desenvolvimento)

```bash
# Instalar Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 10. Deploy (Vercel)

1. Conecte o repositório GitHub no [Vercel Dashboard](https://vercel.com)
2. Configure:
   - **Root Directory:** `replyflow`
   - **Framework Preset:** Next.js
3. Adicione todas as variáveis de ambiente em **Settings → Environment Variables**
4. Atualize `NEXT_PUBLIC_APP_URL` e `GOOGLE_REDIRECT_URI` para a URL de produção

## Estrutura de Contextos (Obsidian)

Todo o planejamento do projeto está em `../_contextos/` — abra essa pasta no Obsidian para visualizar o cérebro virtual do projeto.
