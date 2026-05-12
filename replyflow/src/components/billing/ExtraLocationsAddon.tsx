"use client";

import { useState } from "react";
import { MapPin, Loader2, Minus, Plus, CheckCircle2 } from "lucide-react";

interface Props {
  currentExtra: number;
  baseLocations: number;
  hasStripe: boolean;
}

/**
 * Seção de add-on de locais extras na página de Billing.
 * Exibe contador + / − e chama POST /api/billing/extra-locations ao atualizar.
 */
export function ExtraLocationsAddon({ currentExtra, baseLocations, hasStripe }: Props) {
  const [quantity, setQuantity] = useState(currentExtra);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [saved,    setSaved]    = useState(false);

  const total = baseLocations === Infinity ? Infinity : baseLocations + quantity;
  const addedCost = quantity * 49; // R$49/mês por local extra
  const changed = quantity !== currentExtra;

  async function handleUpdate() {
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/billing/extra-location", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ quantity }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erro ao atualizar add-on.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!hasStripe) {
    return (
      <div className="card p-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
          <MapPin size={16} className="text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">
          Entre em contato para adicionar locais extras à sua conta.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
          <MapPin size={16} className="text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Locais Adicionais</p>
          <p className="text-xs text-gray-500">R$ 49/mês por local extra</p>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-500">Locais base (incluídos no plano)</span>
          <span className="text-sm font-semibold text-gray-700">
            {baseLocations === Infinity ? "Ilimitados" : baseLocations}
          </span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-500">Locais extras</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setQuantity((q) => Math.max(0, q - 1)); setSaved(false); }}
              disabled={quantity === 0}
              className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Diminuir"
            >
              <Minus size={13} />
            </button>
            <span className="w-8 text-center text-sm font-bold text-gray-900">{quantity}</span>
            <button
              type="button"
              onClick={() => { setQuantity((q) => Math.min(20, q + 1)); setSaved(false); }}
              disabled={quantity >= 20}
              className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Aumentar"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-1 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-700">Total de locais</span>
          <span className="text-sm font-bold text-indigo-700">
            {total === Infinity ? "Ilimitados" : total}
          </span>
        </div>
      </div>

      {/* Cost hint */}
      {addedCost > 0 && (
        <p className="text-xs text-indigo-600 font-medium mt-3">
          + R$ {addedCost}/mês {quantity === 1 ? "pelo local extra" : "pelos locais extras"}
        </p>
      )}

      {/* Feedback */}
      {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      {saved && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mt-3">
          <CheckCircle2 size={13} />
          Add-on atualizado com sucesso!
        </div>
      )}

      {/* Botão de atualizar — só aparece quando valor mudou */}
      {changed && (
        <button
          type="button"
          onClick={handleUpdate}
          disabled={loading}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-semibold h-9 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? "Atualizando…" : "Atualizar add-on"}
        </button>
      )}
    </div>
  );
}
