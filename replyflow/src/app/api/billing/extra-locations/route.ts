/**
 * POST /api/billing/extra-locations
 *
 * Ajusta a quantidade de locais extras (add-on) na assinatura Stripe.
 * Body: { quantity: number } — quantidade total desejada (0 = remover add-on)
 *
 * Fluxo:
 * 1. Se org já tem stripe_extra_locations_item_id → atualiza quantity no Stripe
 * 2. Se não tem → cria novo subscription item na assinatura existente
 * 3. Atualiza extra_locations e stripe_extra_locations_item_id na org
 *
 * Requer: STRIPE_EXTRA_LOCATION_PRICE_ID env var
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { z } from "zod";

const schema = z.object({
  quantity: z.number().int().min(0).max(20),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Quantidade inválida. Use entre 0 e 20." },
      { status: 400 },
    );
  }
  const { quantity } = parsed.data;

  const priceId = process.env.STRIPE_EXTRA_LOCATION_PRICE_ID ?? process.env.STRIPE_PRICE_EXTRA_LOCATION;
  if (!priceId) {
    return NextResponse.json(
      { error: "Add-on não configurado. Defina STRIPE_EXTRA_LOCATION_PRICE_ID." },
      { status: 503 },
    );
  }

  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization:organizations(id, plan, stripe_customer_id, stripe_subscription_id, stripe_extra_locations_item_id, extra_locations)")
    .eq("id", user.id)
    .single();

  const org = userRecord?.organization as unknown as {
    id: string;
    plan: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    stripe_extra_locations_item_id: string | null;
    extra_locations: number;
  } | null;

  if (!org) return NextResponse.json({ error: "Organização não encontrada." }, { status: 403 });

  if (!org.stripe_customer_id || !org.stripe_subscription_id) {
    return NextResponse.json(
      { error: "Assinatura Stripe não encontrada. Faça upgrade de plano primeiro." },
      { status: 403 },
    );
  }

  try {
    if (org.stripe_extra_locations_item_id) {
      // ── Atualizar item existente ───────────────────────────────────────────
      if (quantity === 0) {
        // Remove o item do add-on cancelando-o com proration
        await stripe.subscriptionItems.del(org.stripe_extra_locations_item_id, {
          proration_behavior: "always_invoice",
        });
        await serviceClient
          .from("organizations")
          .update({ stripe_extra_locations_item_id: null, extra_locations: 0 })
          .eq("id", org.id);
      } else {
        await stripe.subscriptionItems.update(org.stripe_extra_locations_item_id, {
          quantity,
          proration_behavior: "always_invoice",
        });
        await serviceClient
          .from("organizations")
          .update({ extra_locations: quantity })
          .eq("id", org.id);
      }
    } else {
      // ── Criar novo item de add-on na assinatura existente ─────────────────
      if (quantity === 0) {
        // Nada a fazer
        return NextResponse.json({ success: true, extra_locations: 0 });
      }

      const item = await stripe.subscriptionItems.create({
        subscription:       org.stripe_subscription_id,
        price:              priceId,
        quantity,
        proration_behavior: "always_invoice",
      });

      await serviceClient
        .from("organizations")
        .update({
          stripe_extra_locations_item_id: item.id,
          extra_locations:                quantity,
        })
        .eq("id", org.id);
    }

    return NextResponse.json({ success: true, extra_locations: quantity });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[billing/extra-locations] Stripe error:", msg);

    if (msg.includes("No such subscription")) {
      return NextResponse.json(
        { error: "Assinatura não encontrada no Stripe. Reconecte sua conta." },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
