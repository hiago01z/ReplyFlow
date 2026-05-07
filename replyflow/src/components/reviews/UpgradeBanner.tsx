import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";

interface UpgradeBannerProps {
  used: number;
  limit: number;
}

export function UpgradeBanner({ used, limit }: UpgradeBannerProps) {
  const pct = Math.min(Math.round((used / limit) * 100), 100);
  const isAtLimit = used >= limit;

  if (pct < 70) return null; // only show when >= 70% used

  return (
    <div className={`card p-4 flex items-center gap-4 mb-4 ${
      isAtLimit
        ? "border-red-200 bg-red-50/60"
        : "border-amber-200 bg-amber-50/60"
    }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        isAtLimit ? "bg-red-500" : "bg-amber-500"
      }`}>
        <Zap size={16} className="text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isAtLimit ? "text-red-900" : "text-amber-900"}`}>
          {isAtLimit
            ? `Limite de respostas atingido — ${used}/${limit} este mês`
            : `${used} de ${limit} respostas usadas este mês`}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 bg-white/70 rounded-full overflow-hidden max-w-[120px]">
            <div
              className={`h-full rounded-full transition-all ${isAtLimit ? "bg-red-500" : "bg-amber-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-xs font-medium ${isAtLimit ? "text-red-700" : "text-amber-700"}`}>
            {pct}%
          </span>
        </div>
        {isAtLimit && (
          <p className="text-xs text-red-700 mt-0.5">
            Você não pode gerar novas respostas com IA. Faça upgrade para continuar.
          </p>
        )}
      </div>

      <Link
        href="/billing"
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
          isAtLimit
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-amber-500 text-white hover:bg-amber-600"
        }`}
      >
        Ver planos <ArrowRight size={12} />
      </Link>
    </div>
  );
}
