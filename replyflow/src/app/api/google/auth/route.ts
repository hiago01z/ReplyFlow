import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Inicia o fluxo OAuth com Google para conectar o Google My Business
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const locationId = searchParams.get("locationId");

  if (!locationId) {
    return NextResponse.json({ error: "locationId required" }, { status: 400 });
  }

  // Redirect URI: env var takes priority; fallback to request origin so prod works without config
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/google/callback`;

  // Fetch user email to use as login_hint — guides Google to pre-select the right account
  // (especially important when login account === GMB account)
  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("email")
    .eq("id", user.id)
    .single();
  const loginHint = userRecord?.email ?? user.email ?? undefined;

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id",     process.env.GOOGLE_CLIENT_ID!);
  googleAuthUrl.searchParams.set("redirect_uri",  redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", [
    "https://www.googleapis.com/auth/business.manage",
    "https://www.googleapis.com/auth/userinfo.email",
  ].join(" "));
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt",       "consent"); // always request refresh_token
  // State encodes context so callback knows where to redirect:
  //   "locationId"             — normal flow → /locations
  //   "locationId:ob"          — from onboarding → /onboarding
  //   "locationId:agency:cid"  — from agency panel → /agency/clients/[cid]
  const from = searchParams.get("from");
  const clientId = searchParams.get("clientId") ?? "";
  let stateValue = locationId;
  if (from === "onboarding") stateValue = `${locationId}:ob`;
  else if (from === "agency" && clientId) stateValue = `${locationId}:agency:${clientId}`;
  googleAuthUrl.searchParams.set("state", stateValue);
  // Pre-select the user's account so they don't have to pick — reduces friction
  if (loginHint) googleAuthUrl.searchParams.set("login_hint", loginHint);

  return NextResponse.redirect(googleAuthUrl.toString());
}
