"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, ArrowUp, ArrowDown } from "lucide-react";

const PLAN_ORDER: Record<string, number> = {
  free: 0, starter: 1, pro: 2, agency: 3,
};

interface Props {
  priceId:     string;
  planKey:     string;       // "starter" | "pro" | "agency"
  planName:    string;
  planPrice:   number;
  currentPlan: string;
  hasStripe:   boolean;
}

/**
 * Botão de troca de plano.
 * - Assinante existente (hasStripe): chama POST /api/billing/change-plan
 * - Sem assinatura: submete form para POST /api/billing/checkout (checkout normal)
 */
export function ChangePlanButton({
  priceId, planKey, planName, planPrice, currentPlan, hasStripe,
}: Props) {
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");

  const isCurrent  = planKey === currentPlan;
  const currentIdx = PLAN_ORDER[currentPlan] ?? 0;
  const targetIdx  = PLAN_ORDER[planKey]     ?? 0;
  const isUpgrade  = targetIdx > currentIdx;

  // Plano atual — não faz nada
  if (isCurrent) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
        <CheckCircle2 size={12} />
        Plano atual
      </span>
    );
  }

  // Sucesso após trocar
  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
        <CheckCircle2 size={12} />
        Plano alterado!
      </span>
    );
  }

  // Sem Stripe ativo → checkout normal
  if (!hasStripe) {
    return (
      <form action="/api/billing/checkout" method="POST">
        <input type="hidden" name="priceId" value={priceId} />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          Assinar — R${planPrice}/mês
        </button>
      </form>
    );
  }

  // Com Stripe → troca direto
  async function handleChange() {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/billing/change-plan", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ priceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erro ao trocar plano.");
        return;
      }
      setDone(true);
      // Recarregar a página após 1.5s para refletir o novo plano
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleChange}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
          isUpgrade
            ? "text-white bg-indigo-600 hover:bg-indigo-700"
            : "text-gray-700 bg-gray-100 hover:bg-gray-200"
        }`}
      >
        {loading
          ? <Loader2 size={12} className="animate-spin" />
          : isUpgrade
            ? <ArrowUp size={12} />
            : <ArrowDown size={12} />
        }
        {loading
          ? "Alterando…"
          : isUpgrade
            ? `Upgrade para ${planName}`
            : `Downgrade para ${planName}`
        }
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
