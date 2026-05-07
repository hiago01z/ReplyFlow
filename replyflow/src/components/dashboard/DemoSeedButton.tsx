"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface DemoSeedButtonProps {
  hasDemo?: boolean; // true = já tem dados de demo, mostra banner de remoção
}

export function DemoSeedButton({ hasDemo = false }: DemoSeedButtonProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading,   setLoading]   = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  async function handleSeed() {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      success("Dados de demo carregados!", `${data.inserted ?? 6} reviews de exemplo foram adicionados.`);
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Tente novamente.";
      error("Erro ao carregar demo", msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/seed", { method: "DELETE" });
      if (!res.ok) throw new Error();
      success("Demo removido!", "Os reviews de demonstração foram apagados.");
      router.refresh();
    } catch {
      error("Erro ao remover demo", "Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Banner de remoção — aparece quando já há dados de demo
  if (hasDemo) {
    return (
      <div className="card border-amber-200 bg-amber-50 p-4 mb-6 flex items-center gap-3">
        <Sparkles size={16} className="text-amber-500 shrink-0" />
        <p className="text-xs text-amber-800 flex-1">
          Você está visualizando <strong>dados de demonstração</strong>. Remova-os quando quiser começar com dados reais.
        </p>
        <button
          onClick={handleRemove}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 bg-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 shrink-0"
        >
          <Trash2 size={12} />
          {loading ? "Removendo…" : "Remover demo"}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 transition-colors shrink-0"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  // Banner de carregamento — aparece quando não há reviews
  return (
    <div className="card border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-5 mb-6 flex items-center gap-4">
      <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center shrink-0">
        <Sparkles size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Experimente com dados de demonstração</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Carregue 6 reviews fictícios para ver o dashboard em ação sem precisar conectar o Google.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleSeed}
          disabled={loading}
          className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Carregando…" : "Carregar demo"}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/60 hover:text-gray-600 transition-colors"
          aria-label="Fechar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
