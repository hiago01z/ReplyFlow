# 📋 Regras do Projeto — ReplyFlow

> Este arquivo define regras e convenções obrigatórias que devem ser seguidas em TODA sessão de desenvolvimento.
> Leia sempre junto com `00_INDEX.md` ao iniciar uma sessão.

---

## 🔴 REGRA #1 — Manter o README sempre atualizado

### Quando o README DEVE ser atualizado

O arquivo `replyflow/README.md` é o cartão de visita do projeto. Ele **deve ser atualizado imediatamente** sempre que ocorrer qualquer uma das seguintes mudanças:

| Tipo de mudança | Seção do README afetada |
|----------------|------------------------|
| Nova API implementada | Tabela "APIs Implementadas" |
| Etapa ou sprint concluído | Tabela "Status do Desenvolvimento" |
| Nova dependência adicionada ao `package.json` | Tabela "Stack Tecnológica" |
| Nova variável de ambiente adicionada | Seção "Setup Rápido" ou `docs/setup.md` |
| Alteração nos planos ou preços | Tabela "Planos e Preços" |
| Novo contexto criado em `_contextos/` | Tabela "Contextos do Projeto" |
| Mudança na estrutura de pastas | Seção "Estrutura do Projeto" |
| Novo endpoint ou rota criada | Tabela "APIs Implementadas" |

### Como atualizar

1. Localize a seção afetada no `README.md`
2. Atualize apenas o conteúdo necessário — não reescreva seções inteiras
3. Atualize também o `06_DIARIO_EXECUCAO.md` registrando que o README foi atualizado

### O que NÃO coloca no README

- Detalhes de implementação (isso vai nos contextos `_contextos/`)
- Credenciais ou segredos
- TODOs internos (isso vai no `06_DIARIO_EXECUCAO.md`)
- Código completo de funções

---

## 🟡 REGRA #2 — Atualizar o Diário a cada sessão

O arquivo `06_DIARIO_EXECUCAO.md` é o log de progresso. Antes de encerrar qualquer sessão:

- [ ] Registrar o que foi feito com checkboxes `[x]`
- [ ] Registrar decisões técnicas importantes
- [ ] Deixar clara a **próxima ação** para a sessão seguinte
- [ ] Atualizar o campo "Onde Parei" em `00_INDEX.md`

---

## 🟡 REGRA #3 — Contextos são a memória do projeto

Sempre que uma decisão técnica importante for tomada (mudança de stack, novo padrão de código, mudança de arquitetura), ela deve ser salva no contexto apropriado.

- Decisões de negócio → `02_ETAPA2_MODELO_DE_NEGOCIO.md`
- Decisões de arquitetura → `03_ETAPA3_ARQUITETURA_TECNICA.md`
- Novos padrões de código → `05_ETAPA5_ESTRUTURA_PROJETO.md`
- Tudo que não se encaixa acima → `06_DIARIO_EXECUCAO.md`

---

## 🟢 REGRA #4 — Código pronto para produção

Todo código gerado deve:

- Ter tipagem TypeScript completa (sem `any` desnecessário)
- Verificar autenticação antes de qualquer operação nas API Routes
- Usar `createServiceClient()` apenas em API Routes (nunca no cliente)
- Validar entrada com Zod em todos os endpoints POST/PUT/PATCH
- Nunca expor stack traces em produção (usar mensagens de erro genéricas)
- Filtrar por `organization_id` em toda query ao banco (isolamento de dados)

---

## 🟢 REGRA #5 — Nunca versionar segredos

O arquivo `.env.local` nunca deve ser commitado. O `.env.example` deve ser mantido atualizado com todas as variáveis necessárias (sem valores reais).

Sempre que adicionar uma nova variável de ambiente:
1. Adicionar ao `.env.local` (local)
2. Adicionar ao `.env.example` (com placeholder)
3. Documentar em `docs/setup.md` o que é e onde obter o valor

---

## Checklist de início de sessão

Antes de começar a codar em uma nova sessão:

- [ ] Ler `00_INDEX.md` para saber onde parou
- [ ] Ler `06_DIARIO_EXECUCAO.md` para ver a próxima ação
- [ ] Ler este arquivo (`07_REGRAS_PROJETO.md`) para lembrar as regras
- [ ] Verificar se há arquivos de contexto novos que precisam ser lidos

## Checklist de encerramento de sessão

Antes de encerrar:

- [ ] Atualizar `06_DIARIO_EXECUCAO.md` com o que foi feito
- [ ] Atualizar `00_INDEX.md` → campo "Onde Parei"
- [ ] Atualizar `README.md` se necessário (ver Regra #1)
- [ ] Verificar se algum contexto precisa ser atualizado
