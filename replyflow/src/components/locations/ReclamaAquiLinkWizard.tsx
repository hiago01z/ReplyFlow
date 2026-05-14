"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Loader2, ExternalLink,
  ChevronRight, Check, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReclamaAquiLinkWizardProps {
  locationId:  string;
  raUrl:       string | null;
  raConnected: boolean;
}

// ── Step visual ──────────────────────────────────────────────────────────────
function Step({ n, label, done }: { n: number; label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
        done
          ? "bg-green-500 text-white"
          : "bg-[#E8281C]/10 text-[#E8281C]",
      )}>
        {done ? <Check size={12} /> : n}
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </div>
  );
}

// ── Main wizard ──────────────────────────────────────────────────────────────
export function ReclamaAquiLinkWizard({ locationId, raUrl, raConnected }: ReclamaAquiLinkWizardProps) {
  const router  = useRouter();
  const [open,    setOpen]    = useState(false);
  const [url,     setUrl]     = useState(raUrl ?? "");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(raConnected);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSave() {
    if (!url.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/locations/${locationId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reclame_aqui_url: url.trim(), reclame_aqui_connected: true }),
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
        body:    JSON.stringify({ reclame_aqui_url: null, reclame_aqui_connected: false }),
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
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">Reclame Aqui vinculado</p>
          <p className="text-xs text-green-600 dark:text-green-400 truncate mt-0.5">{raUrl ?? url}</p>
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
      open ? "border-[#E8281C]/40" : "border-gray-200 dark:border-[#2a2a35]",
    )}>

      {/* Header — toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-[#E8281C]/10 flex items-center justify-center shrink-0">
          <span className="text-base">🔴</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Vincular Reclame Aqui</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cole a URL da sua empresa — leva menos de 1 minuto
          </p>
        </div>
        <ChevronRight size={15} className={cn("text-gray-400 shrink-0 transition-transform", open && "rotate-90")} />
      </button>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-gray-100 dark:border-[#2a2a35] px-4 pb-5 pt-4 space-y-4">

          {/* Passo a passo */}
          <div className="space-y-3">
            <Step n={1} label="Acesse o Reclame Aqui e faça login como empresa:" />
            <div className="ml-8">
              <a
                href="https://www.reclameaqui.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E8281C] hover:text-[#c51f15] bg-[#E8281C]/10 border border-[#E8281C]/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                <ExternalLink size={13} />
                Abrir reclameaqui.com.br
              </a>
            </div>

            <Step n={2} label='No menu superior, clique em "Para empresas" → "Entrar" para acessar o painel:' />
            <div className="ml-8">
              <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#2a2a35] rounded-lg px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                <p><strong>Para empresas</strong> → <strong>Entrar</strong> → <strong>Minha Empresa</strong> → <strong>Ver página pública</strong></p>
                <p className="text-gray-400 dark:text-gray-500">A URL da sua página pública aparecerá na barra de endereço.</p>
              </div>
            </div>

            <Step n={3} label="Copie a URL da barra de endereço e cole abaixo:" />
            <div className="ml-8 space-y-2">
              <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#2a2a35] rounded-lg px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                <p>Exemplo de URL válida:</p>
                <p className="font-mono text-[11px] mt-1 break-all">
                  https://www.reclameaqui.com.br/empresa/nome-da-empresa/
                </p>
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.reclameaqui.com.br/empresa/..."
                className="w-full text-sm border border-gray-200 dark:border-[#2a2a35] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E8281C]/30 bg-white dark:bg-[#18181f] text-gray-800 dark:text-gray-200"
              />
            </div>

            <Step
              n={4}
              label="Pronto! Após vincular, adicione reclamações para a IA gerar respostas empáticas."
              done={saved}
            />
            <div className="ml-8">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">
                <strong>Sem API pública:</strong> a resposta gerada pela IA deve ser copiada e colada diretamente no Reclame Aqui. O status da reclamação deve ser atualizado manualmente lá.
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
              className="inline-flex items-center gap-2 bg-[#E8281C] hover:bg-[#c51f15] text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
            >
              {saving
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCircle2 size={14} />
              }
              {saving ? "Salvando…" : "Vincular Reclame Aqui"}
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
