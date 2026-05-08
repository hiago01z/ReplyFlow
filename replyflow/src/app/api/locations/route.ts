import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { PLAN_LIMITS } from "@/types";

const createLocationSchema = z.object({
  name:         z.string().min(2).max(100),
  niche:        z.enum(["clinica", "restaurante", "academia", "petshop", "barbearia", "outro"]),
  tone:         z.enum(["formal", "amigavel", "descontraido"]),
  auto_publish: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Buscar org e plano
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id, organization:organizations(plan, extra_locations)")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const orgId = userRecord.organization_id;
  const orgData = userRecord.organization as unknown as {
    plan: string;
    extra_locations?: number;
  } | null;
  const plan           = orgData?.plan ?? "free";
  const extraLocations = orgData?.extra_locations ?? 0;
  const baseLimit      = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.locations ?? 1;
  const limit          = baseLimit === Infinity ? Infinity : baseLimit + extraLocations;

  // Verificar limite de locais
  const { count } = await serviceClient
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("active", true);

  if (limit !== Infinity && (count ?? 0) >= limit) {
    return NextResponse.json(
      {
        error:   "plan_limit",
        message: plan === "starter"
          ? `Seu plano Starter permite ${limit} local(is). Compre um local extra (R$49/mês) ou faça upgrade para o Pro.`
          : `Seu plano ${plan} permite até ${limit} local(is). Faça upgrade para adicionar mais.`,
        canBuyAddon: plan === "starter",
      },
      { status: 403 }
    );
  }

  // Criar local
  const { data: location, error } = await serviceClient
    .from("locations")
    .insert({
      organization_id: orgId,
      name:            parsed.data.name,
      niche:           parsed.data.niche,
      tone:            parsed.data.tone,
      auto_publish:    parsed.data.auto_publish,
    })
    .select()
    .single();

  if (error) {
    console.error("[locations] insert error:", error);
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
  }

  return NextResponse.json({ location }, { status: 201 });
}
