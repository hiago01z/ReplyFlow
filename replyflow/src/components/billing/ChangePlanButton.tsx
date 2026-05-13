"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, ArrowUp, ArrowDown, X, AlertTriangle } from "lucide-react";

const PLAN_ORDER: Record<string, number> = {
  free: 0, starter: 1, pro: 2, agency: 3,
};

interface PreviewLine {
  description: string;
  amount:      number;
}

interface Props {
  priceId:     string;
  planKey:     string;
  planName:    string;
  planPrice:   number;
  planCurrency: string;
  currentPlan: string;
  hasStripe:   boolean;
}

function fmtCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ChangePlanButton({
  priceId, planKey, planName, planPrice, planCurrency, currentPlan, hasStripe,
}: Props) {
  const [showModal,    setShowModal]    = useState(false);
  const [loadPreview,  setLoadPreview]  = useState(false);
  const [preview,      setPreview]      = useState<{ amountDue: number; currency: string; lines: PreviewLine[] } | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [confirming,   setConfirming]   = useState(false);
  const [done,         setDone]         = useState(false);
  const [error,        setError]        = useState("");

  const isCurrent  = planKey === currentPlan;
  const currentIdx = PLAN_ORDER[currentPlan] ?? 0;
  const targetIdx  = PLAN_ORDER[planKey]     ?? 0;
  const isUpgrade  = targetIdx > currentIdx;

  // ── Plano atual ───────────────────────────────────────────────────────────
  if (isCurrent) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
        <CheckCircle2 size={12} />
        Plano atual
      </span>
    );
  }

  // ── Sucesso ───────────────────────────────────────────────────────────────
  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
        <CheckCircle2 size={12} />
        Plano alterado!
      </span>
    );
  }

  // ── Sem Stripe → checkout normal ──────────────────────────────────────────
  if (!hasStripe) {
    return (
      <form action="/api/billing/checkout" method="POST">
        <input type="hidden" name="priceId" value={priceId} />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          Assinar — {fmtCurrency(planPrice, planCurrency)}/mês
        </button>
      </form>
    );
  }

  // ── Abrir modal com preview ────────────────────────────────────────────────
  async function openModal() {
    setShowModal(true);
    setPreview(null);
    setPreviewError("");
    setLoadPreview(true);
    try {
      const res  = await fetch(`/api/billing/change-plan/preview?priceId=${priceId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPreviewError(data.error ?? "Não foi possível calcular o valor.");
        return;
      }
      setPreview(data);
    } catch {
      setPreviewError("Erro de rede. Tente novamente.");
    } finally {
      setLoadPreview(false);
    }
  }

  // ── Confirmar troca ────────────────────────────────────────────────────────
  async function confirmChange() {
    setConfirming(true);
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
      setShowModal(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      {/* ── Botão principal ── */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={openModal}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            isUpgrade
              ? "text-white bg-indigo-600 hover:bg-indigo-700"
              : "text-gray-700 bg-gray-100 hover:bg-gray-200"
          }`}
        >
          {isUpgrade ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          {isUpgrade ? `Upgrade para ${planName}` : `Downgrade para ${planName}`}
        </button>
        {error && <p className="text-[11px] text-red-600">{error}</p>}
      </div>

      {/* ── Modal de confirmação ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-sm animate-slide-up">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                {isUpgrade ? "Confirmar upgrade" : "Confirmar downgrade"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Resumo da troca */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-700">
              <span className="font-medium capitalize">{currentPlan}</span>
              <ArrowUp size={13} className={isUpgrade ? "text-indigo-500" : "text-gray-400 rotate-180"} />
              <span className="font-bold text-indigo-700">{planName}</span>
              <span className="ml-auto text-xs text-gray-500">{fmtCurrency(planPrice, planCurrency)}/mês</span>
            </div>

            {/* Preview de cobrança */}
            {loadPreview && (
              <div className="flex items-center gap-2 py-4 justify-center text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                Calculando valor proporcional…
              </div>
            )}

            {previewError && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
                <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">{previewError}</p>
              </div>
            )}

            {preview && !loadPreview && (
              <div className="mb-4 space-y-2">
                {preview.lines.map((line, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 text-xs text-gray-600">
                    <span className="flex-1 leading-relaxed">{line.description}</span>
                    <span className={`font-semibold shrink-0 ${line.amount < 0 ? "text-green-600" : "text-gray-900"}`}>
                      {line.amount < 0 ? "−" : ""}{fmtCurrency(Math.abs(line.amount), preview.currency)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">
                    {preview.amountDue > 0 ? "Total a pagar agora" : preview.amountDue < 0 ? "Crédito gerado" : "Sem cobrança imediata"}
                  </span>
                  <span className={`text-sm font-bold ${preview.amountDue > 0 ? "text-indigo-700" : "text-green-600"}`}>
                    {fmtCurrency(Math.abs(preview.amountDue), preview.currency)}
                  </span>
                </div>
              </div>
            )}

            {/* Aviso downgrade */}
            {!isUpgrade && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
                <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Ao fazer downgrade, recursos do plano atual serão limitados ao final do período pago.
                </p>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 h-9 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmChange}
                disabled={confirming || loadPreview}
                className={`flex-1 h-9 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 ${
                  isUpgrade ? "bg-indigo-600 hover:bg-indigo-700" : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {confirming
                  ? <><Loader2 size={13} className="animate-spin" /> Aplicando…</>
                  : isUpgrade ? "Confirmar upgrade" : "Confirmar downgrade"
                }
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
