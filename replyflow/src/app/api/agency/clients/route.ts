/**
 * Sprint 25 — Agency multi-client panel
 *
 * GET  /api/agency/clients          — list all client orgs for this agency
 * POST /api/agency/clients          — create a new client organization
 *
 * Requires plan = "agency".
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(2).max(100),
});

async function getAgencyOrg(userId: string) {
  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id, organization:organizations(id, name, plan)")
    .eq("id", userId)
    .single();

  if (!userRecord?.organization_id) return null;
  const org = userRecord.organization as unknown as { id: string; name: string; plan: string } | null;
  if (org?.plan !== "agency") return null;
  return { orgId: userRecord.organization_id, org };
}

// ── GET /api/agency/clients ──────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agency = await getAgencyOrg(user.id);
  if (!agency) {
    return NextResponse.json(
      { error: "upgrade_required", message: "O painel de agência está disponível apenas no plano Agência." },
      { status: 403 },
    );
  }

  const serviceClient = createServiceClient();

  // Fetch all client orgs + basic stats
  const { data: clients } = await serviceClient
    .from("organizations")
    .select("id, name, plan, created_at")
    .eq("parent_agency_id", agency.orgId)
    .order("name");

  // For each client, fetch pending review count
  const clientsWithStats = await Promise.all(
    (clients ?? []).map(async (client) => {
      const { data: locs } = await serviceClient
        .from("locations")
        .select("id")
        .eq("organization_id", client.id)
        .eq("active", true);

      const locIds = (locs ?? []).map((l) => l.id);
      let pending = 0;
      let total   = 0;

      if (locIds.length > 0) {
        const [p, t] = await Promise.all([
          serviceClient
            .from("reviews")
            .select("id", { count: "exact", head: true })
            .in("location_id", locIds)
            .eq("status", "pending"),
          serviceClient
            .from("reviews")
            .select("id", { count: "exact", head: true })
            .in("location_id", locIds),
        ]);
        pending = p.count ?? 0;
        total   = t.count ?? 0;
      }

      return { ...client, locations: locIds.length, pending, total };
    }),
  );

  return NextResponse.json({ clients: clientsWithStats, agencyName: agency.org?.name });
}

// ── POST /api/agency/clients ─────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agency = await getAgencyOrg(user.id);
  if (!agency) {
    return NextResponse.json(
      { error: "upgrade_required", message: "Plano Agência necessário." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Create the client organization linked to this agency
  const { data: newOrg, error } = await serviceClient
    .from("organizations")
    .insert({
      name:             parsed.data.name,
      plan:             "free",
      parent_agency_id: agency.orgId,
    })
    .select("id, name, plan, created_at")
    .single();

  if (error || !newOrg) {
    console.error("[agency/clients] insert error:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }

  return NextResponse.json({ client: newOrg }, { status: 201 });
}
