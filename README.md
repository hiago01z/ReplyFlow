# ⚡ ReplyFlow

> SaaS de gestão de reviews com IA para pequenas e médias empresas locais.

ReplyFlow responde automaticamente reviews do Google Meu Negócio com IA personalizada — no tom certo, no nicho certo, sem intervenção manual.

---

## Estrutura do Repositório

```
/
├── replyflow/          # Aplicação Next.js (código-fonte principal)
│   ├── src/            # App Router, componentes, API routes, libs
│   ├── supabase/       # Migrations SQL
│   └── README.md       # Documentação técnica detalhada
└── README.md           # Este arquivo
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| Banco de dados | PostgreSQL via Supabase |
| Autenticação | Supabase Auth (email + Google OAuth) |
| Pagamentos | Stripe (assinaturas em BRL) |
| IA | OpenAI GPT-4o-mini |
| Email | Resend |
| Deploy | Vercel |

## Início Rápido

```bash
cd replyflow
npm install
cp .env.example .env.local   # preencher variáveis
npm run dev                   # http://localhost:3000
```

Antes de rodar, execute o SQL em `replyflow/supabase/setup.sql` no **Supabase Dashboard → SQL Editor**.

---

📄 Documentação completa em [`replyflow/README.md`](replyflow/README.md)
