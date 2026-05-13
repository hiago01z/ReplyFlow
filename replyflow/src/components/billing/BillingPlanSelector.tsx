"use client";

import { useState } from "react";
import { CheckCircle2, Zap, Crown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlanData {
  key:      string;
  name:     string;
  priceId:  string;
  price:    number;      // preço base (mensal)
  annualPriceId:  string;
  annualPrice:    number; // preço total anual
  annualMonthly:  number; // equivalente mensal no anual
  features: string[];
}

interface BillingPlanSelectorProps {
  plans:       PlanData[];
  annualEnabled: boolean; // true se pelo menos 1 annual price ID está configurado
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  starter: <Zap       size={20} className="text-blue-500"   />,
  pro:     <Crown     size={20} className="text-indigo-500" />,
  agency:  <Building2 size={20} className="text-purple-500" />,
};

export function BillingPlanSelector({ plans, annualEnabled }: BillingPlanSelectorProps) {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* Toggle mensal / anual */}
      {annualEnabled && (
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className={cn("text-sm font-medium transition-colors", !annual ? "text-gray-900" : "text-gray-400")}>
            Mensal
          </span>
          <button
            type="button"
            onClick={() => setAnnual((v) => !v)}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
              annual ? "bg-indigo-600" : "bg-gray-200",
            )}
            aria-label={annual ? "Switch to monthly" : "Switch to annual"}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                annual ? "translate-x-6" : "translate-x-0",
              )}
            />
          </button>
          <span className={cn("text-sm font-medium flex items-center gap-1.5 transition-colors", annual ? "text-gray-900" : "text-gray-400")}>
            Anual
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">
              2 meses grátis
            </span>
          </span>
        </div>
      )}

      {/* Cards de plano */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {plans.map((plan) => {
          const isPro        = plan.key === "pro";
          const useAnnual    = annual && !!plan.annualPriceId;
          const priceId      = useAnnual ? plan.annualPriceId : plan.priceId;
          const displayPrice = useAnnual ? plan.annualMonthly : plan.price;
          const suffix       = useAnnual ? "/mês*" : "/mês";

          return (
            <div
              key={plan.key}
              className={cn(
                "relative card p-5 flex flex-col",
                isPro && "border-indigo-400 shadow-md ring-1 ring-indigo-400/20",
              )}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wide whitespace-nowrap">
                  MAIS POPULAR
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  {PLAN_ICONS[plan.key]}
                  <p className="font-semibold text-gray-900">{plan.name}</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  R$ {displayPrice}
                  <span className="text-sm font-normal text-gray-500">{suffix}</span>
                </p>
                {useAnnual && (
                  <p className="text-xs text-green-600 font-medium mt-0.5">
                    R$ {plan.annualPrice}/ano · economize R$ {plan.price * 2}
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 size={13} className="text-indigo-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <form action="/api/billing/checkout" method="POST">
                <input type="hidden" name="priceId" value={priceId} />
                <button
                  type="submit"
                  disabled={!priceId}
                  className={cn(
                    "w-full py-2.5 rounded-lg text-sm font-semibold transition-colors",
                    isPro
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                    !priceId && "opacity-50 cursor-not-allowed",
                  )}
                >
                  Assinar {plan.name}
                </button>
              </form>
            </div>
          );
        })}
      </div>

      {annual && (
        <p className="text-xs text-center text-gray-400 mb-2">
          * Cobrado como R$ {plans.map((p) => p.annualPrice).join(" / R$ ")} por ano, de uma vez.
        </p>
      )}
    </div>
  );
}
