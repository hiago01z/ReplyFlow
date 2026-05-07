import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe, STRIPE_PLANS } from "@/lib/stripe/client";
import Link from "next/link";
import { CreditCard, CheckCircle2, Zap, Crown, Building2, ExternalLink } from "lucide-react";

const PLAN_FEATURES: Record<string, string[]> = {
  free:    ["1 local", "2 plataformas", "10 respostas/mês", "Sem cartão"],
  starter: ["1 local", "3 plataformas", "Respostas ilimitadas", "Alerta por e-mail"],
  pro:     ["Até 3 locais", "Todas as plataformas", "Alerta via WhatsApp", "Aprovação 1 clique", "Relatório mensal"],
  agency:  ["Locais ilimitados", "Painel multi-cliente", "API de integração", "Suporte dedicado"],
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free:    <Zap size={20} className="text-gray-500" />,
  starter: <Zap size={20} className="text-blue-500" />,
  pro:     <Crown size={20} className="text-indigo-500" />,
  agency:  <Building2 size={20} className="text-purple-500" />,
};

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users").select("organization:organizations(*)").eq("id", user!.id).single();

  const org = userRecord?.organization as unknown as {
    id: string; plan: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    subscription_status: string | null;
  } | null;

  const currentPlan = org?.plan ?? "free";
  const isActive    = org?.subscription_status === "active";

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Billing</p>
        <h1 className="text-2xl font-bold text-gray-900">Plano & Assinatura</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie sua assinatura e forma de pagamento.</p>
      </div>

      {/* Current plan card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              {PLAN_ICONS[currentPlan]}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-lg font-bold text-gray-900 capitalize">{currentPlan}</p>
                {isActive && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} />
                    Ativo
                  </span>
                )}
                {!isActive && currentPlan !== "free" && (
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Inativo
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">Plano atual</p>
            </div>
          </div>

          {/* Features */}
          <ul className="hidden md:block space-y-1 text-right shrink-0">
            {(PLAN_FEATURES[currentPlan] ?? []).map((f) => (
              <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5 justify-end">
                <span className="text-indigo-400">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Manage subscription link */}
        {org?.stripe_customer_id && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <form action="/api/billing/portal" method="POST">
              <button type="submit" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                <CreditCard size={14} />
                Gerenciar assinatura
                <ExternalLink size={12} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Upgrade grid */}
      {currentPlan === "free" && (
        <>
          <p className="text-sm font-semibold text-gray-700 mb-4">Escolha um plano</p>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {(["starter", "pro", "agency"] as const).map((planKey) => {
              const plan = STRIPE_PLANS[planKey];
              const isPro = planKey === "pro";
              return (
                <div
                  key={planKey}
                  className={`relative card p-5 flex flex-col ${isPro ? "border-indigo-400 shadow-md ring-1 ring-indigo-400/20" : ""}`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wide">
                      MAIS POPULAR
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      {PLAN_ICONS[planKey]}
                      <p className="font-semibold text-gray-900">{plan.name}</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      R$ {plan.price}
                      <span className="text-sm font-normal text-gray-500">/mês</span>
                    </p>
                  </div>
                  <ul className="space-y-2 mb-5 flex-1">
                    {(PLAN_FEATURES[planKey] ?? []).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle2 size={13} className="text-indigo-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <form action="/api/billing/checkout" method="POST">
                    <input type="hidden" name="priceId" value={plan.priceId} />
                    <button
                      type="submit"
                      className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        isPro
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Assinar {plan.name}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-center text-gray-400">
            Todos os planos incluem 7 dias grátis. Sem fidelidade. Cancele quando quiser.
          </p>
        </>
      )}

      {/* Agency upsell */}
      {(currentPlan === "starter" || currentPlan === "pro") && (
        <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 size={20} className="text-indigo-500 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Tem uma agência ou múltiplos clientes?</p>
              <p className="text-xs text-gray-500 mt-0.5">Locais ilimitados por R$497/mês.</p>
            </div>
          </div>
          <form action="/api/billing/checkout" method="POST" className="shrink-0">
            <input type="hidden" name="priceId" value={STRIPE_PLANS.agency.priceId} />
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
              Ver plano Agência →
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
