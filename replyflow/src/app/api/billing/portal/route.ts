/**
 * GET /api/billing/portal
 *
 * Cria uma sessão no Stripe Customer Portal e redireciona o usuário.
 * Usa GET (não POST) para compatibilidade com mobile browsers (Safari iOS):
 * browsers móveis tratam redirects de form-POST como download de arquivo.
 * Um link simples (<a href="/api/billing/portal">) funciona em todos os devices.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization:organizations(stripe_customer_id)")
    .eq("id", user.id)
    .single();

  const org = userRecord?.organization as unknown as { stripe_customer_id: string | null } | null;

  if (!org?.stripe_customer_id) {
    return NextResponse.redirect(new URL("/billing", request.url));
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(new URL("/billing?error=stripe", request.url));
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://replyflow-hivi.com").replace(/\/$/, "");

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${appUrl}/billing`,
  });

  return NextResponse.redirect(portalSession.url, { status: 303 });
}

// Mantém POST para compatibilidade com código legado
export { GET as POST };
