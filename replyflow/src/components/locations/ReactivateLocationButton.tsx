"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Props {
  locationId: string;
}

export function ReactivateLocationButton({ locationId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { success, error: toastError } = useToast();

  async function handleReactivate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/locations/${locationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });

      if (res.ok) {
        success("Local reativado!", "O local voltou a receber reviews.");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toastError("Erro ao reativar", data.error ?? "Não foi possível reativar o local.");
      }
    } catch {
      toastError("Erro de rede", "Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReactivate}
      disabled={loading}
      title="Reativar este local"
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <RotateCcw size={12} />
      )}
      {loading ? "Reativando…" : "Reativar"}
    </button>
  );
}
