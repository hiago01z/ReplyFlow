/**
 * POST /api/locations/[id]/gmb-relink
 *
 * Re-detecta o google_location_name correto via Account Management API e
 * atualiza o banco. Útil quando o ID armazenado está errado (404 na Reviews API).
 * Requer autenticação. Nunca expõe tokens.
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { GoogleMyBusinessClient } from "@/lib/google/myBusiness";

export async function POST(
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
    .select("id, name, google_access_token, google_refresh_token, google_location_name")
    .eq("id", id)
    .eq("organization_id", userRecord.organization_id)
    .eq("active", true)
    .single();

  if (locError || !location) {
    return NextResponse.json({ error: "Location not found", detail: locError?.message }, { status: 404 });
  }

  if (!location.google_access_token) {
    return NextResponse.json({ error: "Google not connected — no access token" }, { status: 400 });
  }

  try {
    const gmb = new GoogleMyBusinessClient({
      accessToken:  location.google_access_token,
      refreshToken: location.google_refresh_token ?? null,
      locationName: "",
    });

    // Discover all accounts and their locations
    const accounts = await gmb.listAccounts();
    const found: Array<{ account: string; locationName: string }> = [];

    for (const account of accounts) {
      const locs = await gmb.listLocations(account.name);
      for (const loc of locs) {
        found.push({ account: account.name, locationName: loc.name });
      }
    }

    if (found.length === 0) {
      return NextResponse.json({
        ok:      false,
        error:   "No Google Business locations found for this account",
        accounts: accounts.map((a) => a.name),
      }, { status: 422 });
    }

    // Use the first location found
    const newLocationName = found[0].locationName;
    const previousName    = location.google_location_name ?? "(none)";

    // Only update if different
    if (newLocationName !== previousName) {
      await serviceClient
        .from("locations")
        .update({
          google_location_name: newLocationName,
          google_access_token:  gmb.currentAccessToken,
        })
        .eq("id", id);
    }

    // Verify the new name works against the Reviews API
    const gmbVerify = new GoogleMyBusinessClient({
      accessToken:  gmb.currentAccessToken,
      refreshToken: location.google_refresh_token ?? null,
      locationName: newLocationName,
    });

    let reviewCount = 0;
    let reviewsOk   = false;
    try {
      const reviews = await gmbVerify.listAllReviews();
      reviewCount = reviews.length;
      reviewsOk   = true;
    } catch (e) {
      // Reviews API still failing even after relink
    }

    return NextResponse.json({
      ok:              true,
      previousName,
      newLocationName,
      allFound:        found,
      reviewsOk,
      reviewCount,
      tokenRefreshed:  gmb.currentAccessToken !== location.google_access_token,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
