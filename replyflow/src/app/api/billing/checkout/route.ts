import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { z } from "zod";

const schema = z.object({
  priceId: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const parsed = schema.safeParse({ priceId: formData.get("priceId") });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid priceId" }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("email, organization:organizations(id, stripe_customer_id)")
    .eq("id", user.id)
    .single();

  const org = userRecord?.organization as unknown as { id: string; stripe_customer_id: string | null } | null;

  if (!org) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.replyflow.com.br";

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe não configurado. Adicione STRIPE_SECRET_KEY nas variáveis de ambiente.' }, { status: 503 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: org.stripe_customer_id ?? undefined,
    customer_email: !org.stripe_customer_id ? (userRecord?.email ?? undefined) : undefined,
    line_items: [{ price: parsed.data.priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=1`,
    cancel_url: `${appUrl}/billing?canceled=1`,
    metadata: { organizationId: org.id },
    subscription_data: { metadata: { organizationId: org.id } },
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
