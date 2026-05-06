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

  const org = userRecord?.organization as { stripe_customer_id: string | null } | null;

  if (!org?.stripe_customer_id) {
    return NextResponse.redirect(new URL("/billing", request.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.replyflow.com.br";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${appUrl}/billing`,
  });

  return NextResponse.redirect(portalSession.url, { status: 303 });
}
