import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Serviço — ReplyFlow",
  description: "Leia os Termos de Serviço do ReplyFlow antes de usar a plataforma.",
};

const LAST_UPDATED = "12 de maio de 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f13]">
      {/* Header */}
      <header className="border-b border-gray-100 dark:border-[#2a2a35] bg-white/90 dark:bg-[#0f0f13]/90 backdrop-blur-sm sticky top-0 z-10 px-6 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100">
            <div className="w-7 h-7 brand-gradient rounded-lg flex items-center justify-center shadow-sm">
              <Zap size={13} className="text-white fill-white" />
            </div>
            ReplyFlow
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">
          Legal
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">
          Termos de Serviço
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-12">
          Última atualização: {LAST_UPDATED}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-400 leading-relaxed">

          {/* intro */}
          <section>
            <p>
              Ao criar uma conta ou utilizar o ReplyFlow, você ("Usuário") concorda integralmente com estes
              Termos de Serviço ("Termos"). Leia-os com atenção. Se não concordar, não utilize o serviço.
            </p>
          </section>

          {/* 1 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">1. O Serviço</h2>
            <p>
              O ReplyFlow é uma plataforma SaaS que permite a empresas locais automatizar a gestão de avaliações
              (reviews) online por meio de inteligência artificial. O serviço inclui: leitura de avaliações de
              plataformas conectadas (Google Meu Negócio, Facebook Pages), geração de respostas via IA
              (OpenAI GPT-4o-mini), publicação de respostas nas plataformas, alertas por e-mail e WhatsApp,
              relatórios de reputação e painel de controle.
            </p>
            <p className="mt-3">
              O serviço é fornecido no estado em que se encontra. Reservamo-nos o direito de modificar,
              suspender ou encerrar funcionalidades com aviso prévio razoável.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">2. Elegibilidade</h2>
            <p>
              Para utilizar o ReplyFlow você deve: (a) ter pelo menos 18 anos de idade; (b) ter capacidade
              legal para celebrar contratos; (c) usar o serviço para fins comerciais legítimos; (d) ser
              responsável legal pela empresa ou ter autorização expressa para agir em seu nome.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">3. Conta e segurança</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Você é responsável por manter a confidencialidade de suas credenciais de acesso.
              </li>
              <li>
                Toda atividade realizada através de sua conta é de sua responsabilidade.
              </li>
              <li>
                Em caso de uso não autorizado, notifique-nos imediatamente em{" "}
                <a href="mailto:suporte@replyflow-hivi.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  suporte@replyflow-hivi.com
                </a>
                .
              </li>
              <li>
                É proibida a criação de múltiplas contas para burlar limites de plano ou períodos de teste.
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">4. Planos e pagamentos</h2>
            <p className="mb-3">
              O ReplyFlow oferece os seguintes planos pagos (preços em BRL, recorrência mensal ou anual):
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li><strong className="text-gray-800 dark:text-gray-200">Free</strong> — gratuito, com limitações de uso.</li>
              <li><strong className="text-gray-800 dark:text-gray-200">Starter</strong> — R$97/mês (ou equivalente anual).</li>
              <li><strong className="text-gray-800 dark:text-gray-200">Pro</strong> — R$197/mês (ou equivalente anual).</li>
              <li><strong className="text-gray-800 dark:text-gray-200">Agência</strong> — R$497/mês (ou equivalente anual).</li>
              <li><strong className="text-gray-800 dark:text-gray-200">Add-on "Local Extra"</strong> — R$49/local adicional/mês.</li>
            </ul>
            <p className="mb-3">
              Os pagamentos são processados pelo Stripe. Ao assinar, você autoriza a cobrança recorrente no
              cartão ou método de pagamento fornecido. Cobranças são efetuadas no início de cada período.
            </p>
            <p>
              <strong className="text-gray-800 dark:text-gray-200">Política de reembolso:</strong> oferecemos
              reembolso integral nos primeiros <strong className="text-gray-800 dark:text-gray-200">7 dias</strong> a
              partir da primeira cobrança, mediante solicitação por e-mail. Após esse prazo, não são
              concedidos reembolsos proporcionais por cancelamento antecipado — o acesso ao plano pago
              permanece ativo até o fim do período já pago.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">5. Período de teste</h2>
            <p>
              Novos usuários podem ter acesso a um período de teste gratuito de{" "}
              <strong className="text-gray-800 dark:text-gray-200">7 dias</strong> do plano Pro. Ao término
              do período, o plano é automaticamente convertido para o Free, salvo se uma assinatura paga for
              ativada antes. Não é necessário cartão de crédito para iniciar o teste.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">6. Cancelamento</h2>
            <p>
              Você pode cancelar sua assinatura a qualquer momento pelo painel de billing (
              <em>Configurações → Plano e Billing → Gerenciar assinatura</em>). O cancelamento é imediato,
              mas o acesso ao plano pago permanece ativo até o fim do ciclo de cobrança já pago. Após o
              término, a conta é rebaixada para o plano Free.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">7. Uso aceitável</h2>
            <p className="mb-3">Ao utilizar o ReplyFlow, você concorda em <strong className="text-gray-800 dark:text-gray-200">não</strong>:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Usar o serviço para fins ilegais, fraudulentos ou antiéticos.</li>
              <li>Publicar respostas falsas, enganosas ou que violem os Termos de Uso das plataformas de reviews (Google, Facebook, TripAdvisor).</li>
              <li>Tentar manipular o sistema de avaliações de plataformas terceiras em desacordo com suas políticas.</li>
              <li>Fazer engenharia reversa, descompilar ou tentar obter o código-fonte da plataforma.</li>
              <li>Usar o serviço para enviar spam, conteúdo ofensivo ou discriminatório.</li>
              <li>Compartilhar sua conta com terceiros não autorizados ou revender o acesso.</li>
              <li>Sobrecarregar intencionalmente a infraestrutura da plataforma (ataques DDoS, scraping excessivo, etc.).</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">8. Integrações com terceiros</h2>
            <p>
              O ReplyFlow integra com serviços de terceiros (Google, Meta/Facebook, OpenAI, Stripe, etc.). O
              uso dessas integrações está sujeito aos termos de serviço dos respectivos provedores. O
              ReplyFlow não é responsável por alterações nas APIs, suspensão de acesso por parte dos
              provedores, ou qualquer consequência decorrente do uso de serviços externos.
            </p>
            <p className="mt-3">
              Ao conectar sua conta do Google Meu Negócio ou Facebook Pages, você autoriza o ReplyFlow a ler
              avaliações e publicar respostas em seu nome, nos limites das permissões que você concede via
              OAuth. Você pode revogar esse acesso a qualquer momento.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">9. Conteúdo gerado por IA</h2>
            <p>
              As respostas geradas pelo ReplyFlow são produzidas por inteligência artificial com base nas
              informações que você fornece (perfil do negócio, tom de voz, avaliação recebida). Embora nos
              esforcemos para que as respostas sejam precisas e adequadas, <strong className="text-gray-800 dark:text-gray-200">
              você é o único responsável pelo conteúdo publicado</strong> nas plataformas de reviews em seu
              nome. Recomendamos revisar as respostas antes de publicá-las.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">10. Propriedade intelectual</h2>
            <p>
              Todo o software, design, marca, logotipo e conteúdo do ReplyFlow são de propriedade exclusiva
              da ReplyFlow Tecnologia Ltda. É vedada a reprodução, distribuição ou uso comercial sem
              autorização expressa por escrito.
            </p>
            <p className="mt-3">
              Os dados do seu negócio e as avaliações de seus clientes permanecem de sua propriedade. Você
              concede ao ReplyFlow uma licença limitada, não exclusiva e revogável para processar esses dados
              estritamente para a prestação do serviço.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              11. Limitação de responsabilidade
            </h2>
            <p className="mb-3">
              Na máxima extensão permitida pela lei aplicável, o ReplyFlow não será responsável por:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Perda de receita, lucros cessantes ou danos indiretos decorrentes do uso ou da impossibilidade de uso do serviço.</li>
              <li>Decisões tomadas com base em respostas geradas pela IA que resultem em danos reputacionais.</li>
              <li>Interrupções de serviço causadas por fornecedores terceiros (Google, Meta, OpenAI, Stripe, Vercel, etc.).</li>
              <li>Acesso não autorizado decorrente de comprometimento das suas credenciais.</li>
              <li>Alterações nas políticas das plataformas de reviews que afetem o funcionamento do serviço.</li>
            </ul>
            <p className="mt-3">
              A responsabilidade total do ReplyFlow, sob qualquer teoria, fica limitada ao valor pago pelo
              Usuário nos últimos <strong className="text-gray-800 dark:text-gray-200">3 meses</strong> de
              assinatura.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              12. Disponibilidade do serviço (SLA)
            </h2>
            <p>
              Nos esforçamos para manter o serviço disponível 24/7. No entanto, não garantimos disponibilidade
              ininterrupta. Manutenções programadas serão comunicadas com antecedência. Não emitimos créditos
              por indisponibilidade, salvo acordo específico com clientes do plano Agência.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              13. Suspensão e encerramento de conta
            </h2>
            <p>
              Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos, realizem
              atividades fraudulentas, ou cujo uso comprometa a segurança ou a qualidade do serviço para
              outros usuários. Em casos de violação grave, o encerramento pode ser imediato e sem reembolso.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              14. Alterações nos Termos
            </h2>
            <p>
              Podemos modificar estes Termos a qualquer momento. Notificaremos por e-mail sobre alterações
              materiais com pelo menos <strong className="text-gray-800 dark:text-gray-200">15 dias de antecedência</strong>.
              O uso continuado após a notificação constitui aceitação dos novos Termos.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              15. Lei aplicável e foro
            </h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da
              comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes destes Termos, com
              renúncia expressa a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          {/* 16 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">16. Contato</h2>
            <p>
              Para dúvidas, sugestões ou notificações legais:
            </p>
            <div className="mt-3 bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2a2a35] rounded-xl p-5 text-sm space-y-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">ReplyFlow Tecnologia Ltda.</p>
              <p>Suporte: <a href="mailto:suporte@replyflow-hivi.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">suporte@replyflow-hivi.com</a></p>
              <p>Jurídico: <a href="mailto:legal@replyflow-hivi.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">legal@replyflow-hivi.com</a></p>
              <p>Site: <a href="https://replyflow-hivi.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">replyflow-hivi.com</a></p>
            </div>
          </section>

        </div>

        {/* Footer divider */}
        <div className="mt-14 pt-8 border-t border-gray-100 dark:border-[#2a2a35] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400 dark:text-gray-500">
          <p>© 2026 ReplyFlow. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Política de Privacidade</Link>
            <Link href="/data-deletion" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Exclusão de dados</Link>
            <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Página inicial</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
