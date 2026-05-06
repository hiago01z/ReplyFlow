import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe, STRIPE_PLANS } from "@/lib/stripe/client";
import Link from "next/link";

const PLAN_FEATURES: Record<string, string[]> = {
  free: ["1 local", "2 plataformas", "10 respostas/mês", "Sem cartão"],
  starter: ["1 local", "3 plataformas", "Respostas ilimitadas", "Alerta por e-mail"],
  pro: ["Até 3 locais", "Todas as plataformas", "Alerta via WhatsApp", "Aprovação 1 clique", "Relatório mensal"],
  agency: ["Locais ilimitados", "Painel multi-cliente", "API de integração", "Suporte dedicado"],
};

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization:organizations(*)")
    .eq("id", user!.id)
    .single();

  const org = userRecord?.organization as {
    id: string;
    plan: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    subscription_status: string | null;
  } | null;

  const currentPlan = org?.plan ?? "free";
  const isActive = org?.subscription_status === "active";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Plano & Billing</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie sua assinatura e forma de pagamento.
        </p>
      </div>

      {/* Plano atual */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Plano atual</p>
            <p className="text-2xl font-bold text-gray-900 capitalize">{currentPlan}</p>
            {isActive && (
              <p className="text-sm text-green-600 mt-1">✓ Assinatura ativa</p>
            )}
            {!isActive && currentPlan !== "free" && (
              <p className="text-sm text-amber-600 mt-1">⚠️ Assinatura inativa</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Funcionalidades</p>
            <ul className="text-sm text-gray-700 space-y-0.5">
              {(PLAN_FEATURES[currentPlan] ?? []).map((f) => (
                <li key={f} className="flex items-center gap-1.5 justify-end">
                  <span className="text-indigo-500">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Botão portal Stripe para quem já tem assinatura */}
        {org?.stripe_customer_id && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <form action="/api/billing/portal" method="POST">
              <button
                type="submit"
                className="text-sm text-indigo-600 hover:underline font-medium"
              >
                Gerenciar assinatura (cancelar, alterar cartão) →
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Planos disponíveis */}
      {currentPlan === "free" && (
        <>
          <p className="text-sm font-medium text-gray-700 mb-4">Fazer upgrade</p>
          <div className="grid md:grid-cols-3 gap-4">
            {(["starter", "pro", "agency"] as const).map((planKey) => {
              const plan = STRIPE_PLANS[planKey];
              return (
                <div
                  key={planKey}
                  className={`bg-white rounded-2xl border p-6 ${
                    planKey === "pro" ? "border-indigo-400 shadow-md" : "border-gray-100"
                  }`}
                >
                  {planKey === "pro" && (
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-3 inline-block">
                      Mais popular
                    </span>
                  )}
                  <p className="text-lg font-bold text-gray-900 mb-1">{plan.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-4">
                    R$ {plan.price}
                    <span className="text-sm font-normal text-gray-500">/mês</span>
                  </p>
                  <ul className="space-y-2 mb-6">
                    {(PLAN_FEATURES[planKey] ?? []).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-indigo-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <form action="/api/billing/checkout" method="POST">
                    <input type="hidden" name="priceId" value={plan.priceId} />
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Assinar {plan.name}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Upgrade para Agency */}
      {(currentPlan === "starter" || currentPlan === "pro") && (
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-indigo-900">Tem uma agência ou múltiplos clientes?</p>
            <p className="text-sm text-indigo-700 mt-1">
              O plano Agência oferece clientes ilimitados por R$497/mês.
            </p>
          </div>
          <form action="/api/billing/checkout" method="POST">
            <input type="hidden" name="priceId" value={STRIPE_PLANS.agency.priceId} />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shrink-0"
            >
              Fazer upgrade →
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
