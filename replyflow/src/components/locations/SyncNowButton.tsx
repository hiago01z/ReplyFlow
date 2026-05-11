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
        const fetched  = data.fetchedFromGmb  ?? 0;
        const n        = data.newReviews       ?? 0;
        const existing = data.alreadyExisted   ?? 0;

        if (n > 0) {
          success(
            `${n} novo${n !== 1 ? "s" : ""} review${n !== 1 ? "s" : ""} encontrado${n !== 1 ? "s" : ""}!`,
            "Reviews sincronizados com sucesso.",
          );
        } else if (fetched === 0) {
          success(
            "Nenhum review encontrado no Google",
            "A API do Google não retornou reviews. Novos reviews podem levar algumas horas para aparecer após serem publicados.",
          );
        } else if (existing > 0) {
          success(
            "Tudo atualizado",
            `${fetched} review${fetched !== 1 ? "s" : ""} encontrado${fetched !== 1 ? "s" : ""} no Google — já estão sincronizados. Veja em Reviews.`,
          );
        } else {
          success("Tudo atualizado", "Nenhum review novo desde a última sincronização.");
        }
        router.refresh();
      } else if (res.status === 429) {
        toastError("Aguarde", data.message ?? "Limite de sincronizações atingido. Tente em 2 minutos.");
      } else if (res.status === 404) {
        toastError("Local não configurado", data.detail ?? "Verifique se o local está ativo e o Google Meu Negócio está vinculado nas configurações.");
      } else {
        toastError("Erro na sincronização", data.message ?? data.detail ?? "Não foi possível sincronizar. Tente novamente.");
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
