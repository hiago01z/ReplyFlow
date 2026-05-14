import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — ReplyFlow",
  description: "Saiba como o ReplyFlow coleta, usa e protege seus dados pessoais.",
};

const LAST_UPDATED = "12 de maio de 2026";

export default function PrivacyPage() {
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
          Política de Privacidade
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-12">
          Última atualização: {LAST_UPDATED}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-400 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">1. Quem somos</h2>
            <p>
              O ReplyFlow é um serviço de Software as a Service (SaaS) desenvolvido e operado por{" "}
              <strong className="text-gray-800 dark:text-gray-200">HIVI Tecnologia Ltda.</strong> ("nós",
              "nosso"), com domínio principal em{" "}
              <strong className="text-gray-800 dark:text-gray-200">replyflow-hivi.com</strong>. O serviço
              automatiza respostas a avaliações online de negócios locais usando inteligência artificial.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">2. Dados que coletamos</h2>
            <p className="mb-3">Coletamos somente os dados necessários para prestar o serviço:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-gray-800 dark:text-gray-200">Dados de cadastro:</strong> nome, endereço
                de e-mail, senha (armazenada com hash seguro via Supabase Auth).
              </li>
              <li>
                <strong className="text-gray-800 dark:text-gray-200">Dados do negócio:</strong> nome da empresa,
                nicho de atuação, localização (cidade/estado), URLs de perfis em plataformas de reviews.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-gray-200">Tokens OAuth:</strong> tokens de acesso ao
                Google Meu Negócio e/ou Facebook Pages, necessários para leitura de avaliações e publicação de
                respostas. Armazenados de forma criptografada e nunca compartilhados.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-gray-200">Dados de pagamento:</strong> processados
                integralmente pelo Stripe. Não armazenamos número de cartão, CVV ou dados bancários. Mantemos
                apenas o identificador de cliente Stripe (<code>stripe_customer_id</code>) e o status da
                assinatura.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-gray-200">Avaliações (reviews):</strong> texto, nota,
                autor e data das avaliações importadas das plataformas conectadas ou inseridas manualmente pelo
                usuário.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-gray-200">Dados de uso:</strong> logs de acesso,
                endereço IP, browser, sistema operacional, e métricas de uso do produto (via Vercel Analytics —
                sem cookies de rastreamento).
              </li>
              <li>
                <strong className="text-gray-800 dark:text-gray-200">WhatsApp (opcional):</strong> número de
                telefone informado pelo usuário para envio de alertas via WhatsApp. Não armazenamos histórico de
                conversas.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">3. Como usamos seus dados</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Autenticar você na plataforma e manter sua sessão ativa.</li>
              <li>
                Gerar respostas de IA para suas avaliações usando o serviço OpenAI (GPT-4o-mini). O texto da
                avaliação e o perfil do negócio são enviados à API da OpenAI para geração da resposta — nunca
                são usados para treinar modelos.
              </li>
              <li>Publicar respostas nas plataformas conectadas (Google, Facebook) em seu nome.</li>
              <li>Enviar alertas por e-mail e/ou WhatsApp (se configurado) sobre novas avaliações.</li>
              <li>Processar cobranças e gerenciar sua assinatura via Stripe.</li>
              <li>Gerar relatórios mensais de desempenho de reputação.</li>
              <li>Melhorar o produto e diagnosticar problemas técnicos.</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
            <p className="mt-3">
              <strong className="text-gray-800 dark:text-gray-200">Não vendemos seus dados</strong> a terceiros,
              não os usamos para publicidade comportamental e não os compartilhamos com anunciantes.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              4. Bases legais (LGPD)
            </h2>
            <p className="mb-3">
              O tratamento de dados está em conformidade com a Lei Geral de Proteção de Dados (Lei n.º
              13.709/2018). As bases legais utilizadas são:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-gray-800 dark:text-gray-200">Execução de contrato</strong> — para
                prestar o serviço contratado (autenticação, geração de IA, publicação de respostas).
              </li>
              <li>
                <strong className="text-gray-800 dark:text-gray-200">Consentimento</strong> — para envio de
                comunicações de marketing (e-mail e WhatsApp), revogável a qualquer momento.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-gray-200">Legítimo interesse</strong> — para
                analytics agregado, segurança e prevenção a fraudes.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-gray-200">Cumprimento de obrigação legal</strong> —
                quando exigido por autoridades competentes.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              5. Compartilhamento com terceiros
            </h2>
            <p className="mb-3">
              Compartilhamos dados apenas com fornecedores essenciais à operação do serviço:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#2a2a35]">
                    <th className="text-left py-2 pr-4 font-semibold text-gray-700 dark:text-gray-300">Fornecedor</th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-700 dark:text-gray-300">Finalidade</th>
                    <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">País</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a35]">
                  {[
                    ["Supabase", "Banco de dados e autenticação", "EUA"],
                    ["OpenAI", "Geração de respostas por IA", "EUA"],
                    ["Stripe", "Processamento de pagamentos", "EUA"],
                    ["Vercel", "Hospedagem e entrega do app", "EUA"],
                    ["Resend", "Envio de e-mails transacionais", "EUA"],
                    ["Upstash", "Cache e rate limiting (Redis)", "EUA/BR"],
                    ["UltraMsg / Z-API", "Envio de alertas via WhatsApp (opcional)", "BR"],
                    ["Google", "Integração Google Meu Negócio", "EUA"],
                    ["Meta (Facebook)", "Integração Facebook Pages (opcional)", "EUA"],
                  ].map(([vendor, purpose, country]) => (
                    <tr key={vendor}>
                      <td className="py-2 pr-4 text-gray-800 dark:text-gray-200 font-medium">{vendor}</td>
                      <td className="py-2 pr-4">{purpose}</td>
                      <td className="py-2">{country}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm">
              Todos os fornecedores estão sujeitos a seus próprios termos de privacidade e, quando aplicável,
              assinaram contratos de processamento de dados compatíveis com a LGPD e/ou GDPR.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">6. Cookies e rastreamento</h2>
            <p>
              O ReplyFlow usa apenas cookies funcionais estritamente necessários para manter sua sessão
              autenticada. Não utilizamos cookies de rastreamento publicitário, pixels de retargeting ou
              ferramentas de analytics com identificação individual. O Vercel Analytics coleta métricas
              agregadas e anonimizadas sem cookies.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">7. Retenção de dados</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Dados de conta e reviews são mantidos enquanto sua conta estiver ativa.
              </li>
              <li>
                Após o cancelamento, os dados são mantidos por <strong className="text-gray-800 dark:text-gray-200">30 dias</strong> para
                fins de recuperação, depois excluídos permanentemente (exceto obrigações legais).
              </li>
              <li>
                Logs de acesso são mantidos por até <strong className="text-gray-800 dark:text-gray-200">90 dias</strong> para
                fins de segurança e diagnóstico.
              </li>
              <li>
                Dados de faturamento são mantidos por <strong className="text-gray-800 dark:text-gray-200">5 anos</strong> para
                cumprimento de obrigações fiscais.
              </li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">8. Seus direitos (LGPD)</h2>
            <p className="mb-3">Como titular dos dados, você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-gray-800 dark:text-gray-200">Confirmação e acesso</strong> — saber quais dados temos sobre você.</li>
              <li><strong className="text-gray-800 dark:text-gray-200">Correção</strong> — corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li><strong className="text-gray-800 dark:text-gray-200">Portabilidade</strong> — receber seus dados em formato estruturado (CSV/JSON).</li>
              <li><strong className="text-gray-800 dark:text-gray-200">Eliminação</strong> — solicitar a exclusão de dados tratados com base em consentimento.</li>
              <li><strong className="text-gray-800 dark:text-gray-200">Revogação do consentimento</strong> — cancelar comunicações de marketing a qualquer momento.</li>
              <li><strong className="text-gray-800 dark:text-gray-200">Oposição</strong> — se opor ao tratamento baseado em legítimo interesse.</li>
            </ul>
            <p className="mt-3">
              Para exercer qualquer direito, entre em contato pelo e-mail{" "}
              <a
                href="mailto:privacidade@replyflow-hivi.com"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                privacidade@replyflow-hivi.com
              </a>
              . Responderemos em até <strong className="text-gray-800 dark:text-gray-200">15 dias úteis</strong>.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">9. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo: criptografia em
              trânsito (TLS 1.3), criptografia em repouso no banco de dados, Row Level Security (RLS) no
              Supabase, tokens de acesso armazenados de forma segura, autenticação multifator disponível e
              rate limiting para prevenção de ataques.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              10. Transferência internacional de dados
            </h2>
            <p>
              Alguns de nossos fornecedores operam fora do Brasil (principalmente nos EUA). Essas
              transferências são realizadas com base em cláusulas contratuais padrão e mecanismos reconhecidos
              pela ANPD (Autoridade Nacional de Proteção de Dados), conforme previsto no art. 33 da LGPD.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              11. Menores de idade
            </h2>
            <p>
              O ReplyFlow é destinado exclusivamente a pessoas maiores de 18 anos e empresas. Não coletamos
              intencionalmente dados de menores de idade. Se identificarmos tal situação, excluiremos os dados
              imediatamente.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              12. Alterações nesta política
            </h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você por e-mail
              em caso de alterações materiais. O uso continuado do serviço após a notificação constitui
              aceitação das alterações.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">13. Contato e DPO</h2>
            <p>
              Para dúvidas sobre privacidade ou para exercer seus direitos, entre em contato:
            </p>
            <div className="mt-3 bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2a2a35] rounded-xl p-5 text-sm space-y-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">HIVI Tecnologia Ltda.</p>
              <p>E-mail: <a href="mailto:privacidade@replyflow-hivi.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">privacidade@replyflow-hivi.com</a></p>
              <p>Site: <a href="https://replyflow-hivi.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">replyflow-hivi.com</a></p>
            </div>
          </section>

        </div>

        {/* Divider */}
        <div className="mt-14 pt-8 border-t border-gray-100 dark:border-[#2a2a35] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400 dark:text-gray-500">
          <p>© 2024 HIVI Tecnologia Ltda. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Termos de Serviço</Link>
            <Link href="/data-deletion" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Exclusão de dados</Link>
            <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Página inicial</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
