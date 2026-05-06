# Setup — ReplyFlow

## Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com)
- Conta no [Stripe](https://stripe.com)
- Conta na [OpenAI](https://platform.openai.com)
- Conta no [Resend](https://resend.com)
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

Preencha todas as variáveis em `.env.local`. Consulte `_contextos/03_ETAPA3_ARQUITETURA_TECNICA.md` para guia completo.

## 3. Configurar banco de dados (Supabase)

1. Crie um projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor** e execute o arquivo `supabase/migrations/001_initial_schema.sql`
3. Copie as credenciais em **Project Settings → API** para o `.env.local`

## 4. Configurar Stripe

1. Crie os produtos e preços no [Stripe Dashboard](https://dashboard.stripe.com/products)
   - ReplyFlow Starter — R$97/mês
   - ReplyFlow Pro — R$197/mês
   - ReplyFlow Agência — R$497/mês
2. Copie os `price_id` de cada plano para o `.env.local`

## 5. Configurar Google OAuth (Google My Business)

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto e habilite **Google My Business API**
3. Configure OAuth 2.0 com redirect URI: `http://localhost:3000/api/google/callback`
4. Copie `Client ID` e `Client Secret` para `.env.local`

## 6. Rodar localmente

```bash
npm run dev
```

Acesse em: http://localhost:3000

## 7. Testar webhooks Stripe (opcional)

```bash
# Instalar Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 8. Deploy (Vercel)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis de ambiente no Vercel Dashboard
# ou via CLI: vercel env add NOME_VAR
```

## Estrutura de Contextos (Obsidian)

Todo o planejamento do projeto está em `../_contextos/` — abra essa pasta no Obsidian para visualizar o cérebro virtual do projeto.
