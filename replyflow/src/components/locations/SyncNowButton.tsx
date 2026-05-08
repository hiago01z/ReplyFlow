"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface Props {
  locationId: string;
}

export function SyncNowButton({ locationId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { success, error: toastError } = useToast();

  async function handleSync() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/locations/${locationId}/sync`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const n = data.newReviews ?? 0;
        success(
          n > 0 ? `${n} novo${n !== 1 ? "s" : ""} review${n !== 1 ? "s" : ""} encontrado${n !== 1 ? "s" : ""}!` : "Tudo atualizado",
          n > 0 ? "Reviews sincronizados com sucesso." : "Nenhum review novo desde a última sincronização.",
        );
        router.refresh();
      } else if (res.status === 429) {
        toastError("Aguarde", data.message ?? "Limite de sincronizações atingido. Tente em 2 minutos.");
      } else if (res.status === 404) {
        toastError("Google não conectado", "Conecte o Google Meu Negócio primeiro.");
      } else {
        toastError("Erro", data.message ?? "Não foi possível sincronizar.");
      }
    } catch {
      toastError("Erro de rede", "Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      title="Buscar novos reviews agora"
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
        loading
          ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
          : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300",
      )}
    >
      <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
      {loading ? "Sincronizando…" : "Sincronizar"}
    </button>
  );
}
