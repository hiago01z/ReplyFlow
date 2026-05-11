/**
 * GET /api/google/account-id?locationId={id}
 *
 * Returns the Google user sub (account numeric ID) by calling the
 * userinfo endpoint with the stored access token.
 * Used by GmbLinkWizard to build proper "accounts/{sub}/locations/{id}" path.
 */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { GoogleMyBusinessClient } from "@/lib/google/myBusiness";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 });

  const serviceClient = createServiceClient();

  // Verify ownership
  const { data: userRecord } = await serviceClient
    .from("users").select("organization_id").eq("id", user.id).single();
  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const { data: location } = await serviceClient
    .from("locations")
    .select("id, google_access_token, google_refresh_token")
    .eq("id", locationId)
    .eq("organization_id", userRecord.organization_id)
    .single();

  if (!location?.google_access_token) {
    return NextResponse.json({ error: "Google not connected" }, { status: 400 });
  }

  try {
    const gmb = new GoogleMyBusinessClient({
      accessToken:  location.google_access_token,
      refreshToken: location.google_refresh_token ?? null,
      locationName: "",
    });
    const sub = await gmb.getGoogleUserId();
    return NextResponse.json({ sub });
  } catch (err) {
    console.warn("[account-id] userinfo failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not resolve account ID" }, { status: 502 });
  }
}
