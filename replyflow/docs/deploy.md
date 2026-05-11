# 🚀 Guia de Deploy em Produção — ReplyFlow

> Tempo estimado: 2–3 horas na primeira vez.

---

## Pré-requisitos

| Serviço | Conta | Plano mínimo |
|---------|-------|-------------|
| [Vercel](https://vercel.com) | Obrigatório | Hobby (gratuito) — Pro para crons nativos |
| [Supabase](https://supabase.com) | Obrigatório | Free tier |
| [Stripe](https://stripe.com) | Obrigatório | Free (modo teste → produção) |
| [OpenAI](https://platform.openai.com) | Obrigatório | Pay-as-you-go |
| [Resend](https://resend.com) | Obrigatório | Free (3.000 emails/mês) |
| [Google Cloud Console](https://console.cloud.google.com) | Obrigatório | Free |
| [Upstash](https://console.upstash.com) | Recomendado | Free tier |
| [cron-job.org](https://cron-job.org) | Se Vercel Hobby | Free |

---

## 1. Supabase — Banco de Dados

### 1.1 Criar projeto
1. Acesse [supabase.com](https://supabase.com) → **New Project**
2. Anote a **URL** e as **API Keys** (Settings → API)
3. Guarde a região mais próxima dos seus usuários (ex: **South America (São Paulo)**)

### 1.2 Aplicar schema completo
1. Vá em **SQL Editor** no painel do Supabase
2. Cole todo o conteúdo do arquivo `supabase/migrations/000_full_schema.sql`
3. Clique **Run** — aguarde ~30 segundos

> ⚠️ Se o banco já tem dados (aplicou migrations individualmente), **não execute** o `000_full_schema.sql`.
> Aplique apenas as migrations ainda não aplicadas (em ordem: 007, 008, 009, 010, 011, 012).

### 1.3 Configurar Auth
1. **Authentication → Providers → Email** — habilite "Confirm email"
2. **Authentication → URL Configuration**:
   - Site URL: `https://seu-dominio.vercel.app`
   - Redirect URLs: adicione `https://seu-dominio.vercel.app/**`
3. **Authentication → Providers → Google** (se usar login social):
   - Preencha Client ID e Secret do Google Cloud (mesmo OAuth do GMB)

### 1.4 Copiar credenciais
```
NEXT_PUBLIC_SUPABASE_URL     → Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY → Settings → API → anon public
SUPABASE_SERVICE_ROLE_KEY    → Settings → API → service_role (⚠️ secreto)
```

---

## 2. Google Cloud Console — OAuth

### 2.1 Criar projeto (se ainda não tem)
1. [console.cloud.google.com](https://console.cloud.google.com) → **New Project**
2. Nome: "ReplyFlow Production"

### 2.2 Habilitar APIs obrigatórias
Em **APIs & Services → Library**, habilite:
- **My Business Business Information API**
- **My Business Reviews API**
- **My Business Account Management API**
- **People API** (para userinfo/sub)

### 2.3 Criar credenciais OAuth
1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Tipo: **Web application**
3. Nome: "ReplyFlow Web"
4. **Authorized redirect URIs** — adicione **AMBAS**:
   ```
   https://[SEU-PROJECT-ID].supabase.co/auth/v1/callback
   https://seu-dominio.vercel.app/api/google/callback
   ```
5. Copie **Client ID** e **Client Secret**

### 2.4 Copiar credenciais
```
GOOGLE_CLIENT_ID     → Client ID do OAuth
GOOGLE_CLIENT_SECRET → Client Secret do OAuth
GOOGLE_REDIRECT_URI  → https://seu-dominio.vercel.app/api/google/callback
```

---

## 3. Stripe — Pagamentos

### 3.1 Criar produtos
1. [dashboard.stripe.com](https://dashboard.stripe.com) → **Products → Add Product**
2. Crie 3 produtos:

| Produto | Preço | Recorrência | Metadata |
|---------|-------|------------|---------|
| ReplyFlow Starter | R$ 97,00 | Mensal | `plan=starter` |
| ReplyFlow Pro | R$ 197,00 | Mensal | `plan=pro` |
| ReplyFlow Agência | R$ 497,00 | Mensal | `plan=agency` |

3. Em cada produto, adicione metadata: `plan = starter` (ou pro/agency)
4. Copie o **Price ID** de cada plano (`price_...`)

### 3.2 Configurar Webhook
1. **Developers → Webhooks → Add endpoint**
2. URL: `https://seu-dominio.vercel.app/api/webhooks/stripe`
3. Eventos para escutar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
4. Copie o **Webhook signing secret** (`whsec_...`)

### 3.3 Copiar credenciais
```
STRIPE_SECRET_KEY              → Developers → API Keys → Secret key
STRIPE_WEBHOOK_SECRET          → Webhook → Signing secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → Developers → API Keys → Publishable key
STRIPE_PRICE_STARTER_MONTHLY   → Price ID do produto Starter
STRIPE_PRICE_PRO_MONTHLY       → Price ID do produto Pro
STRIPE_PRICE_AGENCY_MONTHLY    → Price ID do produto Agência
```

---

## 4. Resend — Email Transacional

### 4.1 Verificar domínio (recomendado)
1. [resend.com](https://resend.com) → **Domains → Add Domain**
2. Adicione os registros DNS no seu provedor de domínio
3. Aguarde verificação (~5 min)
4. Use `noreply@seudominio.com.br` como remetente

> Sem domínio verificado: use `onboarding@resend.dev` como `RESEND_FROM_EMAIL` (limitado a 3.000/mês mas funciona).

### 4.2 Copiar credenciais
```
RESEND_API_KEY    → API Keys → Create API Key
RESEND_FROM_EMAIL → noreply@seudominio.com.br (ou onboarding@resend.dev)
```

---

## 5. Upstash Redis — Rate Limiting

> Opcional mas recomendado. Sem Redis, rate limiting é desabilitado (sem proteção contra spam).

1. [console.upstash.com](https://console.upstash.com) → **Create Database**
2. Tipo: **Redis**, Região: **us-east-1** ou **sa-east-1**
3. Copie as credenciais:
```
UPSTASH_REDIS_REST_URL   → REST URL
UPSTASH_REDIS_REST_TOKEN → REST Token
```

---

## 6. Vercel — Deploy

### 6.1 Conectar repositório
1. [vercel.com](https://vercel.com) → **New Project**
2. Importe o repositório do GitHub
3. Framework: **Next.js** (detectado automaticamente)
4. Root directory: `replyflow` (se o repo tem a pasta replyflow/)

### 6.2 Configurar variáveis de ambiente
Em **Settings → Environment Variables**, adicione todas:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_AGENCY_MONTHLY=price_...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@seudominio.com.br

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://seu-dominio.vercel.app/api/google/callback

# App
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
CRON_SECRET=gere-uma-string-aleatoria-de-32-chars
```

> Para gerar o `CRON_SECRET`: `openssl rand -base64 32`

### 6.3 Deploy
1. Clique **Deploy**
2. Aguarde o build (~2-3 min)
3. Teste: `https://seu-dominio.vercel.app/api/health`

---

## 7. Cron Job — Busca automática de reviews

### Opção A — Vercel Pro (nativo)
- O `vercel.json` já está configurado com crons a cada 30 minutos
- Requer plano Vercel **Pro** (US$20/mês) para crons
- O `CRON_SECRET` precisa estar nas env vars da Vercel

### Opção B — cron-job.org (gratuito, recomendado para início)
1. Acesse [cron-job.org](https://cron-job.org) → **Create Cronjob**
2. URL: `https://seu-dominio.vercel.app/api/cron/fetch-reviews?secret=SEU_CRON_SECRET`
3. Schedule: **Every 30 minutes**
4. Status: **Enabled**

Para o digest semanal:
1. URL: `https://seu-dominio.vercel.app/api/cron/weekly-digest?secret=SEU_CRON_SECRET`
2. Schedule: **Every Monday at 08:00**

---

## 8. Validação Pós-Deploy

Execute estes testes na ordem:

### ✅ Checklist de validação

#### Infraestrutura
- [ ] `GET /api/health` retorna `{"status":"ok"}`
- [ ] Banco de dados conectado (health check confirma)
- [ ] Todas as env vars presentes (sem `missing` no health)

#### Autenticação
- [ ] Cadastro com email funciona → recebe email de confirmação
- [ ] Login com email funciona → vai para onboarding
- [ ] Onboarding completa → cria organização + local no banco
- [ ] Dashboard carrega após onboarding

#### Google My Business
- [ ] Botão "Conectar Google" redireciona para OAuth Google
- [ ] Após OAuth → retorna para onboarding (step "link")
- [ ] Colar ID do Google Meu Negócio → salva `google_location_name`
- [ ] `POST /api/locations/{id}/sync` retorna reviews (ou "nenhum review encontrado")

#### Reviews & IA
- [ ] Review aparece na lista após sync
- [ ] Botão "Gerar resposta" retorna rascunho da IA
- [ ] Botão "Publicar" publica no Google Meu Negócio

#### Pagamentos
- [ ] Página `/billing` carrega com plano Free
- [ ] Botão de upgrade abre Stripe Checkout
- [ ] Após pagamento de teste → plano atualiza no dashboard
- [ ] Webhook `/api/webhooks/stripe` recebe eventos (verifique logs na Vercel)

#### Email
- [ ] Review negativo (1-2★) dispara email de alerta (verifique caixa de entrada)
- [ ] Link no email leva para o review correto no dashboard

#### Cron
- [ ] `GET /api/cron/fetch-reviews?secret=SEU_CRON_SECRET` retorna 200
- [ ] Após 30 min, novos reviews aparecem automaticamente

---

## 9. Domínio customizado (opcional)

1. Vercel → **Settings → Domains → Add Domain**
2. Adicione `app.replyflow.com.br` (ou seu domínio)
3. Configure DNS no seu provedor:
   - CNAME: `app.replyflow.com.br` → `cname.vercel-dns.com`
4. Atualize as variáveis:
   - `NEXT_PUBLIC_APP_URL=https://app.replyflow.com.br`
   - `GOOGLE_REDIRECT_URI=https://app.replyflow.com.br/api/google/callback`
   - Adicione o novo redirect URI no Google Cloud Console

---

## 10. Monitoramento

| Serviço | Configuração | Gratuito? |
|---------|-------------|----------|
| [UptimeRobot](https://uptimerobot.com) | Monitor `GET /api/health` a cada 5 min | ✅ |
| Vercel Analytics | Já integrado (`<Analytics />` no layout) | ✅ Hobby |
| Vercel Logs | Dashboard → Functions → Logs | ✅ |
| Supabase Logs | Dashboard → Logs | ✅ |

---

## Troubleshooting

| Problema | Causa provável | Solução |
|---------|---------------|---------|
| `{"status":"degraded","checks":{"env":"missing: ..."}}`  | Env var ausente | Adicionar no Vercel → redeploy |
| OAuth Google redireciona para `redirect_uri_mismatch` | URI não cadastrada no Google Cloud | Adicionar URI correta em Credentials |
| Stripe webhook retorna 400 | `STRIPE_WEBHOOK_SECRET` incorreto | Copiar exatamente do painel Stripe |
| Reviews não aparecem após sync | `google_location_name` inválido ou API quota | Verificar logs em Vercel Functions |
| Email não chega | `RESEND_FROM_EMAIL` não verificado | Usar `onboarding@resend.dev` ou verificar domínio |
| Cron não dispara | CRON_SECRET não configurado | Adicionar env var + recriar cron |
