"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  /** Plan value read fresh from the server on each render */
  plan: string;
}

/**
 * Shown on /billing?success=1 after a Stripe checkout redirect.
 * On mount, calls /api/billing/sync to immediately fetch the subscription from
 * Stripe and update the DB — this works even without webhooks configured.
 * Falls back to polling via router.refresh() for webhook-based updates.
 */
export function CheckoutSuccessBanner({ plan }: Props) {
  const router = useRouter();
  const planUpdated = plan !== "free";

  useEffect(() => {
    if (planUpdated) return;

    // 1) Call sync immediately — queries Stripe directly and updates the DB.
    //    Force full reload after sync so the RSC cache is bypassed.
    fetch("/api/billing/sync", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.synced) {
          window.location.reload();
        }
      })
      .catch(() => {/* silent — fallback polling covers it */});

    // 2) Fallback polling: full reload at 4 s, 9 s, 16 s
    const t1 = setTimeout(() => window.location.reload(), 4_000);
    const t2 = setTimeout(() => window.location.reload(), 9_000);
    const t3 = setTimeout(() => window.location.reload(), 16_000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [router, planUpdated]);

  const PLAN_LABEL: Record<string, string> = {
    starter: "Starter",
    pro:     "Pro",
    agency:  "Agência",
  };

  if (planUpdated) {
    return (
      <div className="card border-green-200 bg-green-50 p-4 mb-5 flex items-center gap-3">
        <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle2 size={16} className="text-green-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-green-900">
            Assinatura ativada! 🎉
          </p>
          <p className="text-xs text-green-700 mt-0.5">
            Bem-vindo ao plano <strong>{PLAN_LABEL[plan] ?? plan}</strong>. Todos os recursos estão liberados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-indigo-200 bg-indigo-50/60 p-4 mb-5 flex items-center gap-3">
      <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 animate-pulse">
        <Loader2 size={16} className="text-indigo-600 animate-spin" />
      </div>
      <div>
        <p className="text-sm font-semibold text-indigo-900">Processando pagamento…</p>
        <p className="text-xs text-indigo-700 mt-0.5">
          Atualizando seu plano automaticamente. Aguarde alguns segundos.
        </p>
      </div>
    </div>
  );
}
