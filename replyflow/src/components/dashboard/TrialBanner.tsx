"use client";

import Link from "next/link";
import { Zap, X, Clock } from "lucide-react";
import { useState } from "react";

interface TrialBannerProps {
  trialEndsAt: string | null;
  plan: string;
}

export function TrialBanner({ trialEndsAt, plan }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Só aparece no plano free com trial configurado
  if (plan !== "free" || !trialEndsAt || dismissed) return null;

  const now = Date.now();
  const endsAt = new Date(trialEndsAt).getTime();
  const daysLeft = Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;

  // Trial expirado: banner vermelho permanente (não dispensável)
  if (isExpired) {
    return (
      <div className="card border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 mb-5 flex items-center gap-3">
        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center shrink-0">
          <Clock size={15} className="text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-900 dark:text-red-300">
            Seu período de avaliação expirou
          </p>
          <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
            Faça upgrade para continuar gerando respostas com IA.
          </p>
        </div>
        <Link
          href="/billing"
          className="shrink-0 inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Zap size={12} />
          Fazer upgrade
        </Link>
      </div>
    );
  }

  // Trial ativo: banner informativo com contagem regressiva
  const urgency = daysLeft <= 2;
  return (
    <div className={`card p-4 mb-5 flex items-center gap-3 ${
      urgency
        ? "border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900"
        : "border-indigo-200 bg-indigo-50/60 dark:bg-indigo-950/30 dark:border-indigo-900"
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        urgency ? "bg-amber-100 dark:bg-amber-900/50" : "bg-indigo-100 dark:bg-indigo-900/50"
      }`}>
        <Zap size={15} className={urgency ? "text-amber-600 dark:text-amber-400" : "text-indigo-600 dark:text-indigo-400"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${urgency ? "text-amber-900 dark:text-amber-300" : "text-indigo-900 dark:text-indigo-300"}`}>
          {daysLeft === 1
            ? "Último dia de avaliação gratuita!"
            : `${daysLeft} dias restantes no período de avaliação`}
        </p>
        <p className={`text-xs mt-0.5 ${urgency ? "text-amber-700 dark:text-amber-400" : "text-indigo-700 dark:text-indigo-400"}`}>
          Aproveite respostas ilimitadas com IA durante o trial.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/billing"
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            urgency
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          <Zap size={12} />
          Ver planos
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fechar"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
