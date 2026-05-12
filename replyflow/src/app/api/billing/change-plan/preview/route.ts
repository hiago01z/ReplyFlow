/**
 * GET /api/billing/change-plan/preview?priceId=xxx
 *
 * Retorna a prévia da fatura (proration) antes de trocar de plano.
 * Usa stripe.invoices.retrieveUpcoming() para calcular o valor exato.
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const priceId = searchParams.get("priceId");
  if (!priceId) return NextResponse.json({ error: "priceId obrigatório." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization:organizations(id, stripe_subscription_id, stripe_extra_locations_item_id)")
    .eq("id", user.id)
    .single();

  const org = userRecord?.organization as unknown as {
    id: string;
    stripe_subscription_id: string | null;
    stripe_extra_locations_item_id: string | null;
  } | null;

  if (!org?.stripe_subscription_id) {
    return NextResponse.json({ error: "Sem assinatura ativa." }, { status: 400 });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id, {
      expand: ["items.data.price"],
    });

    const mainItem = subscription.items.data.find(
      (item) => item.id !== org.stripe_extra_locations_item_id,
    );

    if (!mainItem) return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });

    // Calcular prévia da fatura com o novo price
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer:     subscription.customer as string,
      subscription: org.stripe_subscription_id,
      subscription_items: [{ id: mainItem.id, price: priceId }],
      subscription_proration_behavior: "always_invoice",
    });

    // Valor que será cobrado agora (imediato)
    const amountDue     = upcomingInvoice.amount_due / 100;       // centavos → reais
    const amountCredit  = upcomingInvoice.starting_balance / 100; // crédito existente
    const currency      = upcomingInvoice.currency.toUpperCase();

    return NextResponse.json({
      amountDue,
      amountCredit,
      currency,
      lines: upcomingInvoice.lines.data.map((l) => ({
        description: l.description,
        amount:      (l.amount ?? 0) / 100,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[change-plan/preview] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
