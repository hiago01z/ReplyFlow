/**
 * POST /api/reviews/[id]/save-manual
 *
 * Salva a resposta gerada pela IA e marca o review como publicado
 * para plataformas sem API (TripAdvisor, Reclame Aqui, Booking.com, iFood).
 *
 * Não chama nenhuma API externa — o usuário copiará a resposta manualmente.
 *
 * Body: { responseContent: string }
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const MANUAL_PLATFORMS = new Set(["tripadvisor", "reclame_aqui", "booking", "ifood"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reviewId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const responseContent: string = body.responseContent ?? "";
  if (!responseContent.trim()) {
    return NextResponse.json({ error: "responseContent is required" }, { status: 400 });
  }

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

  // Buscar review e verificar que pertence ao usuário e é plataforma manual
  const { data: review } = await serviceClient
    .from("reviews")
    .select("id, platform, status, location:locations(organization_id)")
    .eq("id", reviewId)
    .single();

  if (!review) {
    return NextResponse.json({ error: "Review não encontrado." }, { status: 404 });
  }

  const locationOrg = (review.location as unknown as { organization_id: string } | null)?.organization_id;
  if (locationOrg !== userRecord.organization_id) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  if (!MANUAL_PLATFORMS.has(review.platform)) {
    return NextResponse.json({ error: "Este endpoint é apenas para plataformas sem API." }, { status: 400 });
  }

  if (review.status === "published") {
    return NextResponse.json({ error: "Review já publicado." }, { status: 409 });
  }

  const now = new Date().toISOString();

  // Salvar ou atualizar response
  const { data: existing } = await serviceClient
    .from("responses")
    .select("id")
    .eq("review_id", reviewId)
    .maybeSingle();

  if (existing?.id) {
    await serviceClient
      .from("responses")
      .update({ content: responseContent, published_at: now, approved_at: now })
      .eq("id", existing.id);
  } else {
    await serviceClient
      .from("responses")
      .insert({
        review_id:    reviewId,
        content:      responseContent,
        ai_model:     process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        published_at: now,
        approved_at:  now,
      });
  }

  // Marcar review como publicado
  await serviceClient
    .from("reviews")
    .update({ status: "published", updated_at: now })
    .eq("id", reviewId);

  return NextResponse.json({ success: true });
}
