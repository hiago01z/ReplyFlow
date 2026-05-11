/**
 * GET /api/locations/[id]/gmb-debug
 *
 * Rota de diagnóstico: chama a API do Google My Business e retorna
 * os reviews brutos para facilitar debugging de problemas de sincronização.
 * Requer autenticação. Nunca expõe tokens.
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { GoogleMyBusinessClient } from "@/lib/google/myBusiness";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "No organization" }, { status: 403 });
  }

  const { data: location, error: locError } = await serviceClient
    .from("locations")
    .select("id, name, google_access_token, google_refresh_token, google_location_name, organization_id")
    .eq("id", id)
    .eq("organization_id", userRecord.organization_id)
    .eq("active", true)
    .single();

  if (locError || !location) {
    return NextResponse.json({ error: "Location not found", detail: locError?.message }, { status: 404 });
  }

  if (!location.google_access_token || !location.google_location_name) {
    return NextResponse.json({
      error: "Google not connected",
      hasToken:        !!location.google_access_token,
      hasLocationName: !!location.google_location_name,
    }, { status: 400 });
  }

  const gmb = new GoogleMyBusinessClient({
    accessToken:  location.google_access_token,
    refreshToken: location.google_refresh_token ?? null,
    locationName: location.google_location_name,
  });

  try {
    const reviews = await gmb.listAllReviews();

    // Contar reviews no banco para este local
    const { count: dbCount } = await serviceClient
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("location_id", id);

    return NextResponse.json({
      ok:              true,
      locationName:    location.google_location_name,
      reviewsFromGmb:  reviews.length,
      reviewsInDb:     dbCount ?? 0,
      tokenRefreshed:  gmb.currentAccessToken !== location.google_access_token,
      reviews: reviews.map((r) => ({
        reviewId:    r.reviewId,
        starRating:  r.starRating,
        author:      r.reviewer.displayName,
        hasReply:    !!r.reviewReply,
        createTime:  r.createTime,
        snippet:     r.comment?.slice(0, 80) ?? "(sem texto)",
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
