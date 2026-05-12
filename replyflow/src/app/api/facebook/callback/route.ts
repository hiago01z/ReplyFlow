/**
 * GET /api/facebook/callback?code=xxx&state=locationId
 *
 * Recebe o code do Facebook OAuth, troca por user access token,
 * busca as páginas gerenciadas pelo usuário e redireciona para
 * o seletor de páginas: /locations/[id]/facebook-pages
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code       = searchParams.get("code");
  const locationId = searchParams.get("state");
  const error      = searchParams.get("error");

  if (error || !code || !locationId) {
    return NextResponse.redirect(`${origin}/locations?error=facebook_auth_failed`);
  }

  const appId     = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) {
    return NextResponse.redirect(`${origin}/locations?error=facebook_not_configured`);
  }

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  const redirectUri = `${appUrl}/api/facebook/callback`;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  // Trocar code por user access token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    new URLSearchParams({
      client_id:     appId,
      client_secret: appSecret,
      redirect_uri:  redirectUri,
      code,
    }),
  );

  if (!tokenRes.ok) {
    console.error("[facebook/callback] token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(`${origin}/locations?error=facebook_token_failed`);
  }

  const { access_token: userToken } = await tokenRes.json() as { access_token: string };

  // Buscar as páginas gerenciadas pelo usuário
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${userToken}`,
  );

  if (!pagesRes.ok) {
    return NextResponse.redirect(`${origin}/locations?error=facebook_pages_failed`);
  }

  const pagesData = await pagesRes.json() as {
    data: { id: string; name: string; access_token: string }[];
  };

  const pages = pagesData.data ?? [];

  // Verificar ownership do local
  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const { data: location } = await serviceClient
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("organization_id", userRecord?.organization_id)
    .single();

  if (!location) {
    return NextResponse.redirect(`${origin}/locations?error=location_not_found`);
  }

  // Se o usuário tem apenas 1 página, conectar automaticamente
  if (pages.length === 1) {
    await serviceClient
      .from("locations")
      .update({
        facebook_page_id:      pages[0].id,
        facebook_page_name:    pages[0].name,
        facebook_access_token: pages[0].access_token,
        facebook_connected:    true,
      })
      .eq("id", locationId);

    return NextResponse.redirect(
      `${origin}/locations/${locationId}?success=facebook_connected&page=${encodeURIComponent(pages[0].name)}`,
    );
  }

  // Múltiplas páginas → redirecionar para seletor
  // Passamos as páginas via query param (serializado, máx seguro para poucos itens)
  const pagesParam = encodeURIComponent(JSON.stringify(pages.map(p => ({
    id: p.id, name: p.name, token: p.access_token,
  }))));

  return NextResponse.redirect(
    `${origin}/locations/${locationId}/facebook-pages?pages=${pagesParam}`,
  );
}
