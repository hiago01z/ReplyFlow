import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { GoogleMyBusinessClient } from "@/lib/google/myBusiness";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const locationId = searchParams.get("state"); // locationId passado pelo state
  const error = searchParams.get("error");

  if (error || !code || !locationId) {
    return NextResponse.redirect(`${origin}/locations?error=google_auth_failed`);
  }

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

  // Verificar que o local pertence ao usuário
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const { data: location } = await serviceClient
    .from("locations")
    .select("id, organization_id")
    .eq("id", locationId)
    .eq("organization_id", userRecord?.organization_id)
    .single();

  if (!location) {
    return NextResponse.redirect(`${origin}/locations?error=location_not_found`);
  }

  // ── Auto-detectar google_location_name via GMB API ───────────────────────
  // O cron exige este campo para buscar reviews e publicar respostas.
  let googleLocationName: string | null = null;
  let googleAccountId: string | null = null;

  try {
    const gmb = new GoogleMyBusinessClient({
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      locationName: "",
    });

    const accounts = await gmb.listAccounts();
    console.log(`[google/callback] found ${accounts.length} GMB account(s)`);

    // Iterate all accounts — pick first location found across any account
    for (const account of accounts) {
      if (googleLocationName) break;
      const locs = await gmb.listLocations(account.name);
      console.log(`[google/callback] account ${account.name} has ${locs.length} location(s)`);
      if (locs.length > 0) {
        googleAccountId    = account.name;
        googleLocationName = locs[0].name;
      }
    }
  } catch (err) {
    // Não bloqueia o fluxo — o usuário pode selecionar manualmente depois
    console.error("[google/callback] auto-detect location failed:", err);
  }

  // Salvar tokens + location name no local
  await serviceClient
    .from("locations")
    .update({
      google_access_token:  tokens.access_token,
      google_refresh_token: tokens.refresh_token ?? null,
      google_token_expiry:  tokenExpiry,
      ...(googleLocationName ? { google_location_name: googleLocationName } : {}),
      ...(googleAccountId    ? { google_account_id:    googleAccountId    } : {}),
    })
    .eq("id", locationId);

  if (googleLocationName) {
    return NextResponse.redirect(`${origin}/locations?success=google_connected`);
  }
  // Pass locationId so the UI can show a direct "Fix it" link
  return NextResponse.redirect(
    `${origin}/locations?success=google_connected_no_location&loc=${locationId}`
  );
}
