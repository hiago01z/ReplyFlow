/**
 * POST /api/agency/clients/[id]/reviews/[reviewId]/generate
 * Gera resposta IA para review de um cliente da agência.
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateReviewResponse } from "@/lib/openai/generateResponse";
import type { Location } from "@/types";

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
    .from("organizations").select("id")
    .eq("id", clientId).eq("parent_agency_id", agencyOrgId).single();

  if (!client) return null;
  return { serviceClient };
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; reviewId: string }> },
) {
  const { id, reviewId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await verifyAgency(user.id, id);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { serviceClient } = ctx;

  // Verifica que o review pertence ao cliente
  const { data: review } = await serviceClient
    .from("reviews")
    .select("*, location:locations(*)")
    .eq("id", reviewId)
    .single();

  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  const location = review.location as unknown as Location | null;
  if (!location || location.organization_id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Gera resposta com IA
  let content: string;
  let tokensUsed: number;
  try {
    const result = await generateReviewResponse({
      reviewContent: review.content ?? "",
      rating:        review.rating ?? 3,
      authorName:    review.author_name,
      niche:         location.niche,
      tone:          location.tone,
      businessName:  location.name,
    });
    content    = result.content;
    tokensUsed = result.tokensUsed;
  } catch (err) {
    console.error("[agency/generate] OpenAI error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
  }

  // Salva ou atualiza rascunho
  const { data: existing } = await serviceClient
    .from("responses").select("id").eq("review_id", reviewId).maybeSingle();

  let response;
  if (existing?.id) {
    const { data } = await serviceClient
      .from("responses")
      .update({ content, ai_model: "gpt-4o-mini", tokens_used: tokensUsed, updated_at: new Date().toISOString() })
      .eq("id", existing.id).select().single();
    response = data;
  } else {
    const { data } = await serviceClient
      .from("responses")
      .insert({ review_id: reviewId, content, ai_model: "gpt-4o-mini", tokens_used: tokensUsed })
      .select().single();
    response = data;
  }

  await serviceClient
    .from("reviews")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", reviewId);

  return NextResponse.json({ response });
}
