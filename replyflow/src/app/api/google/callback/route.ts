import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

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
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
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

  // Salvar tokens no local
  await serviceClient
    .from("locations")
    .update({
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token ?? null,
      google_token_expiry: tokenExpiry,
    })
    .eq("id", locationId);

  return NextResponse.redirect(`${origin}/locations?success=google_connected`);
}
