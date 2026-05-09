"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface DemoSeedButtonProps {
  /** Pass true when demo reviews already exist so we show the delete option too */
  hasDemo?: boolean;
}

export function DemoSeedButton({ hasDemo = false }: DemoSeedButtonProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(hasDemo);

  async function handleSeed() {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        if (data.message === "Demo data already exists") {
          setShowDelete(true);
          success("Dados já existem", "Os reviews de demo já foram inseridos. Use 'Limpar demo' para removê-los.");
        } else {
          setShowDelete(true);
          success("Reviews de demo criados!", `${data.inserted} reviews de teste adicionados com sucesso.`);
          router.refresh();
        }
      } else {
        toastError("Erro", data.error ?? "Não foi possível criar os dados de demo.");
      }
    } catch {
      toastError("Erro de rede", "Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/seed", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setShowDelete(false);
        success("Demo removido", `${data.deleted} review(s) de teste removidos.`);
        router.refresh();
      } else {
        toastError("Erro", data.error ?? "Não foi possível remover os dados de demo.");
      }
    } catch {
      toastError("Erro de rede", "Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!showDelete ? (
        <button
          onClick={handleSeed}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          title="Inserir reviews de teste para explorar o painel"
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <FlaskConical size={12} />
          )}
          Dados de demo
        </button>
      ) : (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          title="Remover todos os reviews de teste"
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Trash2 size={12} />
          )}
          Limpar demo
        </button>
      )}
    </div>
  );
}
