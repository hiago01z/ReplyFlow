/**
 * POST /api/agency/clients/[id]/extra-location
 *
 * Compra +1 local extra para um cliente específico da agência.
 * - Cobrança via assinatura Stripe da agência (incrementa quantity em 1)
 * - Salva o slot em client_org.extra_locations += 1
 *
 * Requer env: STRIPE_PRICE_EXTRA_LOCATION
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: clientId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  // Verificar que o usuário é agência e é dona do cliente
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id, organization:organizations(id, plan, stripe_subscription_id, stripe_extra_locations_item_id, extra_locations)")
    .eq("id", user.id)
    .single();

  const agencyOrg = userRecord?.organization as unknown as {
    id: string;
    plan: string;
    stripe_subscription_id: string | null;
    stripe_extra_locations_item_id: string | null;
    extra_locations: number;
  } | null;

  if (!agencyOrg || agencyOrg.plan !== "agency") {
    return NextResponse.json({ error: "Apenas agências podem usar este recurso." }, { status: 403 });
  }

  // Verificar que o clientId pertence a esta agência
  const { data: clientOrg } = await serviceClient
    .from("organizations")
    .select("id, extra_locations")
    .eq("id", clientId)
    .eq("parent_agency_id", userRecord!.organization_id)
    .single();

  if (!clientOrg) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  if (!agencyOrg.stripe_subscription_id) {
    return NextResponse.json(
      { error: "Assinatura Stripe não encontrada. Verifique seu plano." },
      { status: 403 },
    );
  }

  const priceId = process.env.STRIPE_PRICE_EXTRA_LOCATION;
  if (!priceId) {
    return NextResponse.json(
      { error: "Add-on não configurado. Defina STRIPE_PRICE_EXTRA_LOCATION." },
      { status: 503 },
    );
  }

  // Calcular nova quantity total (agência própria + todos os clientes + 1)
  // Para simplificar: usamos o campo extra_locations da agência como contador
  // e incrementamos o Stripe item em +1
  const currentStripequantity = agencyOrg.extra_locations; // total pago até agora (own)
  // Buscar total de extras de todos os clientes para calcular a quantity correta no Stripe
  const { data: allClients } = await serviceClient
    .from("organizations")
    .select("extra_locations")
    .eq("parent_agency_id", userRecord!.organization_id);

  const clientExtrasTotal = (allClients ?? []).reduce(
    (sum, c) => sum + (c.extra_locations ?? 0),
    0,
  );
  const newStripeQuantity = currentStripequantity + clientExtrasTotal + 1;

  try {
    if (agencyOrg.stripe_extra_locations_item_id) {
      await stripe.subscriptionItems.update(agencyOrg.stripe_extra_locations_item_id, {
        quantity: newStripeQuantity,
        proration_behavior: "always_invoice",
      });
    } else {
      const item = await stripe.subscriptionItems.create({
        subscription:       agencyOrg.stripe_subscription_id,
        price:              priceId,
        quantity:           1,
        proration_behavior: "always_invoice",
      });
      // Salvar item id na agência
      await serviceClient
        .from("organizations")
        .update({ stripe_extra_locations_item_id: item.id })
        .eq("id", agencyOrg.id);
    }

    // Incrementar extra_locations do cliente
    const newClientExtra = (clientOrg.extra_locations ?? 0) + 1;
    await serviceClient
      .from("organizations")
      .update({ extra_locations: newClientExtra })
      .eq("id", clientId);

    return NextResponse.json({ success: true, extra_locations: newClientExtra });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[agency/clients/extra-location] Stripe error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
