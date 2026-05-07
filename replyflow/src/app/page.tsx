import Link from "next/link";

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
    text: "O tom das respostas ficou exatamente como a gente queria. Vários clientes comentaram que ficaram impressionados com a atenção que damos para cada feedback.",
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
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="font-bold text-xl text-indigo-600">⚡ ReplyFlow</div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#como-funciona" className="text-gray-600 hover:text-gray-900 text-sm">
            Como funciona
          </Link>
          <Link href="#depoimentos" className="text-gray-600 hover:text-gray-900 text-sm">
            Depoimentos
          </Link>
          <Link href="#precos" className="text-gray-600 hover:text-gray-900 text-sm">
            Preços
          </Link>
          <Link href="#faq" className="text-gray-600 hover:text-gray-900 text-sm">
            FAQ
          </Link>
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Entrar
          </Link>
          <Link
            href="/register"
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Começar grátis
          </Link>
        </nav>
        {/* Mobile CTA */}
        <Link
          href="/register"
          className="md:hidden bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg"
        >
          Grátis
        </Link>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          IA para gestão de reputação local
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Sua reputação no{" "}
          <span className="text-indigo-600">piloto automático</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          ReplyFlow responde todos os seus reviews no Google com IA personalizada —
          em segundos, no tom certo, sem você precisar fazer nada.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Começar gratuitamente →
          </Link>
          <Link
            href="#como-funciona"
            className="border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Ver como funciona
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">
          Sem cartão de crédito. 10 respostas grátis por mês.
        </p>

        {/* Social proof bar */}
        <div className="mt-16 flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm text-gray-500">
          <span>⭐ +1.200 reviews respondidos</span>
          <span>🏪 +340 negócios ativos</span>
          <span>🇧🇷 Feito para o mercado brasileiro</span>
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
