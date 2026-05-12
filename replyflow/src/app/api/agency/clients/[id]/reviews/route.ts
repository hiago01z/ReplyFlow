/**
 * GET /api/agency/clients/[id]/reviews
 * Reviews pendentes/draft do cliente para o painel da agência.
 * ?status=pending|draft|all  (default: pending+draft)
 * ?locationId=uuid
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function verifyAgency(userId: string, clientId: string) {
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
    .select("id")
    .eq("id", clientId)
    .eq("parent_agency_id", agencyOrgId)
    .single();

  if (!client) return null;
  return { serviceClient };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") ?? "open";
  const locationId   = searchParams.get("locationId");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await verifyAgency(user.id, id);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { serviceClient } = ctx;

  // Busca locais do cliente
  let locsQuery = serviceClient
    .from("locations")
    .select("id, name, niche")
    .eq("organization_id", id)
    .eq("active", true);

  if (locationId) locsQuery = locsQuery.eq("id", locationId);
  const { data: locations } = await locsQuery;
  const locIds = (locations ?? []).map((l) => l.id);
  if (locIds.length === 0) return NextResponse.json({ reviews: [] });

  const locMap = Object.fromEntries((locations ?? []).map((l) => [l.id, l]));

  // Busca reviews
  let reviewsQuery = serviceClient
    .from("reviews")
    .select("id, author_name, rating, content, status, published_at, created_at, location_id, response:responses(id, content)")
    .in("location_id", locIds)
    .order("created_at", { ascending: false })
    .limit(60);

  if (statusFilter === "open") {
    reviewsQuery = reviewsQuery.in("status", ["pending", "draft"]);
  } else if (statusFilter !== "all") {
    reviewsQuery = reviewsQuery.eq("status", statusFilter);
  }

  const { data: reviews } = await reviewsQuery;

  return NextResponse.json({
    reviews: (reviews ?? []).map((r) => ({
      ...r,
      location: locMap[r.location_id] ?? null,
    })),
  });
}
