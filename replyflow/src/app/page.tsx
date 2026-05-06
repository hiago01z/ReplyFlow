import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="font-bold text-xl text-indigo-600">ReplyFlow</div>
        <nav className="flex items-center gap-6">
          <Link href="#como-funciona" className="text-gray-600 hover:text-gray-900 text-sm">
            Como funciona
          </Link>
          <Link href="#precos" className="text-gray-600 hover:text-gray-900 text-sm">
            Preços
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
                title: "Conecte seu Google",
                description:
                  "Autorize o ReplyFlow a acessar seus reviews do Google Meu Negócio em 1 clique.",
              },
              {
                step: "02",
                title: "IA gera as respostas",
                description:
                  "Nosso sistema lê cada review e cria uma resposta personalizada para o nicho e tom do seu negócio.",
              },
              {
                step: "03",
                title: "Publique com 1 clique",
                description:
                  "Aprove e publique direto do dashboard — ou ative o modo automático e esqueça.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="text-4xl font-bold text-indigo-100 mb-4">
                  {item.step}
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

      {/* Preços */}
      <section id="precos" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Planos e preços
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Comece grátis. Cancele quando quiser.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Starter",
                price: "R$ 97",
                period: "/mês",
                description: "Perfeito para profissionais autônomos",
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
                      <span className={plan.highlight ? "text-indigo-200" : "text-indigo-600"}>✓</span>
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
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-indigo-600 py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Pronto para automatizar sua reputação?
        </h2>
        <p className="text-indigo-100 mb-8 text-lg">
          Junte-se a centenas de negócios que já protegem sua reputação com IA.
        </p>
        <Link
          href="/register"
          className="bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition-colors inline-block"
        >
          Começar gratuitamente →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-400">
        © 2026 ReplyFlow. Todos os direitos reservados.
      </footer>
    </main>
  );
}
