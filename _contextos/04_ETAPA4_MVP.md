# Etapa 4 — MVP (Minimum Viable Product)

> Status: ✅ Concluída
> Data: 2026-05-06

---

## Filosofia do MVP

> **"Faça uma coisa extremamente bem. Não faça o resto."**

O MVP do ReplyFlow deve provar UMA coisa: **que a IA consegue gerar respostas de reviews de qualidade, no tom certo, poupando tempo real do cliente.**

Tudo que não prova isso é cortado.

---

## Funcionalidades DO MVP (✅ Incluídas)

### 1. Autenticação
- [x] Cadastro e login com e-mail + senha (Supabase Auth)
- [x] Login com Google OAuth
- [x] Proteção de rotas autenticadas
- [x] Onboarding pós-cadastro (criar organização + primeiro local)

### 2. Conexão com Google My Business
- [x] OAuth com Google para conectar conta GMB
- [x] Listar locais vinculados à conta
- [x] Salvar `google_place_id` por local
- [x] Buscar reviews novos via Google My Business API (cron a cada 30min)

### 3. Dashboard de Reviews
- [x] Listagem de reviews pendentes (sem resposta)
- [x] Exibir: estrelas, autor, data, texto do review
- [x] Filtro por status: pendente / rascunho / publicado / ignorado
- [x] Filtro por avaliação (1★ a 5★)

### 4. Geração de Resposta com IA
- [x] Botão "Gerar Resposta" por review
- [x] IA considera: nicho do local, tom configurado, nota da avaliação, conteúdo do review
- [x] Exibir rascunho gerado no card do review
- [x] Permitir edição manual do rascunho

### 5. Publicação de Resposta
- [x] Botão "Publicar" para responder via Google My Business API
- [x] Marcar review como respondido após publicação
- [x] Registro de data/hora de publicação

### 6. Configuração do Local
- [x] Nome do local
- [x] Nicho (clínica, restaurante, academia, outro)
- [x] Tom de resposta (formal / amigável / descontraído)
- [x] Ativar/desativar resposta automática (sem aprovação)

### 7. Alertas por E-mail
- [x] Enviar e-mail quando review negativo (1★ ou 2★) é recebido
- [x] E-mail contém texto do review + link direto para o dashboard

### 8. Gestão de Planos e Pagamento
- [x] Integração Stripe: assinar plano Starter ou Pro
- [x] Webhook Stripe para atualizar plano no banco
- [x] Bloquear funcionalidades acima do plano (ex: mais de 1 local no Starter)
- [x] Página de billing com link para portal Stripe

### 9. Landing Page
- [x] Headline + proposta de valor
- [x] Como funciona (3 passos)
- [x] Seção de preços
- [x] CTA para trial gratuito
- [x] Depoimento placeholder (substituir após primeiros clientes)

---

## Funcionalidades FORA do MVP (❌ Não incluir agora)

| Funcionalidade | Motivo |
|---------------|--------|
| TripAdvisor, Facebook, Reclame Aqui | Complexidade de scraping — validar com Google primeiro |
| Aprovação via WhatsApp | Dependência de Evolution API — adicionar na v1.1 |
| Relatório mensal PDF | Feature de retenção — não de aquisição |
| Painel multi-cliente (Agência) | Adicionar após validar os planos menores |
| White label | Feature Premium — pós-validação |
| App mobile | Web-first é suficiente para o MVP |
| Integração com CRM | Complexidade desnecessária |

---

## Sprint Plan do MVP

### Sprint 1 (Dias 1-3) — Fundação
- Setup Next.js + Supabase + Stripe
- Schema do banco
- Autenticação completa
- Middleware de proteção de rotas

### Sprint 2 (Dias 4-7) — Core da Aplicação
- Integração Google My Business OAuth
- Cron job para buscar reviews
- Dashboard de reviews (UI)
- Geração de resposta com OpenAI

### Sprint 3 (Dias 8-10) — Publicação e Alertas
- Publicar resposta via GMB API
- Alertas por e-mail (Resend)
- Configurações do local
- Gestão de planos (Stripe)

### Sprint 4 (Dias 11-14) — Landing Page e Polimento
- Landing page
- Onboarding flow
- Limite por plano
- Testes end-to-end
- Deploy produção (Vercel)

**Total estimado: 14 dias para MVP funcional e pronto para os primeiros clientes.**

---

## Critério de Sucesso do MVP

> O MVP é um sucesso quando:
> 1. 10 clientes pagantes nos primeiros 30 dias
> 2. NPS ≥ 7 (usuários recomendam o produto)
> 3. Churn < 10% no mês 2
> 4. Pelo menos 1 agência parceira usando o produto

---

## Próxima Etapa
→ [05_ETAPA5_ESTRUTURA_PROJETO.md](05_ETAPA5_ESTRUTURA_PROJETO.md)
