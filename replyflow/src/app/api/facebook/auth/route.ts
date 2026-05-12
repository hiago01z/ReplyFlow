/**
 * GET /api/facebook/auth?locationId=xxx
 *
 * Inicia o fluxo OAuth do Facebook para conectar uma Página ao local.
 * Permissões solicitadas:
 *   - pages_read_engagement  → ler avaliações da página
 *   - pages_manage_posts     → responder avaliações
 *   - pages_show_list        → listar páginas do usuário
 *
 * Requer:
 *   FACEBOOK_APP_ID
 *   FACEBOOK_APP_SECRET
 *   NEXT_PUBLIC_APP_URL
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { searchParams, origin } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  if (!locationId) {
    return NextResponse.json({ error: "locationId obrigatório." }, { status: 400 });
  }

  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) {
    return NextResponse.json(
      { error: "FACEBOOK_APP_ID não configurado." },
      { status: 503 },
    );
  }

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  const redirectUri = `${appUrl}/api/facebook/callback`;

  const fbAuthUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  fbAuthUrl.searchParams.set("client_id",     appId);
  fbAuthUrl.searchParams.set("redirect_uri",  redirectUri);
  fbAuthUrl.searchParams.set("response_type", "code");
  fbAuthUrl.searchParams.set("scope", [
    "pages_read_engagement",
    "pages_manage_posts",
    "pages_show_list",
  ].join(","));
  fbAuthUrl.searchParams.set("state", locationId);

  return NextResponse.redirect(fbAuthUrl.toString());
}
