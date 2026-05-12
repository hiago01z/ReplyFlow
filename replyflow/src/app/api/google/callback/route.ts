import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { GoogleMyBusinessClient } from "@/lib/google/myBusiness";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state"); // locationId (or locationId:ob for onboarding)
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/locations?error=google_auth_failed`);
  }

  // Parse state:
  //   "locationId"             — normal flow
  //   "locationId:ob"          — from onboarding
  //   "locationId:agency:cid"  — from agency panel (cid = client org ID)
  const fromOnboarding = state.endsWith(":ob");
  const agencyMatch    = state.match(/^(.+):agency:([^:]+)$/);
  const fromAgency     = !!agencyMatch;
  const locationId     = fromOnboarding
    ? state.slice(0, -3)
    : fromAgency
      ? agencyMatch![1]
      : state;
  const agencyClientId = fromAgency ? agencyMatch![2] : null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // Trocar code por access_token e refresh_token
  // Must match exactly what was sent in the auth request
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/google/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  redirectUri,
      grant_type:    "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/locations?error=google_token_failed`);
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const serviceClient = createServiceClient();

  // Verificar que o local pertence ao usuário (ou a um cliente da agência)
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id, organization:organizations(plan)")
    .eq("id", user.id)
    .single();

  const userOrgId  = userRecord?.organization_id;
  const userPlan   = (userRecord?.organization as { plan?: string } | null)?.plan;

  let location: { id: string; organization_id: string } | null = null;

  if (fromAgency && userPlan === "agency" && agencyClientId) {
    // Para o fluxo agência: verificar que o local pertence a um cliente da agência
    const { data: clientOrg } = await serviceClient
      .from("organizations")
      .select("id")
      .eq("id", agencyClientId)
      .eq("parent_agency_id", userOrgId)
      .single();

    if (clientOrg) {
      const { data: loc } = await serviceClient
        .from("locations")
        .select("id, organization_id")
        .eq("id", locationId)
        .eq("organization_id", agencyClientId)
        .single();
      location = loc ?? null;
    }
  } else {
    // Fluxo normal: local pertence à org do usuário
    const { data: loc } = await serviceClient
      .from("locations")
      .select("id, organization_id")
      .eq("id", locationId)
      .eq("organization_id", userOrgId)
      .single();
    location = loc ?? null;
  }

  if (!location) {
    return NextResponse.redirect(`${origin}/locations?error=location_not_found`);
  }

  // Salvar tokens — sempre persiste independente da detecção do local
  // A detecção do google_location_name é feita em background pelo cron (PASS 0)
  await serviceClient
    .from("locations")
    .update({
      google_access_token:  tokens.access_token,
      google_refresh_token: tokens.refresh_token ?? null,
      google_token_expiry:  tokenExpiry,
    })
    .eq("id", locationId);

  // Tentar detectar local em background — silencioso, nunca bloqueia nem exibe erro ao cliente
  void detectLocationSilently(serviceClient, locationId, tokens.access_token, tokens.refresh_token ?? null);

  // Redirect according to context
  if (fromOnboarding) {
    return NextResponse.redirect(`${origin}/onboarding?gmb_done=1&loc=${locationId}`);
  }
  if (fromAgency && agencyClientId) {
    return NextResponse.redirect(`${origin}/agency/clients/${agencyClientId}?tab=locations&success=google_connected`);
  }
  return NextResponse.redirect(`${origin}/locations?success=google_connected`);
}

// ── Detecção silenciosa em background ────────────────────────────────────────
// Fire-and-forget: tenta detectar google_location_name sem bloquear o redirect.
// Se falhar (quota, rede, etc.) o cron PASS 0 tentará na próxima rodada.
async function detectLocationSilently(
  serviceClient: ReturnType<typeof createServiceClient>,
  locationId: string,
  accessToken: string,
  refreshToken: string | null,
) {
  try {
    const gmb = new GoogleMyBusinessClient({ accessToken, refreshToken, locationName: "" });
    const accounts = await gmb.listAccounts();
    for (const account of accounts) {
      const locs = await gmb.listLocations(account.name);
      if (locs.length > 0) {
        await serviceClient
          .from("locations")
          .update({
            google_location_name: locs[0].name,
            google_account_id:    account.name,
            google_access_token:  gmb.currentAccessToken, // persist refreshed token
          })
          .eq("id", locationId);
        console.log(`[google/callback] auto-detected location: ${locs[0].name}`);
        return;
      }
    }
    console.log("[google/callback] no locations found — cron will retry");
  } catch (err) {
    // Completely silent — customer already sees success
    console.warn("[google/callback] silent detect failed:", err instanceof Error ? err.message : err);
  }
}
