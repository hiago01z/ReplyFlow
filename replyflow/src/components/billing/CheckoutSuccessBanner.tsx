"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface Props {
  /** Plan value read fresh from the server on each render */
  plan: string;
}

/**
 * Shown on /billing?success=1 after a Stripe checkout redirect.
 * Calls /api/billing/sync (queries Stripe directly) and redirects to
 * /billing (WITHOUT ?success=1) after success to break any reload loop.
 *
 * KEY: we NEVER use window.location.reload() because that would keep
 * ?success=1 in the URL and cause infinite re-mounting of this component.
 * Instead we navigate to /billing (no query param) via window.location.href.
 */
export function CheckoutSuccessBanner({ plan }: Props) {
  const planUpdated = plan !== "free";
  const attemptsRef = useRef(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (planUpdated) return;

    // Navigate away from ?success=1 once sync succeeds.
    // Full navigation (not router.push) forces a fresh RSC render.
    function navigateToSuccess() {
      window.location.href = "/billing?synced=1";
    }

    async function trySync() {
      attemptsRef.current += 1;
      try {
        const res  = await fetch("/api/billing/sync", { method: "POST" });
        const data = await res.json();
        if (data.synced) {
          navigateToSuccess();
          return true;
        }
      } catch {
        // silent — fallback below
      }
      return false;
    }

    // Attempt 1: immediately
    trySync();

    // Attempt 2: after 4 s
    const t1 = setTimeout(async () => {
      const ok = await trySync();
      if (!ok && attemptsRef.current >= 2) {
        // Attempt 3: after 10 s total
        const t2 = setTimeout(async () => {
          const ok2 = await trySync();
          if (!ok2) setFailed(true); // give up, show manual link
        }, 6_000);
        return () => clearTimeout(t2);
      }
    }, 4_000);

    return () => clearTimeout(t1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount — planUpdated check is inside

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

  // After 3 failed attempts, stop and show manual option
  if (failed) {
    return (
      <div className="card border-amber-200 bg-amber-50 p-4 mb-5 flex items-center gap-3">
        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
          <AlertCircle size={16} className="text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">Pagamento realizado — aguardando confirmação</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Pode levar até 2 minutos.{" "}
            <button
              onClick={() => { window.location.href = "/billing"; }}
              className="underline font-medium hover:no-underline"
            >
              Verificar agora
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-indigo-200 bg-indigo-50/60 p-4 mb-5 flex items-center gap-3">
      <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
        <Loader2 size={16} className="text-indigo-600 animate-spin" />
      </div>
      <div>
        <p className="text-sm font-semibold text-indigo-900">Processando pagamento…</p>
        <p className="text-xs text-indigo-700 mt-0.5">
          Sincronizando seu plano com o Stripe. Aguarde alguns segundos.
        </p>
      </div>
    </div>
  );
}
