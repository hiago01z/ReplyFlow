/**
 * POST /api/agency/clients/[id]/reviews/[reviewId]/publish
 * Publica resposta de review de um cliente da agência no Google.
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { GoogleMyBusinessClient } from "@/lib/google/myBusiness";
import { z } from "zod";

const schema = z.object({
  responseContent: z.string().min(10).max(4000),
});

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
  return { serviceClient, userId };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; reviewId: string }> },
) {
  const { id, reviewId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await verifyAgency(user.id, id);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { serviceClient } = ctx;

  const { data: review } = await serviceClient
    .from("reviews")
    .select("*, location:locations(*)")
    .eq("id", reviewId)
    .single();

  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (review.location.organization_id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Publicar no Google My Business
  if (
    review.platform === "google" &&
    review.external_id &&
    review.location.google_access_token &&
    review.location.google_location_name
  ) {
    const gmb = new GoogleMyBusinessClient({
      accessToken:  review.location.google_access_token,
      refreshToken: review.location.google_refresh_token ?? null,
      locationName: review.location.google_location_name,
    });
    const reviewName = `${review.location.google_location_name}/reviews/${review.external_id}`;
    await gmb.replyToReview(reviewName, parsed.data.responseContent);
  }

  const now = new Date().toISOString();

  await serviceClient.from("responses").upsert(
    { review_id: reviewId, content: parsed.data.responseContent, published_at: now, approved_at: now, approved_by: user.id },
    { onConflict: "review_id", ignoreDuplicates: false },
  );

  await serviceClient.from("reviews")
    .update({ status: "published" }).eq("id", reviewId);

  return NextResponse.json({ success: true });
}
