"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, AlertCircle } from "lucide-react";

export function SyncPlanButton() {
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<{ plan?: string; synced?: boolean; reason?: string; error?: string } | null>(null);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    setResult(null);
    try {
      const res  = await fetch("/api/billing/sync", { method: "POST" });
      const data = await res.json();
      setResult(data);
      if (data.synced) {
        router.refresh();
      }
    } catch {
      setResult({ error: "network" });
    } finally {
      setLoading(false);
    }
  }

  const notFound = result && !result.synced && !result.error;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSync}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
        title="Sincronizar plano com Stripe"
      >
        <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        {result?.synced
          ? `Plano ${result.plan} ativado!`
          : loading
          ? "Sincronizando…"
          : "Verificar plano"}
      </button>

      {/* Debug message when sync ran but found nothing */}
      {notFound && (
        <div className="flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 max-w-xs text-right">
          <AlertCircle size={11} className="shrink-0 mt-0.5" />
          <span>
            {result?.reason === 'no_stripe_customer'
              ? 'Nenhuma conta Stripe encontrada para este e-mail. Verifique se o checkout foi concluído.'
              : result?.reason === 'no_subscription'
              ? 'Cliente encontrado no Stripe, mas sem assinatura ativa. O checkout pode não ter sido finalizado.'
              : 'Assinatura não encontrada no Stripe.'}
          </span>
        </div>
      )}

      {result?.error && (
        <p className="text-[11px] text-red-500">Erro ao consultar Stripe.</p>
      )}
    </div>
  );
}
