/**
 * POST /api/billing/portal
 *
 * Cria uma sessão no Stripe Customer Portal e retorna a URL como JSON.
 * O cliente faz window.location.href = url para navegar.
 * Abordagem JSON evita o bug do Safari iOS que baixa o arquivo quando
 * o servidor retorna um redirect 303 para domínio externo (Stripe).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization:organizations(stripe_customer_id)")
    .eq("id", user.id)
    .single();

  const org = userRecord?.organization as unknown as { stripe_customer_id: string | null } | null;

  if (!org?.stripe_customer_id) {
    return NextResponse.json({ error: "no_customer" }, { status: 404 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://replyflow-hivi.com").replace(/\/$/, "");

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${appUrl}/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
