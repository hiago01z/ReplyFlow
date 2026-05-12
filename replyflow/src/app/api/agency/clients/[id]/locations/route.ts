/**
 * POST /api/agency/clients/[id]/locations
 *
 * Cria um novo local para um cliente da agência.
 * Limite: 3 locais por cliente (PLAN_LIMITS.agency.agencyClientLocations).
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { canAddClientLocation } from "@/lib/plan-limits";

const createLocationSchema = z.object({
  name:  z.string().min(2).max(100),
  niche: z.enum(["clinica", "restaurante", "academia", "petshop", "barbearia", "outro"]),
  tone:  z.enum(["formal", "amigavel", "descontraido"]),
});

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
    .select("id, name, plan, parent_agency_id")
    .eq("id", clientId)
    .eq("parent_agency_id", agencyOrgId)
    .single();

  if (!client) return null;
  return { agencyOrgId, client, serviceClient };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: clientId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await verifyAgencyOwnership(user.id, clientId);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.issues }, { status: 400 });
  }

  const { serviceClient } = ctx;

  // Verificar limite de locais por cliente (máximo 3)
  const { count } = await serviceClient
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", clientId)
    .eq("active", true);

  if (!canAddClientLocation(count ?? 0)) {
    return NextResponse.json(
      { error: "location_limit", message: "Limite de 3 locais por cliente atingido." },
      { status: 403 },
    );
  }

  // Criar o local vinculado à org do cliente
  const { data: location, error } = await serviceClient
    .from("locations")
    .insert({
      organization_id: clientId,
      name:            parsed.data.name,
      niche:           parsed.data.niche,
      tone:            parsed.data.tone,
      auto_publish:    false,
    })
    .select()
    .single();

  if (error || !location) {
    console.error("[agency/clients/locations] insert error:", error);
    return NextResponse.json({ error: "Não foi possível criar o local." }, { status: 500 });
  }

  return NextResponse.json({ location }, { status: 201 });
}
