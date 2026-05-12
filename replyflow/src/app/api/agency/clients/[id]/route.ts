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
    .select("organization_id, organization:organizations(plan)")
    .eq("id", userId)
    .single();

  const agencyOrgId = userRecord?.organization_id;
  const plan = (userRecord?.organization as { plan?: string } | null)?.plan;
  if (!agencyOrgId || plan !== "agency") return null;

  const { data: client } = await serviceClient
    .from("organizations")
    .select("id, name, plan, created_at, parent_agency_id")
    .eq("id", clientId)
    .eq("parent_agency_id", agencyOrgId)
    .single();

  if (!client) return null;
  return { agencyOrgId, client, serviceClient };
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
    .select("id, name, niche, active, google_location_name, auto_publish")
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
    client: {
      ...client,
      stats: { pending, published, total, locations: locIds.length },
    },
    locations: (locations ?? []).map((l) => ({
      ...l,
      google_connected: !!l.google_location_name,
    })),
  });
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
