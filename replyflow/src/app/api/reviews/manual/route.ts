/**
 * POST /api/reviews/manual
 *
 * Cria uma avaliação manualmente (TripAdvisor ou outra plataforma sem API).
 * O usuário cola o texto da avaliação; a IA pode gerar resposta normalmente.
 *
 * Body: { locationId, platform, authorName, rating, content, publishedAt? }
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  locationId:   z.string().uuid(),
  platform:     z.enum(["tripadvisor", "facebook", "reclame_aqui"]),
  authorName:   z.string().min(1).max(100),
  rating:       z.number().int().min(1).max(5),
  content:      z.string().min(1).max(5000),
  publishedAt:  z.string().datetime().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.issues }, { status: 400 });
  }

  const { locationId, platform, authorName, rating, content, publishedAt } = parsed.data;

  const serviceClient = createServiceClient();

  // Verificar ownership
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "Organização não encontrada." }, { status: 403 });
  }

  const { data: location } = await serviceClient
    .from("locations")
    .select("id, tripadvisor_connected, facebook_connected, reclame_aqui_connected")
    .eq("id", locationId)
    .eq("organization_id", userRecord.organization_id)
    .single();

  if (!location) {
    return NextResponse.json({ error: "Local não encontrado." }, { status: 404 });
  }

  // Verificar se a plataforma está conectada
  if (platform === "tripadvisor" && !location.tripadvisor_connected) {
    return NextResponse.json({ error: "TripAdvisor não está vinculado a este local." }, { status: 403 });
  }
  if (platform === "facebook" && !location.facebook_connected) {
    return NextResponse.json({ error: "Facebook não está conectado a este local." }, { status: 403 });
  }
  if (platform === "reclame_aqui" && !location.reclame_aqui_connected) {
    return NextResponse.json({ error: "Reclame Aqui não está vinculado a este local." }, { status: 403 });
  }

  // external_id: "manual-" + uuid para não colidir com reviews reais
  const externalId = `manual-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

  const { data: review, error } = await serviceClient
    .from("reviews")
    .insert({
      location_id:           locationId,
      platform,
      external_id:           externalId,
      author_name:           authorName,
      rating,
      content,
      platform_published_at: publishedAt ?? new Date().toISOString(),
      status:                "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("[reviews/manual] insert error:", error);
    return NextResponse.json({ error: "Erro ao criar avaliação." }, { status: 500 });
  }

  return NextResponse.json({ review }, { status: 201 });
}
