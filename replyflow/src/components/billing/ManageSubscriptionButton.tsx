"use client";

import { useState } from "react";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";

/**
 * Abre o Stripe Customer Portal via fetch + window.location.href.
 * Evita o bug do Safari iOS que baixa a resposta quando o servidor
 * retorna um redirect 303 direto para domínio externo (Stripe).
 */
export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.message ?? "Não foi possível abrir o portal. Tente novamente.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Erro de rede. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-60"
      >
        {loading
          ? <Loader2 size={14} className="animate-spin" />
          : <CreditCard size={14} />
        }
        {loading ? "Abrindo portal…" : "Gerenciar assinatura"}
        {!loading && <ExternalLink size={12} />}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
