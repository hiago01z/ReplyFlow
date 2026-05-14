"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Loader2, ExternalLink,
  ChevronRight, Check, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IFoodLinkWizardProps {
  locationId:     string;
  ifoodUrl:       string | null;
  ifoodConnected: boolean;
}

// ── Step visual ──────────────────────────────────────────────────────────────
function Step({ n, label, done }: { n: number; label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
        done
          ? "bg-green-500 text-white"
          : "bg-[#EA1D2C]/10 text-[#EA1D2C]",
      )}>
        {done ? <Check size={12} /> : n}
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </div>
  );
}

// ── Main wizard ──────────────────────────────────────────────────────────────
export function IFoodLinkWizard({ locationId, ifoodUrl, ifoodConnected }: IFoodLinkWizardProps) {
  const router  = useRouter();
  const [open,    setOpen]    = useState(false);
  const [url,     setUrl]     = useState(ifoodUrl ?? "");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(ifoodConnected);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSave() {
    if (!url.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/locations/${locationId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ifood_url: url.trim(), ifood_connected: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.error === "platform_limit") {
          setError(`Limite atingido: ${data.message}`);
        } else {
          setError("Não foi possível vincular. Verifique a URL e tente novamente.");
        }
        return;
      }
      setSaved(true);
      setOpen(false);
      router.refresh();
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/locations/${locationId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ifood_url: null, ifood_connected: false }),
      });
      if (!res.ok) throw new Error();
      setSaved(false);
      setUrl("");
      setOpen(false);
      router.refresh();
    } catch {
      setError("Não foi possível desvincular.");
    } finally {
      setSaving(false);
    }
  }

  // ── Already linked ────────────────────────────────────────────────────────
  if (saved && !open) {
    return (
      <div className="flex items-center gap-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
        <CheckCircle2 size={16} className="text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">iFood vinculado</p>
          <p className="text-xs text-green-600 dark:text-green-400 truncate mt-0.5">{ifoodUrl ?? url}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-green-700 hover:text-green-900 underline shrink-0"
        >
          Alterar
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      "border rounded-xl overflow-hidden transition-all",
      open ? "border-[#EA1D2C]/40" : "border-gray-200 dark:border-[#2a2a35]",
    )}>

      {/* Header — toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Vincular restaurante no iFood
        </span>
        <ChevronRight
          size={15}
          className={cn(
            "text-gray-400 transition-transform",
            open && "rotate-90",
          )}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-white/10 pt-4">

          {/* Steps */}
          <div className="space-y-3">
            <Step n={1} label="Acesse seu restaurante no iFood (ifood.com.br)" done={saved} />
            <Step n={2} label="Copie a URL da página pública do seu restaurante" done={saved} />
            <div className="ml-8">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.ifood.com.br/delivery/cidade/bairro/meu-restaurante"
                className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]/40 bg-white dark:bg-[#18181f] text-gray-900 dark:text-gray-100"
              />
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#EA1D2C] hover:underline mt-1.5"
                >
                  <ExternalLink size={11} />
                  Verificar URL
                </a>
              )}
            </div>
            <Step n={3} label="Cole a URL acima e clique em Vincular." done={saved} />
            <Step
              n={4}
              label="Pronto! Após vincular, adicione avaliações para a IA gerar respostas."
              done={saved}
            />
            <div className="ml-8">
              <div className="bg-[#EA1D2C]/5 border border-[#EA1D2C]/20 rounded-lg px-3 py-2.5 text-xs text-[#EA1D2C] dark:text-red-300">
                <strong>Sem API pública de avaliações:</strong> a resposta gerada pela IA deve ser copiada e colada diretamente no painel do iFood (Gestor iFood). Não há publicação automática.
              </div>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5">
              <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !url.trim()}
              className="inline-flex items-center gap-2 bg-[#EA1D2C] hover:bg-[#c51722] text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
            >
              {saving
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCircle2 size={14} />
              }
              {saving ? "Salvando…" : "Vincular iFood"}
            </button>

            {saved && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={saving}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Desvincular
              </button>
            )}

            <button
              type="button"
              onClick={() => { setOpen(false); setError(null); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
