/**
 * GET /api/agency/clients/[id]
 * Detalhe de um cliente da agência: locais + stats de reviews.
 *
 * DELETE /api/agency/clients/[id]
 * Remove o vínculo do cliente com a agência (não deleta os dados).
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function verifyAgencyOwnership(userId: string, clientId: string) {
  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id, organization:organizations(plan, stripe_subscription_id)")
    .eq("id", userId)
    .single();

  const agencyOrgId = userRecord?.organization_id;
  const agencyOrg   = userRecord?.organization as { plan?: string; stripe_subscription_id?: string | null } | null;
  const plan        = agencyOrg?.plan;
  if (!agencyOrgId || plan !== "agency") return null;
  const agencyHasStripe = !!agencyOrg?.stripe_subscription_id;

  const { data: client } = await serviceClient
    .from("organizations")
    .select("id, name, plan, created_at, parent_agency_id, extra_locations")
    .eq("id", clientId)
    .eq("parent_agency_id", agencyOrgId)
    .single();

  if (!client) return null;
  return { agencyOrgId, agencyHasStripe, client, serviceClient };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await verifyAgencyOwnership(user.id, id);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { client, serviceClient } = ctx;

  // Busca locais do cliente com stats
  const { data: locations } = await serviceClient
    .from("locations")
    .select("id, name, niche, active, google_location_name, google_access_token, auto_publish")
    .eq("organization_id", id)
    .order("name");

  const locIds = (locations ?? []).map((l) => l.id);

  let pending = 0, published = 0, total = 0;

  if (locIds.length > 0) {
    const [p, pub, t] = await Promise.all([
      serviceClient.from("reviews").select("id", { count: "exact", head: true })
        .in("location_id", locIds).eq("status", "pending"),
      serviceClient.from("reviews").select("id", { count: "exact", head: true })
        .in("location_id", locIds).eq("status", "published"),
      serviceClient.from("reviews").select("id", { count: "exact", head: true })
        .in("location_id", locIds),
    ]);
    pending   = p.count   ?? 0;
    published = pub.count ?? 0;
    total     = t.count   ?? 0;
  }

  return NextResponse.json({
    agencyHasStripe: ctx.agencyHasStripe,
    client: {
      ...client,
      extra_locations: (client as { extra_locations?: number }).extra_locations ?? 0,
      stats: { pending, published, total, locations: locIds.length },
    },
    locations: (locations ?? []).map((l) => ({
      id:              l.id,
      name:            l.name,
      niche:           l.niche,
      active:          l.active,
      auto_publish:    l.auto_publish,
      google_connected:   !!l.google_location_name,
      has_google_token:   !!l.google_access_token,
    })),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await verifyAgencyOwnership(user.id, id);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const ALLOWED_PLANS = ["free", "starter", "pro"] as const;
  type AllowedPlan = (typeof ALLOWED_PLANS)[number];

  const plan = body.plan as string;
  if (!ALLOWED_PLANS.includes(plan as AllowedPlan)) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }

  const { error } = await ctx.serviceClient
    .from("organizations")
    .update({ plan })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, plan });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await verifyAgencyOwnership(user.id, id);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Remove o vínculo (não deleta os dados do cliente)
  await ctx.serviceClient
    .from("organizations")
    .update({ parent_agency_id: null })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
