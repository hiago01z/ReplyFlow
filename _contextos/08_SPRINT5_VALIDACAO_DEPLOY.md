# 🚀 Sprint 5 — Validação Local + Deploy

> Sessão 5 — 2026-05-06

## Objetivo

Garantir que o projeto roda localmente sem erros, corrigir problemas de configuração e preparar para deploy na Vercel.

---

## Problemas Identificados e Corrigidos

### 1. README não aparecia no GitHub

**Causa:** O `README.md` estava em `replyflow/README.md` (subdiretório), mas o GitHub procura pelo README na **raiz do repositório**.

**Solução:** Criado `README.md` na raiz do repo (`/README.md`) com overview do monorepo e links para a documentação técnica em `replyflow/README.md`.

**Regra derivada:** Em repos com estrutura monorepo (subpastas), sempre manter um README raiz que descreve a estrutura e aponta para as docs internas.

---

### 2. Credenciais reais no `.env.example`

**Causa:** O arquivo `.env.example` continha credenciais reais (Supabase, OpenAI, Stripe, Google OAuth, Resend). Como `.env.example` é versionado, essas credenciais estariam no histórico do git.

**Solução:** `.env.example` sanitizado — todos os valores substituídos por placeholders com comentários indicando onde obter cada credencial.

**Ação pendente:** Fazer o roll-over (invalidar/regenerar) de todas as credenciais expostas:
- [ ] Rotacionar Supabase service role key
- [ ] Rotacionar OpenAI API key
- [ ] Rotacionar Stripe secret key
- [ ] Rotacionar Google OAuth client secret
- [ ] Rotacionar Resend API key

---

### 3. node_modules ausente

**Causa:** `npm install` nunca havia sido executado no worktree.

**Solução:** `npm install` executado na pasta `replyflow/`. Node.js v24.14.1, npm v11.11.0.

---

## Estado do Projeto

### Dependências Principais
| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| next | 15.2.4 | Framework React |
| react | 19.0.0 | UI |
| @supabase/ssr | ^0.6.1 | Auth + DB client |
| openai | ^4.87.3 | GPT-4o-mini |
| stripe | ^17.7.0 | Pagamentos |
| resend | ^4.2.0 | E-mail transacional |
| zod | ^3.24.2 | Validação de schema |
| lucide-react | ^0.474.0 | Ícones |
| tailwindcss | ^3.4.1 | Estilização |

---

## Checklist de Validação Local

- [x] Node.js instalado (v24.14.1)
- [x] `npm install` executado
- [ ] `.env.local` criado com credenciais reais
- [ ] `npm run dev` inicia sem erros
- [ ] `npm run build` compila sem erros TypeScript
- [ ] Fluxo de register → onboarding funciona
- [ ] Dashboard de reviews carrega
- [ ] Página de billing carrega

---

## Próximas Melhorias (Sprint 6)

1. **Testes automatizados** — Vitest + Testing Library para componentes críticos
2. **Dashboard analytics** — gráfico de reviews por semana (Recharts)
3. **Notificações WhatsApp** — integrar Evolution API para alertas Pro
4. **Auto-resposta** — modo automático para planos Pro/Agência
5. **Deploy Vercel** — configurar variáveis de ambiente e domínio customizado

---

## Arquivos Criados/Modificados Nesta Sessão

| Arquivo | Ação | Motivo |
|---------|------|--------|
| `/README.md` | Criado | README raiz para GitHub |
| `replyflow/.env.example` | Atualizado | Sanitizar credenciais |
| `_contextos/08_SPRINT5_VALIDACAO_DEPLOY.md` | Criado | Este documento |
