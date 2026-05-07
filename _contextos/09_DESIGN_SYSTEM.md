# 🎨 Design System — ReplyFlow

> Documento de referência do sistema de design. Criado na Sessão 6 (2026-05-06).

---

## Filosofia

**Inspiração:** Linear.app + Vercel Dashboard — clean SaaS B2B com identidade forte.

**Princípios:**
- Espaço em branco generoso (respira, não sufoca)
- Hierarquia tipográfica clara (gray-900 → gray-500 → gray-400)
- Indigo como cor primária (trust, tecnologia)
- Cards com sombra suave, nunca borda pesada
- Estados de loading/empty sempre presentes

---

## Tokens de Design (CSS Variables)

Definidos em `replyflow/src/app/globals.css`:

### Cores — Brand
```css
--brand-start: #6366f1   /* indigo-500 */
--brand-mid:   #8b5cf6   /* violet-500 */
--brand-end:   #a855f7   /* purple-500 */
```

### Cores — Background
```css
--bg-page:     #f5f5fa   /* fundo das páginas — quase branco com tom lilás */
--bg-card:     #ffffff   /* cards */
--bg-sidebar:  #ffffff   /* sidebar */
```

### Cores — Texto
```css
--text-primary:   #111827  /* gray-900 */
--text-secondary: #4b5563  /* gray-600 */
--text-muted:     #9ca3af  /* gray-400 */
```

### Bordas e Sombras
```css
--border:         #e5e7eb           /* gray-200 */
--shadow-card:    0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)
--shadow-md:      0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)
--shadow-lg:      0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)
```

### Raios
```css
--radius-sm:   0.5rem   /* 8px  — inputs, badges pequenos */
--radius-md:   0.75rem  /* 12px — cards, modais */
--radius-lg:   1rem     /* 16px — cards grandes */
--radius-xl:   1.25rem  /* 20px — hero sections */
```

---

## Classes Utilitárias Customizadas

Definidas como `@layer components` no globals.css:

| Classe | Uso |
|--------|-----|
| `.card` | Container padrão — bg-white, borda gray-200, rounded-xl, shadow-card |
| `.card-sm` | Variante menor — rounded-lg, shadow menor |
| `.brand-gradient` | `background: linear-gradient(135deg, var(--brand-start), var(--brand-end))` |
| `.animate-fade-in` | `opacity 0→1, translateY 4px→0` em 0.3s ease-out |
| `.animate-slide-up` | `opacity 0→1, translateY 8px→0` em 0.35s ease-out |

---

## Componentes UI

Localização: `replyflow/src/components/ui/`

### Button (`Button.tsx`)

```tsx
<Button variant="primary" size="lg" loading={false}>
  Salvar
</Button>
```

| Prop | Tipo | Default | Opções |
|------|------|---------|--------|
| `variant` | string | `"primary"` | `primary`, `secondary`, `ghost`, `danger`, `outline` |
| `size` | string | `"md"` | `sm` (h-8), `md` (h-9), `lg` (h-11) |
| `loading` | boolean | `false` | spinner inline, desabilita clique |
| `disabled` | boolean | `false` | estado visual cinza |

**Variants:**
- `primary`: indigo-600 → hover:indigo-700, texto branco
- `secondary`: gray-100 → hover:gray-200, texto gray-700
- `ghost`: sem fundo → hover:gray-100, texto gray-700
- `danger`: red-600 → hover:red-700, texto branco
- `outline`: borda gray-200 → hover:bg-gray-50

### Input (`Input.tsx`)

```tsx
<Input
  label="Nome"
  placeholder="Digite aqui"
  error="Campo obrigatório"
  hint="Máximo 50 caracteres"
/>
<Textarea label="Descrição" rows={4} />
```

| Prop | Uso |
|------|-----|
| `label` | Label acima do input |
| `error` | Texto vermelho abaixo + borda vermelha |
| `hint` | Texto cinza abaixo (dica) |

### Badge (`Badge.tsx`)

```tsx
<Badge color="green" dot>Ativo</Badge>
<Badge color="amber">Pendente</Badge>
```

| Cor | Uso |
|-----|-----|
| `gray` | Status neutro |
| `indigo` | Destaque brand |
| `green` | Sucesso, ativo, conectado |
| `amber` | Aviso, pendente |
| `red` | Erro, negativo |
| `blue` | Informativo |
| `purple` | Premium, agency |
| `teal` | Especial |

---

## Ícones

Biblioteca: **Lucide React** (`lucide-react`)

### Mapeamento por contexto

| Contexto | Ícone | Uso |
|----------|-------|-----|
| Logo | `Zap` | Brand mark no sidebar e header |
| Dashboard | `LayoutDashboard` | Nav item |
| Reviews | `Star` | Nav item, stat card |
| Locais | `MapPin` | Nav item, cards de local |
| Billing | `CreditCard` | Nav item, gestão de pagamento |
| Configurações | `Settings` | Nav item |
| Logout | `LogOut` | Ação destrutiva |
| IA/Gerar | `Sparkles` | Botão de gerar resposta IA |
| Publicar | `Send` | Botão de publicar review |
| Ignorar | `EyeOff` | Ação secundária |
| Regenerar | `RotateCcw` | Refazer geração |
| Sucesso | `CheckCircle2` | Confirmação, status ativo |
| Alerta | `AlertTriangle` | Reviews negativos |
| Clock | `Clock` | Reviews pendentes |
| Filtros | `SlidersHorizontal` | Barra de filtros |
| Google conectado | `Wifi` | Status de integração |
| Configurar | `Settings2` | Ação de editar item |
| Expandir | `ChevronDown/Up` | Accordion |
| Empresa | `Building2` | Org name, agência |
| Coroa | `Crown` | Plano Pro/premium |
| Externo | `ExternalLink` | Links para fora do app |
| Busca | `Search` | Empty state de lista |
| Adicionar | `Plus` | Botões de adicionar |
| Usuário | `User` | Perfil |
| Email | `Mail` | Campo de e-mail |
| Local | `MapPin` | Localização física |

**Padrão de tamanhos:**
- Ícones em botões: `size={15}` ou `size={16}`
- Ícones em títulos de seção: `size={16}` ou `size={18}`
- Ícones em stat cards: `size={20}` ou `size={22}`
- Ícones em empty state: `size={24}` ou `size={28}`

---

## Layout de Auth (Split-Screen)

`replyflow/src/app/(auth)/layout.tsx`

```
┌─────────────────────┬──────────────────────┐
│  Left Panel (40%)   │   Right Panel (60%)  │
│  brand-gradient bg  │   #f5f5fa bg         │
│  Logo + bullets     │   Form container     │
│  Depoimento         │   max-w-[400px]      │
└─────────────────────┴──────────────────────┘
```

- Mobile: apenas o painel direito (com logo acima)
- Decorações: blobs SVG absolutos com blur para profundidade

---

## Layout de Dashboard

`replyflow/src/components/layout/Sidebar.tsx`

```
┌─────────────────────────────────────────────┐
│ Sidebar (w-64 fixed)  │  Main Content       │
│ ─────────────────────  │  (ml-64, p-8)      │
│ Logo + ReplyFlow       │  Page content      │
│ ─────────────────────  │                    │
│ Nav items              │                    │
│ ─────────────────────  │                    │
│ User avatar            │                    │
│ Plan badge             │                    │
│ Logout                 │                    │
└─────────────────────────────────────────────┘
```

**Badge de plano no Sidebar:**
- `free`: gray
- `starter`: blue
- `pro`: indigo
- `agency`: purple

---

## Padrão de Páginas de Dashboard

Todas as páginas seguem este padrão:

```tsx
<div className="animate-fade-in">
  {/* Breadcrumb label */}
  <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">
    Seção
  </p>
  <h1 className="text-2xl font-bold text-gray-900">Título</h1>
  <p className="text-sm text-gray-500 mt-1">Descrição.</p>

  {/* Content */}
</div>
```

---

## Padrão de Cards de Stat

```tsx
<Link href="/..." className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
  <div className="w-11 h-11 bg-COLOR-50 rounded-xl flex items-center justify-center">
    <Icon size={20} className="text-COLOR-500" />
  </div>
  <div>
    <p className="text-2xl font-bold text-gray-900">{count}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
</Link>
```

---

## Animações

| Classe | Keyframe | Uso |
|--------|----------|-----|
| `animate-fade-in` | opacity 0→1 + y 4px→0 | Entry de páginas |
| `animate-slide-up` | opacity 0→1 + y 8px→0 | Entry de componentes dentro da página |
| `animate-bounce` (Tailwind nativo) | bounce vertical | Loading dots na tela "Tudo pronto!" |

---

## Checklist de Implementação por Página

| Página | Redesign | Componentes UI | Lucide Icons | Animação |
|--------|----------|----------------|--------------|----------|
| `(auth)/login` | ✅ | Button, Input | ✅ | split-screen |
| `(auth)/register` | ✅ | Button, Input | ✅ | split-screen |
| `onboarding` | ✅ | Button, Input | Building2, MapPin, CheckCircle2 | slide-up, bounce |
| `dashboard` | ✅ | — | Clock, CheckCircle2, AlertTriangle, MapPin | fade-in |
| `reviews` | ✅ | Badge | Star, Sparkles, Send, EyeOff, etc | slide-up |
| `locations` | ✅ | — | MapPin, Wifi, Settings2, Plus | fade-in |
| `billing` | ✅ | — | Zap, Crown, Building2, CreditCard | fade-in |
| `settings` | ✅ | Button, Input | Building2, User, Mail | fade-in |
| `Sidebar` | ✅ | Badge | Zap, LayoutDashboard, Star, etc | — |

---

## Próximos Passos de Design

- [ ] Modo escuro (dark mode) — vars já preparadas para sobrescrever via `.dark`
- [ ] Toasts / notificações — componente `Toast.tsx` pendente
- [ ] Modal reutilizável — componente `Modal.tsx` pendente
- [ ] Select customizado — substituir `<select>` nativo por componente estilizado
- [ ] Animações de hover em cards de plano no Billing
