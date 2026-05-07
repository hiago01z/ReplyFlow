import Link from "next/link";
import { CheckCircle2, Star, Zap } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Carla Mendes",
    role: "Proprietária",
    business: "Clínica Estética VitaSkin",
    city: "São Paulo, SP",
    avatar: "CM",
    rating: 5,
    text: "Antes eu demorava dias para responder os reviews. Agora o ReplyFlow responde em minutos, com um texto que parece que escrevi eu mesma. Minha nota no Google subiu de 4,1 para 4,7 em 2 meses.",
  },
  {
    name: "Ricardo Alves",
    role: "Sócio-gerente",
    business: "Restaurante Sabor da Serra",
    city: "Belo Horizonte, MG",
    avatar: "RA",
    rating: 5,
    text: "Trabalho com 3 unidades e não tinha tempo de responder review nenhum. Agora tudo é automático. O plano Agência valeu cada centavo — economia de pelo menos 6 horas por semana.",
  },
  {
    name: "Priscila Costa",
    role: "Diretora",
    business: "Academia FitPulse",
    city: "Curitiba, PR",
    avatar: "PC",
    rating: 5,
    text: "O tom das respostas ficou exatamente como a gente queria — animado e acolhedor. Vários clientes comentaram que ficaram impressionados com a atenção que damos para cada feedback.",
  },
];

const FAQ = [
  {
    q: "Precisa dar acesso total ao meu Google Meu Negócio?",
    a: "Não. O ReplyFlow solicita apenas a permissão para ler reviews e publicar respostas — nada além disso. Você pode revogar o acesso quando quiser.",
  },
  {
    q: "As respostas soam como IA ou parecem humanas?",
    a: "Parecem humanas. O sistema usa o nicho e o tom que você define (formal, descontraído, técnico) para criar respostas contextualizadas. A maioria dos clientes não percebe que é IA.",
  },
  {
    q: "Posso revisar as respostas antes de publicar?",
    a: "Sim. No modo padrão você revisa e publica com 1 clique. Se preferir, pode ativar o modo automático para publicar direto — a escolha é sua.",
  },
  {
    q: "O que acontece se eu cancelar?",
    a: "Você pode cancelar a qualquer momento pelo painel de billing. Sem fidelidade, sem taxa de cancelamento. Seu acesso fica ativo até o fim do período pago.",
  },
  {
    q: "Funciona com outras plataformas além do Google?",
    a: "O MVP foca em Google Meu Negócio — onde está a maioria dos reviews para negócios locais no Brasil. TripAdvisor, iFood e Facebook estão no roadmap.",
  },
  {
    q: "Tenho uma agência. Posso gerenciar vários clientes?",
    a: "Sim. O plano Agência foi feito para isso — locais ilimitados em um único painel. Vários clientes de marketing digital já usam para ofertar como serviço.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-6 py-3.5 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
          <div className="w-7 h-7 brand-gradient rounded-lg flex items-center justify-center shadow-sm">
            <Zap size={13} className="text-white fill-white" />
          </div>
          ReplyFlow
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {["#como-funciona","#depoimentos","#precos","#faq"].map((href) => (
            <Link key={href} href={href} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
              {href === "#como-funciona" ? "Como funciona" : href === "#depoimentos" ? "Depoimentos" : href === "#precos" ? "Preços" : "FAQ"}
            </Link>
          ))}
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Entrar</Link>
          <Link href="/register" className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            Começar grátis
          </Link>
        </nav>
        <Link href="/register" className="md:hidden bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg font-medium">Grátis</Link>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white pt-20 pb-0 px-6">
        {/* Background gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-100 rounded-full opacity-30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-violet-100 rounded-full opacity-20 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            IA para gestão de reputação local
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
            Sua reputação no<br />
            <span className="text-transparent bg-clip-text" style={{backgroundImage:"linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7)"}}>
              piloto automático
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            ReplyFlow responde reviews do Google com IA personalizada para o seu negócio —
            em segundos, no tom certo, sem você fazer nada.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link href="/register" className="brand-gradient text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-200">
              Começar gratuitamente →
            </Link>
            <Link href="#como-funciona" className="bg-white border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-gray-50 transition-colors">
              Ver como funciona
            </Link>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-12">
            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> Sem cartão de crédito</span>
            <span className="w-px h-3 bg-gray-200" />
            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> 10 respostas grátis/mês</span>
            <span className="w-px h-3 bg-gray-200" />
            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> Cancele quando quiser</span>
          </div>

          {/* Product mockup */}
          <div className="relative mx-auto max-w-3xl">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white z-10 pointer-events-none" style={{top:"70%"}} />
            <div className="rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200 overflow-hidden">
              {/* Fake browser chrome */}
              <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 mx-2">
                  app.replyflow.com.br/reviews
                </div>
              </div>
              {/* Fake dashboard */}
              <div className="bg-[#f5f5fa] p-4 text-left">
                {/* Mini stat bar */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[{label:"Pendentes",v:"3",c:"text-amber-600 bg-amber-50"},{label:"Publicados",v:"47",c:"text-green-600 bg-green-50"},{label:"Críticos",v:"1",c:"text-red-600 bg-red-50"},{label:"Locais",v:"2",c:"text-indigo-600 bg-indigo-50"}].map(s=>(
                    <div key={s.label} className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm">
                      <div className={`text-lg font-bold ${s.c.split(" ")[0]}`}>{s.v}</div>
                      <div className="text-[10px] text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Mini review cards */}
                {[
                  {name:"Maria S.",stars:5,text:"Atendimento excelente!",status:"Pendente",sc:"bg-amber-50 text-amber-700"},
                  {name:"João P.",stars:2,text:"Esperei mais de uma hora.",status:"Pendente",sc:"bg-red-50 text-red-700"},
                  {name:"Ana C.",stars:4,text:"Muito bom de forma geral.",status:"Publicado",sc:"bg-green-50 text-green-700"},
                ].map((r,i)=>(
                  <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2.5 mb-2 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">{r.name[0]}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-semibold text-gray-900">{r.name}</span>
                          <div className="flex gap-0.5">{[1,2,3,4,5].map(n=><Star key={n} size={8} className={n<=r.stars?"fill-amber-400 text-amber-400":"fill-gray-200 text-gray-200"}/>)}</div>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{r.text}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${r.sc}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-10 px-6 border-y border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-12 gap-y-3 text-sm text-gray-400">
          <span>⭐ +1.200 reviews respondidos</span>
          <span>🏪 +340 negócios ativos</span>
          <span>🇧🇷 Feito para o mercado brasileiro</span>
          <span>🤖 GPT-4o-mini integrado</span>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Como funciona
          </h2>
          <p className="text-center text-gray-600 mb-12">
            3 passos para ter sua reputação gerenciada por IA
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "🔗",
                title: "Conecte seu Google",
                description:
                  "Autorize o ReplyFlow a acessar seus reviews do Google Meu Negócio em 1 clique. Leva menos de 2 minutos.",
              },
              {
                step: "02",
                icon: "🤖",
                title: "IA gera as respostas",
                description:
                  "Nosso sistema lê cada review e cria uma resposta personalizada para o nicho e tom do seu negócio — automático.",
              },
              {
                step: "03",
                icon: "✅",
                title: "Publique com 1 clique",
                description:
                  "Aprove e publique direto do dashboard — ou ative o modo automático e esqueça. Você escolhe.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-xs font-bold text-indigo-400 mb-2 tracking-widest">
                  PASSO {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Quem usa, aprova
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Negócios reais que recuperaram horas do dia com o ReplyFlow
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-7 flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {"★★★★★".split("").map((s, i) => (
                    <span key={i} className="text-amber-400 text-lg">{s}</span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5 flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.business} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Planos e preços
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Comece grátis. Faça upgrade quando precisar. Cancele quando quiser.
          </p>
          <div className="grid md:grid-cols-3 gap-6 items-center">
            {[
              {
                name: "Starter",
                price: "R$ 97",
                period: "/mês",
                description: "Para autônomos e pequenos negócios",
                features: [
                  "1 local",
                  "3 plataformas",
                  "Respostas ilimitadas",
                  "Alerta por e-mail",
                  "Tom personalizado",
                ],
                cta: "Assinar Starter",
                highlight: false,
              },
              {
                name: "Pro",
                price: "R$ 197",
                period: "/mês",
                description: "Para negócios com múltiplas unidades",
                features: [
                  "Até 3 locais",
                  "Todas as plataformas",
                  "Respostas ilimitadas",
                  "Alerta via WhatsApp",
                  "Aprovação em 1 clique",
                  "Relatório mensal PDF",
                ],
                cta: "Assinar Pro",
                highlight: true,
              },
              {
                name: "Agência",
                price: "R$ 497",
                period: "/mês",
                description: "Para agências gerenciando múltiplos clientes",
                features: [
                  "Clientes ilimitados",
                  "Painel multi-cliente",
                  "White-label disponível",
                  "API de integração",
                  "Suporte dedicado",
                ],
                cta: "Assinar Agência",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.highlight
                    ? "bg-indigo-600 text-white shadow-xl scale-105"
                    : "bg-white border border-gray-200"
                }`}
              >
                {plan.highlight && (
                  <div className="text-xs font-bold text-indigo-200 mb-3 tracking-widest">
                    ★ MAIS POPULAR
                  </div>
                )}
                <div className={`text-sm font-medium mb-1 ${plan.highlight ? "text-indigo-200" : "text-indigo-600"}`}>
                  {plan.name}
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.highlight ? "text-indigo-200" : "text-gray-500"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? "text-indigo-100" : "text-gray-500"}`}>
                  {plan.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <span className={plan.highlight ? "text-indigo-300" : "text-indigo-600"}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? "bg-white text-indigo-600 hover:bg-indigo-50"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">
            Todos os planos incluem teste de 7 dias grátis. Sem fidelidade.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-center text-gray-600 mb-12">Dúvidas comuns antes de começar</p>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="bg-gray-50 rounded-2xl px-6 py-5 group cursor-pointer"
              >
                <summary className="font-semibold text-gray-900 text-sm list-none flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform shrink-0 text-lg leading-none">+</span>
                </summary>
                <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-indigo-600 py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para automatizar sua reputação?
          </h2>
          <p className="text-indigo-100 mb-8 text-lg">
            Configure em 5 minutos. Resultados visíveis em 30 dias.
          </p>
          <Link
            href="/register"
            className="bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition-colors inline-block"
          >
            Começar gratuitamente →
          </Link>
          <p className="text-indigo-200 text-sm mt-4">
            Sem cartão de crédito · Cancele quando quiser · Suporte em português
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-bold text-indigo-600">⚡ ReplyFlow</div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="#como-funciona" className="hover:text-gray-900">Como funciona</Link>
            <Link href="#precos" className="hover:text-gray-900">Preços</Link>
            <Link href="#faq" className="hover:text-gray-900">FAQ</Link>
            <Link href="/login" className="hover:text-gray-900">Entrar</Link>
          </div>
          <p className="text-sm text-gray-400">© 2026 ReplyFlow. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
