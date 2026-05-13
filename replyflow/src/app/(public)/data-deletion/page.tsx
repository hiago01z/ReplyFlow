import Link from "next/link";
import { Zap, ArrowLeft, Trash2, Mail, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exclusão de Dados — ReplyFlow",
  description: "Saiba como solicitar a exclusão completa dos seus dados pessoais no ReplyFlow.",
};

const LAST_UPDATED = "12 de maio de 2026";

export default function DataDeletionPage() {
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
          Exclusão de Dados do Usuário
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-12">
          Última atualização: {LAST_UPDATED}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-400 leading-relaxed">

          {/* Intro */}
          <section>
            <p>
              O ReplyFlow respeita o seu direito à privacidade e à autodeterminação informacional. Esta página
              descreve como você pode solicitar a exclusão de todos os seus dados pessoais armazenados em nossa
              plataforma, em conformidade com a{" "}
              <strong className="text-gray-800 dark:text-gray-200">
                Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)
              </strong>{" "}
              e o{" "}
              <strong className="text-gray-800 dark:text-gray-200">
                Regulamento Geral de Proteção de Dados da UE (GDPR)
              </strong>.
            </p>
          </section>

          {/* 1 — O que será excluído */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Trash2 size={18} className="text-red-500 shrink-0" />
              1. O que será excluído
            </h2>
            <p className="mb-3">
              Ao solicitar a exclusão da sua conta, removemos <strong className="text-gray-800 dark:text-gray-200">permanentemente</strong> os seguintes dados:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Dados cadastrais: nome, endereço de e-mail e senha (hash).</li>
              <li>Dados da organização: nome da empresa, nicho, configurações de tom e plano.</li>
              <li>Locais cadastrados e respectivas credenciais OAuth do Google Meu Negócio.</li>
              <li>Reviews importados ou coletados de plataformas externas.</li>
              <li>Respostas geradas pela IA, rascunhos e histórico de publicações.</li>
              <li>Configurações de alertas, webhooks e integrações (WhatsApp, e-mail).</li>
              <li>Dados de pagamento no Supabase (o identificador de cliente Stripe é desvinculado;
                o histórico financeiro permanece no Stripe conforme exigências legais).</li>
              <li>Logs de uso e preferências do painel.</li>
            </ul>
          </section>

          {/* 2 — O que não pode ser excluído imediatamente */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500 shrink-0" />
              2. Dados retidos por obrigação legal
            </h2>
            <p>
              Alguns dados podem ser retidos por prazo determinado para cumprimento de obrigações legais ou
              exercício regular de direitos em processos judiciais ou administrativos:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                <strong className="text-gray-800 dark:text-gray-200">Registros de acesso à internet</strong>{" "}
                (endereço IP, data e hora): retidos por até{" "}
                <strong className="text-gray-800 dark:text-gray-200">6 meses</strong>, conforme exige o{" "}
                Marco Civil da Internet (Lei nº 12.965/2014).
              </li>
              <li>
                <strong className="text-gray-800 dark:text-gray-200">Dados fiscais e de cobrança</strong>:
                retidos pelo Stripe pelo prazo legal aplicável (geralmente 5 a 10 anos dependendo da jurisdição).
              </li>
            </ul>
          </section>

          {/* 3 — Como solicitar */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Mail size={18} className="text-indigo-500 shrink-0" />
              3. Como solicitar a exclusão
            </h2>
            <p className="mb-4">
              Você pode solicitar a exclusão dos seus dados por qualquer um dos métodos abaixo:
            </p>

            {/* Opção 1 — pelo painel */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-xl p-5 mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">
                Opção 1 — Pelo próprio painel (recomendado)
              </h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-sm">
                <li>Acesse <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">replyflow-hivi.com/login</Link> e faça login.</li>
                <li>Vá em <strong className="text-gray-800 dark:text-gray-200">Configurações → Conta</strong>.</li>
                <li>Clique em <strong className="text-gray-800 dark:text-gray-200">"Excluir minha conta"</strong> e confirme.</li>
                <li>Todos os dados listados na seção 1 serão excluídos imediatamente.</li>
              </ol>
            </div>

            {/* Opção 2 — por e-mail */}
            <div className="bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2a2a35] rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">
                Opção 2 — Por e-mail
              </h3>
              <p className="text-sm mb-3">
                Envie um e-mail para{" "}
                <a
                  href="mailto:privacidade@replyflow-hivi.com"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  privacidade@replyflow-hivi.com
                </a>{" "}
                com o assunto <strong className="text-gray-800 dark:text-gray-200">"Solicitação de Exclusão de Dados"</strong> contendo:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-sm">
                <li>O endereço de e-mail vinculado à sua conta ReplyFlow.</li>
                <li>Confirmação de que você é o titular da conta (responderemos com uma verificação).</li>
              </ul>
            </div>
          </section>

          {/* 4 — Prazo */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Clock size={18} className="text-green-500 shrink-0" />
              4. Prazo para processamento
            </h2>
            <p>
              Solicitações enviadas por e-mail são processadas em até{" "}
              <strong className="text-gray-800 dark:text-gray-200">15 dias úteis</strong> a contar do
              recebimento e verificação da identidade do solicitante. Solicitações feitas diretamente pelo
              painel são executadas <strong className="text-gray-800 dark:text-gray-200">imediatamente</strong>.
              Enviaremos uma confirmação por e-mail quando a exclusão for concluída.
            </p>
          </section>

          {/* 5 — Revogação OAuth */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-teal-500 shrink-0" />
              5. Revogação de permissões no Google
            </h2>
            <p>
              Ao excluir sua conta, o ReplyFlow remove internamente todos os tokens OAuth armazenados. Para
              garantir que o acesso seja completamente revogado no lado do Google, recomendamos também:
            </p>
            <ol className="list-decimal pl-5 space-y-2 mt-3">
              <li>
                Acesse{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  myaccount.google.com/permissions
                </a>
                .
              </li>
              <li>Localize <strong className="text-gray-800 dark:text-gray-200">ReplyFlow</strong> na lista de aplicativos com acesso.</li>
              <li>Clique em <strong className="text-gray-800 dark:text-gray-200">"Remover acesso"</strong>.</li>
            </ol>
          </section>

          {/* 6 — Contato */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">6. Contato do encarregado (DPO)</h2>
            <p className="mb-3">
              Para dúvidas sobre este processo ou sobre o tratamento dos seus dados pessoais:
            </p>
            <div className="bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2a2a35] rounded-xl p-5 text-sm space-y-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">ReplyFlow Tecnologia Ltda.</p>
              <p>Privacidade / DPO: <a href="mailto:privacidade@replyflow-hivi.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">privacidade@replyflow-hivi.com</a></p>
              <p>Suporte: <a href="mailto:suporte@replyflow-hivi.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">suporte@replyflow-hivi.com</a></p>
              <p>Site: <a href="https://replyflow-hivi.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">replyflow-hivi.com</a></p>
            </div>
          </section>

        </div>

        {/* Footer divider */}
        <div className="mt-14 pt-8 border-t border-gray-100 dark:border-[#2a2a35] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400 dark:text-gray-500">
          <p>© 2026 ReplyFlow. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Política de Privacidade</Link>
            <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Termos de Serviço</Link>
            <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Página inicial</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
