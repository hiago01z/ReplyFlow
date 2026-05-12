"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2, X, CreditCard, MapPin, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Props {
  locationId: string;
  /** Quantidade atual de locais extras comprados pela org */
  currentExtra: number;
}

export function ReactivateLocationButton({ locationId, currentExtra }: Props) {
  const [loading,   setLoading]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [buying,    setBuying]    = useState(false);
  const [error,     setError]     = useState("");
  const router = useRouter();
  const { success, error: toastError } = useToast();

  // Tenta reativar o local. Se a API retornar needs_slot, abre o modal de compra.
  async function tryReactivate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/locations/${locationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });

      if (res.ok) {
        success("Local reativado!", "O local voltou a receber reviews.");
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (data.error === "needs_slot") {
        setShowModal(true);
        return;
      }

      toastError("Erro ao reativar", data.error ?? "Não foi possível reativar o local.");
    } catch {
      toastError("Erro de rede", "Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Compra +1 slot extra e reativa o local
  async function handleBuyAndReactivate() {
    setBuying(true);
    setError("");
    try {
      // 1. Comprar o slot extra
      const buyRes = await fetch("/api/billing/extra-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: currentExtra + 1 }),
      });
      const buyData = await buyRes.json().catch(() => ({}));
      if (!buyRes.ok) {
        setError(buyData.error ?? "Erro ao processar pagamento.");
        return;
      }

      // 2. Agora reativar o local (slot já disponível)
      const patchRes = await fetch(`/api/locations/${locationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      if (!patchRes.ok) {
        setError("Slot comprado, mas falha ao reativar. Tente novamente.");
        return;
      }

      success("Local reativado!", "Slot extra comprado e local reativado com sucesso.");
      setShowModal(false);
      router.refresh();
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setBuying(false);
    }
  }

  return (
    <>
      <button
        onClick={tryReactivate}
        disabled={loading}
        title="Reativar este local"
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <RotateCcw size={12} />
        )}
        {loading ? "Verificando…" : "Reativar"}
      </button>

      {/* ── Modal: comprar slot para reativar ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Reativar local</h2>
              <button type="button" onClick={() => setShowModal(false)} disabled={buying}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Info: limite atingido */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
              <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Você atingiu o limite de locais ativos do seu plano. Para reativar este local,
                é necessário comprar <strong>+1 slot extra</strong>.
              </p>
            </div>

            {/* Detalhes do add-on */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin size={15} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">+1 local adicional</p>
                  <p className="text-xs text-gray-500">
                    Você passará de <strong>{currentExtra}</strong> para <strong>{currentExtra + 1}</strong> local(is) extra(s)
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-indigo-100">
                <span className="text-xs text-gray-500">Cobrança adicional mensal</span>
                <span className="text-sm font-bold text-indigo-700">R$ 49,00/mês</span>
              </div>
            </div>

            {/* Aviso cartão */}
            <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-4">
              <CreditCard size={13} className="text-gray-500 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600">
                O valor será cobrado <strong>proporcionalmente ao período restante</strong> no cartão cadastrado na sua assinatura.
              </p>
            </div>

            {/* Erro */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
                <AlertTriangle size={13} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => setShowModal(false)} disabled={buying}
                className="flex-1 h-9 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button type="button" onClick={handleBuyAndReactivate} disabled={buying}
                className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
                {buying
                  ? <><Loader2 size={13} className="animate-spin" /> Processando…</>
                  : "Comprar e reativar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
