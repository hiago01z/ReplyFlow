"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Em produção, enviar para serviço de monitoramento (Sentry, etc)
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Algo deu errado
          </h1>
          <p className="text-gray-600 mb-8">
            Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte se o problema persistir.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Tentar novamente
            </button>
            <Link
              href="/dashboard"
              className="border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Ir para o dashboard
            </Link>
          </div>
          {error.digest && (
            <p className="text-xs text-gray-400 mt-6">Código: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
