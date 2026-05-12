"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

interface Props {
  /** Quantidade atual de locais extras da org */
  currentExtra: number;
  className?: string;
}

/**
 * Botão que compra +1 local extra via Stripe (R$49/mês) e redireciona
 * para /locations/new ao concluir.
 */
export function BuyExtraLocationButton({ currentExtra, className }: Props) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleBuy() {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/billing/extra-location", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ quantity: currentExtra + 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erro ao processar pagamento.");
        return;
      }
      // Slot comprado — ir direto para criar local
      router.push("/locations/new");
      router.refresh();
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleBuy}
        disabled={loading}
        className={
          className ??
          "inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60"
        }
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
        {loading ? "Processando…" : "Adicionar local"}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1.5">{error}</p>
      )}
    </div>
  );
}
