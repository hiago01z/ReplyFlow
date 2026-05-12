"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, CreditCard, MapPin, AlertTriangle } from "lucide-react";

interface Props {
  /** Quantidade atual de locais extras da org */
  currentExtra: number;
  className?: string;
}

/**
 * Botão que compra +1 local extra via Stripe (R$49/mês).
 * Exibe modal de confirmação antes de cobrar o cartão.
 */
export function BuyExtraLocationButton({ currentExtra, className }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  async function handleConfirm() {
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
      // Slot comprado com sucesso — ir para criar local
      setShowModal(false);
      router.push("/locations/new");
      router.refresh();
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Botão principal ── */}
      <button
        type="button"
        onClick={() => { setShowModal(true); setError(""); }}
        className={
          className ??
          "inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        }
      >
        <Plus size={15} />
        Adicionar local
      </button>

      {/* ── Modal de confirmação ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-sm animate-slide-up">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Comprar local extra</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={15} />
              </button>
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
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
              <CreditCard size={13} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                O valor será cobrado <strong>proporcionalmente ao período restante</strong> no cartão cadastrado na sua assinatura atual.
              </p>
            </div>

            {/* Erro */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
                <AlertTriangle size={13} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 h-9 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 size={13} className="animate-spin" /> Processando…</>
                  : "Confirmar compra"
                }
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
