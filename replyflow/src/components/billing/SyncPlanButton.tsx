"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

/**
 * One-click button to pull the current Stripe subscription and update the
 * plan in Supabase.  Useful when the webhook isn't configured or when the
 * user checks their plan right after payment and it still shows "Free".
 */
export function SyncPlanButton() {
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    try {
      await fetch("/api/billing/sync", { method: "POST" });
      router.refresh();
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
      title="Sincronizar plano com Stripe"
    >
      <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
      {done ? "Plano sincronizado" : loading ? "Sincronizando…" : "Verificar plano"}
    </button>
  );
}
