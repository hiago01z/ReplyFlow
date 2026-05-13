import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { CURRENCY_PLANS, CURRENCY_ANNUAL_PLANS, getCurrencyFromCountry } from "@/lib/stripe/client";
import { syncPlanFromStripe } from "@/lib/stripe/syncPlan";
import { headers } from "next/headers";
import { BillingPlanSelector } from "@/components/billing/BillingPlanSelector";
import Link from "next/link";
import {
  CheckCircle2, Zap, Crown, Building2, Clock, RefreshCw,
} from "lucide-react";
import { CheckoutSuccessBanner } from "@/components/billing/CheckoutSuccessBanner";
import { ManageSubscriptionButton } from "@/components/billing/ManageSubscriptionButton";
import { ChangePlanButton } from "@/components/billing/ChangePlanButton";

export const dynamic = "force-dynamic";

// ── Static data maps ──────────────────────────────────────────────────────────

const PLAN_FEATURES: Record<string, string[]> = {
  free:    ["1 local", "2 plataformas", "10 respostas/mês", "Sem cartão"],
  starter: ["1 local", "3 plataformas", "50 respostas IA/mês", "Alerta por e-mail"],
  pro:     ["Até 3 locais", "Todas as plataformas", "Alerta via WhatsApp", "Aprovação 1 clique", "Relatório mensal"],
  agency:  ["Até 10 clientes no painel", "3 locais por cliente", "IA ilimitada", "Alerta WhatsApp + aprovação 1 clique", "Relatório mensal PDF"],
};

const PLAN_LABEL: Record<string, string> = {
  free: "Free", starter: "Starter", pro: "Pro", agency: "Agência",
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free:    <Zap      size={20} className="text-gray-500"   />,
  starter: <Zap      size={20} className="text-blue-500"   />,
  pro:     <Crown    size={20} className="text-indigo-500" />,
  agency:  <Building2 size={20} className="text-purple-500"/>,
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?:  string;
    canceled?: string;
    synced?:   string;
    verify?:   string;   // ?verify=1 → server-side Stripe sync on this render
  }>;
}) {
  const params = await searchParams;

  // Detect user currency via Vercel geo header (falls back to USD for non-BR)
  const reqHeaders = await headers();
  const country = reqHeaders.get("x-vercel-ip-country");
  const currency = getCurrencyFromCountry(country);
  const activePlans = CURRENCY_PLANS[currency];
  const activeAnnualPlans = CURRENCY_ANNUAL_PLANS[currency];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("email, organization:organizations(id,plan,stripe_customer_id,stripe_subscription_id,subscription_status,extra_locations,stripe_extra_locations_item_id)")
    .eq("id", user!.id)
    .single();

  const org = userRecord?.organization as unknown as {
    id: string;
    plan: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    subscription_status: string | null;
    extra_locations?: number;
    stripe_extra_locations_item_id?: string | null;
    trial_ends_at?: string | null;
  } | null;

  // ── Server-side Stripe sync (triggered by ?verify=1 link) ─────────────────
  // This runs on the server during SSR — no client JS, no reload, no cache.
  let syncResult: { plan: string; synced: boolean; reason?: string } | null = null;

  if ((params.verify === "1" || params.success === "1") && org?.id) {
    // Always sync when explicitly requested (?verify=1) or after checkout (?success=1).
    // This ensures stale DB state is refreshed on every explicit user action.
    syncResult = await syncPlanFromStripe(
      org.id,
      org.stripe_customer_id,
      userRecord?.email ?? user?.email,
    );
  }

  // syncResult.plan is freshest (Stripe-sourced); org.plan is DB fallback
  const currentPlan  = syncResult?.synced ? syncResult.plan : (org?.plan ?? "free");
  // isActive: true whenever plan is paid (regardless of Stripe status)
  const isActive     = currentPlan !== "free" || org?.subscription_status === "active" || syncResult?.synced === true;
  // hasStripe: only show Stripe actions when customer ID exists
  const hasStripe    = !!org?.stripe_customer_id;

  const trialEndsAt   = org?.trial_ends_at ?? null;
  const trialActive   = trialEndsAt ? new Date(trialEndsAt).getTime() > Date.now() : false;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Billing</p>
        <h1 className="text-2xl font-bold text-gray-900">Plano & Assinatura</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie sua assinatura e forma de pagamento.</p>
      </div>

      {/* ── Checkout success banner (auto-sync on first redirect) ───────────── */}
      {params.success === "1" && !params.synced && currentPlan === "free" && (
        <CheckoutSuccessBanner plan={currentPlan} />
      )}

      {/* ── Server-side sync result ──────────────────────────────────────────── */}
      {syncResult?.synced && (
        <div className="card border-green-200 bg-green-50 p-4 mb-5 flex items-center gap-3">
          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900">Assinatura encontrada! 🎉</p>
            <p className="text-xs text-green-700 mt-0.5">
              Plano <strong>{PLAN_LABEL[syncResult.plan] ?? syncResult.plan}</strong> ativado com sucesso.
            </p>
          </div>
        </div>
      )}
      {params.verify === "1" && syncResult && !syncResult.synced && currentPlan === "free" && (
        <div className="card border-amber-200 bg-amber-50 p-4 mb-5 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <RefreshCw size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">Assinatura não encontrada no Stripe</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {syncResult.reason === "no_active_subscription"
                ? "Nenhuma assinatura ativa encontrada. O checkout pode não ter sido finalizado."
                : "Erro ao consultar o Stripe. Tente novamente em alguns instantes."}
            </p>
          </div>
        </div>
      )}

      {/* ── Sync completed via client banner ────────────────────────────────── */}
      {params.synced === "1" && currentPlan !== "free" && (
        <div className="card border-green-200 bg-green-50 p-4 mb-5 flex items-center gap-3">
          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900">Assinatura ativada! 🎉</p>
            <p className="text-xs text-green-700 mt-0.5">
              Todos os recursos do plano <strong>{PLAN_LABEL[currentPlan] ?? currentPlan}</strong> estão liberados.
            </p>
          </div>
        </div>
      )}

      {/* ── Checkout canceled ────────────────────────────────────────────────── */}
      {params.canceled === "1" && (
        <div className="card border-amber-200 bg-amber-50 p-4 mb-5 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-base">↩️</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">Pagamento cancelado</p>
            <p className="text-xs text-amber-700 mt-0.5">Nenhuma cobrança foi efetuada.</p>
          </div>
        </div>
      )}

      {/* ── Trial banners ────────────────────────────────────────────────────── */}
      {currentPlan === "free" && trialActive && (
        <div className="card border-indigo-200 bg-indigo-50/60 p-4 mb-5 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={16} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-indigo-900">
              Período de avaliação — {trialDaysLeft} {trialDaysLeft === 1 ? "dia restante" : "dias restantes"}
            </p>
            <p className="text-xs text-indigo-700 mt-0.5">
              Aproveite respostas ilimitadas durante o trial. Faça upgrade antes de expirar.
            </p>
          </div>
        </div>
      )}
      {currentPlan === "free" && !trialActive && trialEndsAt && (
        <div className="card border-red-200 bg-red-50 p-4 mb-5 flex items-center gap-3">
          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={16} className="text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">Período de avaliação expirado</p>
            <p className="text-xs text-red-700 mt-0.5">
              Faça upgrade para continuar gerando respostas com IA sem limitações.
            </p>
          </div>
        </div>
      )}

      {/* ── Current plan card ────────────────────────────────────────────────── */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              {PLAN_ICONS[currentPlan]}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-lg font-bold text-gray-900">
                  {PLAN_LABEL[currentPlan] ?? currentPlan}
                </p>
                {isActive && currentPlan !== "free" && (
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

          {/* Features list */}
          <ul className="hidden md:block space-y-1 text-right shrink-0">
            {(PLAN_FEATURES[currentPlan] ?? []).map((f) => (
              <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5 justify-end">
                <span className="text-indigo-400">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions row */}
        <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          {hasStripe ? (
            <ManageSubscriptionButton />
          ) : (
            <span />
          )}

          {/* Verificar/vincular plano — sempre visível */}
          <Link
            href="/billing?verify=1"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            title="Sincronizar plano com Stripe"
          >
            <RefreshCw size={12} className={params.verify === "1" ? "animate-spin" : ""} />
            {params.verify === "1"
              ? "Verificando…"
              : hasStripe
                ? "Verificar plano"
                : "Vincular assinatura Stripe"}
          </Link>
        </div>
      </div>

      {/* ── Planos disponíveis (sempre visível) ──────────────────────────────── */}
      {(() => {
        const planKeys = ["starter", "pro", "agency"] as const;
        // Para free sem stripe ativo → mostrar selector completo com toggle anual
        if (currentPlan === "free" && !isActive) {
          const selectorPlans = planKeys.map((key) => ({
            key,
            name:           activePlans[key].name,
            priceId:        activePlans[key].priceId,
            price:          activePlans[key].price,
            annualPriceId:  activeAnnualPlans[key].priceId,
            annualPrice:    activeAnnualPlans[key].price,
            annualMonthly:  activeAnnualPlans[key].monthlyEquiv,
            features:       PLAN_FEATURES[key] ?? [],
          }));
          const annualEnabled = selectorPlans.some((p) => !!p.annualPriceId);
          return (
            <>
              <p className="text-sm font-semibold text-gray-700 mb-4">Escolha um plano</p>
              <BillingPlanSelector plans={selectorPlans} annualEnabled={annualEnabled} currency={currency} />
              <p className="text-xs text-center text-gray-400 mt-2">
                Todos os planos incluem 7 dias grátis. Sem fidelidade. Cancele quando quiser.
              </p>
            </>
          );
        }

        // Para assinantes ativos → grid compacto com botão Upgrade/Downgrade
        return (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Trocar plano</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {planKeys.map((key) => {
                const plan = activePlans[key];
                return (
                  <div
                    key={key}
                    className={`card p-4 space-y-3 ${key === currentPlan ? "border-indigo-300 bg-indigo-50/40" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {PLAN_ICONS[key]}
                      <div>
                        <p className="text-sm font-bold text-gray-900">{plan.name}</p>
                        <p className="text-xs text-gray-500">{new Intl.NumberFormat(undefined, { style: 'currency', currency: plan.currency.toUpperCase(), minimumFractionDigits: 0 }).format(plan.price)}/mês</p>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {(PLAN_FEATURES[key] ?? []).map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                          <CheckCircle2 size={10} className="text-indigo-400 mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <ChangePlanButton
                      priceId={plan.priceId}
                      planKey={key}
                      planName={plan.name}
                      planPrice={plan.price}
                      planCurrency={plan.currency}
                      currentPlan={currentPlan}
                      hasStripe={hasStripe}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Agency plan features summary */}
      {currentPlan === "agency" && (
        <div className="card border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Building2 size={18} className="text-purple-600" />
            <p className="font-semibold text-gray-900 text-sm">Plano Agência — recursos incluídos</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PLAN_FEATURES.agency.map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-gray-700">
                <CheckCircle2 size={13} className="text-purple-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pro plan features summary */}
      {currentPlan === "pro" && (
        <div className="card border-indigo-200 bg-indigo-50/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Crown size={18} className="text-indigo-600" />
            <p className="font-semibold text-gray-900 text-sm">Plano Pro — recursos incluídos</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PLAN_FEATURES.pro.map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-gray-700">
                <CheckCircle2 size={13} className="text-indigo-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
