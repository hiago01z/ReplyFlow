/**
 * POST /api/billing/change-plan
 *
 * Troca o plano de uma assinatura Stripe existente (upgrade ou downgrade).
 * Usa proration — o Stripe cobra/credita a diferença proporcional ao mês.
 *
 * Body: { priceId: string }
 *
 * Fluxo:
 * 1. Busca a subscription existente no Stripe
 * 2. Encontra o item principal (ignora add-ons como extra-location)
 * 3. Atualiza o price do item
 * 4. Atualiza o plano no banco imediatamente (não espera webhook)
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { z } from "zod";

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY ?? ""]: "starter",
  [process.env.STRIPE_PRICE_PRO_MONTHLY     ?? ""]: "pro",
  [process.env.STRIPE_PRICE_AGENCY_MONTHLY  ?? ""]: "agency",
  [process.env.STRIPE_PRICE_STARTER_ANNUAL  ?? ""]: "starter",
  [process.env.STRIPE_PRICE_PRO_ANNUAL      ?? ""]: "pro",
  [process.env.STRIPE_PRICE_AGENCY_ANNUAL   ?? ""]: "agency",
};

const schema = z.object({
  priceId: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "priceId inválido." }, { status: 400 });
  }
  const { priceId } = parsed.data;

  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization:organizations(id, plan, stripe_subscription_id, stripe_extra_locations_item_id)")
    .eq("id", user.id)
    .single();

  const org = userRecord?.organization as unknown as {
    id: string;
    plan: string;
    stripe_subscription_id: string | null;
    stripe_extra_locations_item_id: string | null;
  } | null;

  if (!org) return NextResponse.json({ error: "Organização não encontrada." }, { status: 404 });

  if (!org.stripe_subscription_id) {
    return NextResponse.json(
      { error: "Sem assinatura ativa. Use o checkout para assinar.", redirect: "/billing" },
      { status: 400 },
    );
  }

  try {
    // Buscar subscription e seus items
    const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id, {
      expand: ["items.data.price"],
    });

    // Encontrar o item principal (não é o add-on de local extra)
    const mainItem = subscription.items.data.find(
      (item) => item.id !== org.stripe_extra_locations_item_id,
    );

    if (!mainItem) {
      return NextResponse.json({ error: "Item de assinatura não encontrado." }, { status: 404 });
    }

    // Atualizar o price do item principal
    await stripe.subscriptions.update(org.stripe_subscription_id, {
      items: [{ id: mainItem.id, price: priceId }],
      proration_behavior: "always_invoice",
    });

    // Resolver o nome do plano pelo price ID
    const newPlan = PRICE_TO_PLAN[priceId] ?? "free";

    // Atualizar o banco imediatamente (o webhook também vai atualizar, mas isso é mais rápido)
    await serviceClient
      .from("organizations")
      .update({ plan: newPlan, stripe_price_id: priceId })
      .eq("id", org.id);

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[billing/change-plan] Stripe error:", msg);

    if (msg.includes("No such subscription")) {
      return NextResponse.json({ error: "Assinatura não encontrada no Stripe." }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
