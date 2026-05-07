import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params?.email ?? "seu e-mail";

  return (
    <div className="animate-fade-in text-center">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Mail size={28} className="text-indigo-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifique seu e-mail</h1>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        Enviamos um link de confirmação para{" "}
        <span className="font-medium text-gray-700">{email}</span>.
        <br />
        Clique no link para ativar sua conta e continuar.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 text-left mb-6">
        <p className="text-xs font-semibold text-amber-700 mb-1">Não recebeu o e-mail?</p>
        <ul className="text-xs text-amber-600 space-y-1 list-disc list-inside">
          <li>Verifique a pasta de spam/lixo eletrônico</li>
          <li>Aguarde até 2 minutos para chegar</li>
          <li>O remetente será <span className="font-mono">noreply@supabase.io</span></li>
        </ul>
      </div>

      <div className="space-y-3">
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar para o login
        </Link>

        <p className="text-xs text-gray-400">
          Já confirmou?{" "}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Entrar agora
          </Link>
        </p>
      </div>
    </div>
  );
}
