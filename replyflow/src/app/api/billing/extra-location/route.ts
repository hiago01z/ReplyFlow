/**
 * POST /api/billing/extra-location
 *
 * Sprint 26 — Add-on: comprar 1 local extra por R$49/mês.
 * Only available for the Starter plan.
 *
 * Requires env: STRIPE_PRICE_EXTRA_LOCATION (a recurring monthly Stripe price)
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const priceId = process.env.STRIPE_PRICE_EXTRA_LOCATION;
  if (!priceId) {
    return NextResponse.json(
      { error: "Extra-location price not configured. Set STRIPE_PRICE_EXTRA_LOCATION." },
      { status: 503 },
    );
  }

  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization:organizations(id, plan, stripe_customer_id, extra_locations)")
    .eq("id", user.id)
    .single();

  const org = userRecord?.organization as unknown as {
    id: string;
    plan: string;
    stripe_customer_id: string | null;
    extra_locations: number;
  } | null;

  if (!org) return NextResponse.json({ error: "No organization" }, { status: 403 });

  // Add-on only makes sense for Starter (Pro already has 3 locations, Agency unlimited)
  if (org.plan !== "starter") {
    return NextResponse.json(
      { error: "Plano Starter necessário para comprar locais extras." },
      { status: 403 },
    );
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://app.replyflow.com.br").replace(/\/$/, "");

  const session = await stripe.checkout.sessions.create({
    mode:                 "subscription",
    payment_method_types: ["card"],
    customer:             org.stripe_customer_id ?? undefined,
    customer_email:       !org.stripe_customer_id ? (user.email ?? undefined) : undefined,
    line_items:           [{ price: priceId, quantity: 1 }],
    success_url:          `${appUrl}/billing?success=addon`,
    cancel_url:           `${appUrl}/billing`,
    metadata:             { organizationId: org.id, type: "extra_location" },
    subscription_data:    { metadata: { organizationId: org.id, type: "extra_location" } },
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
