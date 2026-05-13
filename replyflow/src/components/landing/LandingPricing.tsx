"use client";

import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    name: "Starter",
    monthlyPrice: 97,
    annualPrice: 970,
    description: "Para autônomos e pequenos negócios",
    features: [
      "1 local",
      "3 plataformas",
      "100 respostas IA/mês",
      "Alerta por e-mail",
      "Tom personalizado",
    ],
    cta: "Assinar Starter",
    highlight: false,
  },
  {
    name: "Pro",
    monthlyPrice: 197,
    annualPrice: 1970,
    description: "Para negócios com múltiplas unidades",
    features: [
      "Até 3 locais",
      "Todas as plataformas",
      "Respostas ilimitadas",
      "Alerta via WhatsApp",
      "Aprovação em 1 clique",
      "Relatório mensal PDF",
    ],
    cta: "Assinar Pro",
    highlight: true,
  },
  {
    name: "Agência",
    monthlyPrice: 497,
    annualPrice: 4970,
    description: "Para agências gerenciando múltiplos clientes",
    features: [
      "Até 10 clientes no painel",
      "3 locais por cliente",
      "IA ilimitada",
      "Alerta WhatsApp + aprovação 1 clique",
      "Relatório mensal PDF",
    ],
    cta: "Assinar Agência",
    highlight: false,
  },
];

export function LandingPricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* ── Toggle mensal / anual ──────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <span className={`text-sm font-medium transition-colors ${!annual ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>
          Mensal
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          aria-label={annual ? "Switch to monthly" : "Switch to annual"}
          className={`relative w-12 h-6 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
            annual ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              annual ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
        <span className={`text-sm font-medium transition-colors ${annual ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>
          Anual
        </span>
        {annual && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
            2 meses grátis
          </span>
        )}
      </div>

      {/* ── Cards de planos ───────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-6 items-center">
        {PLANS.map((plan) => {
          const displayPrice = annual
            ? Math.round(plan.annualPrice / 12)
            : plan.monthlyPrice;

          return (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 ${
                plan.highlight
                  ? "bg-indigo-600 text-white shadow-xl scale-105"
                  : "bg-white dark:bg-[#18181f] border border-gray-200 dark:border-[#2a2a35]"
              }`}
            >
              {plan.highlight && (
                <div className="text-xs font-bold text-indigo-200 mb-3 tracking-widest">
                  ★ MAIS POPULAR
                </div>
              )}
              <div
                className={`text-sm font-medium mb-1 ${
                  plan.highlight
                    ? "text-indigo-200"
                    : "text-indigo-600 dark:text-indigo-400"
                }`}
              >
                {plan.name}
              </div>

              {/* Preço */}
              <div className="flex items-end gap-1 mb-1">
                <span
                  className={`text-4xl font-bold ${
                    plan.highlight ? "text-white" : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  R$ {displayPrice}
                </span>
                <span
                  className={`text-sm mb-1 ${
                    plan.highlight ? "text-indigo-200" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  /mês
                </span>
              </div>

              {/* Total anual */}
              {annual && (
                <p
                  className={`text-xs mb-2 ${
                    plan.highlight ? "text-indigo-200" : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  R$ {plan.annualPrice}/ano — economia de R${" "}
                  {plan.monthlyPrice * 12 - plan.annualPrice}
                </p>
              )}

              <p
                className={`text-sm mb-6 ${
                  plan.highlight ? "text-indigo-100" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {plan.description}
              </p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-center gap-2 text-sm ${
                      plan.highlight ? "text-white" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span
                      className={
                        plan.highlight
                          ? "text-indigo-300"
                          : "text-indigo-600 dark:text-indigo-400"
                      }
                    >
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlight
                    ? "bg-white text-indigo-600 hover:bg-indigo-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
