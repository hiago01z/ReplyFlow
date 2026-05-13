"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[DashboardError]", error);
    // Auto-retry once: Google Translate DOM mutations can cause a one-time crash;
    // a second render with fresh nodes recovers automatically.
    const t = setTimeout(() => reset(), 1500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fade-in">
      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
        <AlertTriangle size={26} className="text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Algo deu errado</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        Ocorreu um erro nesta página. Você pode tentar novamente ou voltar para o dashboard.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw size={14} />
          Tentar novamente
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <LayoutDashboard size={14} />
          Dashboard
        </button>
      </div>
      {error.digest && (
        <p className="text-xs text-gray-400 mt-5">Código: {error.digest}</p>
      )}
    </div>
  );
}
