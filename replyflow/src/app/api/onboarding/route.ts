import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const onboardingSchema = z.object({
  orgName: z.string().min(2).max(100),
  locationName: z.string().min(2).max(100),
  niche: z.enum(["clinica", "restaurante", "academia", "petshop", "barbearia", "outro"]),
  tone: z.enum(["formal", "amigavel", "descontraido"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { orgName, locationName, niche, tone } = parsed.data;
  const serviceClient = createServiceClient();

  // Verificar se já tem organização
  const { data: existingUser } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  let orgId: string;

  if (existingUser?.organization_id) {
    // Atualizar nome da organização existente
    await serviceClient
      .from("organizations")
      .update({ name: orgName })
      .eq("id", existingUser.organization_id);
    orgId = existingUser.organization_id;
  } else {
    // Criar nova organização
    const { data: org, error: orgError } = await serviceClient
      .from("organizations")
      .insert({ name: orgName })
      .select()
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    }

    orgId = org.id;

    // Criar/atualizar registro do usuário
    await serviceClient.from("users").upsert({
      id: user.id,
      organization_id: orgId,
      email: user.email,
      name: user.user_metadata?.name ?? null,
    });
  }

  // Criar primeiro local
  const { error: locationError } = await serviceClient.from("locations").insert({
    organization_id: orgId,
    name: locationName,
    niche,
    tone,
  });

  if (locationError) {
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
