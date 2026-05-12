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

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${appUrl}/billing`,
    });
    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[billing/portal] Stripe error:", msg);

    // Mensagens específicas para diagnóstico
    if (msg.includes("No such customer")) {
      return NextResponse.json(
        { error: "customer_not_found", message: "Cliente não encontrado no Stripe. O ID pode ser de outro ambiente (teste vs. produção)." },
        { status: 404 },
      );
    }
    if (msg.includes("portal") || msg.includes("configuration")) {
      return NextResponse.json(
        { error: "portal_not_configured", message: "Customer Portal não configurado. Acesse Stripe Dashboard → Settings → Billing → Customer portal." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "stripe_error", message: msg },
      { status: 500 },
    );
  }
}
