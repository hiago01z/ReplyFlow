import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Inicia o fluxo OAuth com Google para conectar o Google My Business
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");

  if (!locationId) {
    return NextResponse.json({ error: "locationId required" }, { status: 400 });
  }

  // Redirect URI: env var takes priority; fallback to request origin so prod works without config
  const { origin } = new URL(request.url);
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/google/callback`;

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set(
    "scope",
    [
      "https://www.googleapis.com/auth/business.manage",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" ")
  );
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "consent"); // force refresh_token
  googleAuthUrl.searchParams.set("state", locationId); // passar locationId pelo state

  return NextResponse.redirect(googleAuthUrl.toString());
}
