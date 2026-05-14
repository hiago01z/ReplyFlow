/**
 * GET /api/facebook/callback?code=xxx&state=locationId
 *
 * Recebe o code do Facebook OAuth, troca por user access token,
 * busca as páginas gerenciadas pelo usuário e redireciona para
 * o seletor de páginas: /locations/[id]/facebook-pages
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const FB_API_VERSION = "v22.0";

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
    `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token?` +
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

  const { access_token: shortLivedToken } = await tokenRes.json() as { access_token: string };

  // Trocar short-lived token por long-lived token (válido 60 dias)
  // Os page_access_tokens obtidos a partir de um long-lived token são permanentes.
  const llRes = await fetch(
    `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token?` +
    new URLSearchParams({
      grant_type:       "fb_exchange_token",
      client_id:        appId,
      client_secret:    appSecret,
      fb_exchange_token: shortLivedToken,
    }),
  );

  let userToken   = shortLivedToken; // fallback se a troca falhar
  let tokenExpiry: string | null = null;
  if (llRes.ok) {
    const llData = await llRes.json() as { access_token: string; expires_in?: number };
    userToken = llData.access_token;
    // expires_in em segundos (normalmente ~5184000 = 60 dias)
    if (llData.expires_in) {
      tokenExpiry = new Date(Date.now() + llData.expires_in * 1000).toISOString();
    }
  } else {
    console.warn("[facebook/callback] long-lived token exchange failed, using short-lived token");
  }

  // Buscar as páginas gerenciadas pelo usuário
  const pagesRes = await fetch(
    `https://graph.facebook.com/${FB_API_VERSION}/me/accounts?fields=id,name,access_token&access_token=${userToken}`,
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
        facebook_page_id:           pages[0].id,
        facebook_page_name:         pages[0].name,
        facebook_access_token:      pages[0].access_token,
        facebook_connected:         true,
        facebook_token_expires_at:  tokenExpiry,
      })
      .eq("id", locationId);

    return NextResponse.redirect(
      `${origin}/locations/${locationId}?success=facebook_connected&page=${encodeURIComponent(pages[0].name)}`,
    );
  }

  // Múltiplas páginas → redirecionar para seletor
  // Os tokens são passados via cookie HTTP-only (nunca na URL) para evitar exposição
  // em logs, histórico do navegador ou cabeçalhos Referer.
  const pendingData = JSON.stringify({
    locationId,
    expiresAt: tokenExpiry,
    pages: pages.map(p => ({ id: p.id, name: p.name, token: p.access_token })),
  });

  const redirectResponse = NextResponse.redirect(
    `${origin}/locations/${locationId}/facebook-pages`,
  );

  redirectResponse.cookies.set("fb_pending_pages", pendingData, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   300, // 5 minutos — tempo suficiente para o usuário selecionar a página
    path:     "/",
  });

  return redirectResponse;
}
