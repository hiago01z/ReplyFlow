"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Props {
  hasDemo?: boolean;
  onRefresh?: () => void;
}

export function AgencyDemoButton({ hasDemo = false, onRefresh }: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading,     setLoading]     = useState(false);
  const [showDelete,  setShowDelete]  = useState(hasDemo);

  // Sync with parent when clients list updates (e.g. after onRefresh)
  useEffect(() => { setShowDelete(hasDemo); }, [hasDemo]);

  async function handleSeed() {
    setLoading(true);
    try {
      const res  = await fetch("/api/demo/agency-seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setShowDelete(true);
        success(
          "Clientes demo criados!",
          `${data.clients} clientes com ${data.reviews} reviews de teste adicionados.`,
        );
        onRefresh ? onRefresh() : router.refresh();
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
      const res  = await fetch("/api/demo/agency-seed", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setShowDelete(false);
        success("Demo removido", `${data.deleted} cliente(s) de teste removidos.`);
        onRefresh ? onRefresh() : router.refresh();
      } else {
        toastError("Erro", data.error ?? "Não foi possível remover os dados de demo.");
      }
    } catch {
      toastError("Erro de rede", "Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!showDelete) {
    return (
      <button
        onClick={handleSeed}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        title="Criar clientes e reviews de teste para explorar o painel"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <FlaskConical size={12} />}
        Demo da agência
      </button>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      title="Remover todos os clientes e dados de teste"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
      Limpar demo
    </button>
  );
}
