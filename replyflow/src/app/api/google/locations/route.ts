import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { GoogleMyBusinessClient } from "@/lib/google/myBusiness";

/**
 * GET /api/google/locations?locationId={id}
 *
 * Uses the stored tokens for the given location to call the GMB API
 * and return a list of available accounts + locations.
 * Used by the LocationEditForm to let the user pick the right GMB location.
 */
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

  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });
  if (!location.google_access_token) {
    return NextResponse.json({ error: "Google not connected for this location" }, { status: 400 });
  }

  try {
    const gmb = new GoogleMyBusinessClient({
      accessToken:  location.google_access_token,
      refreshToken: location.google_refresh_token ?? null,
      locationName: "",
    });

    // List accounts
    const accounts = await gmb.listAccounts();
    if (accounts.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "no_accounts",
        message: "Nenhuma conta Google Meu Negócio encontrada. Verifique se o e-mail autenticado tem acesso ao Google Business Profile.",
        accounts: [],
      });
    }

    // List locations for each account
    const results: {
      accountName: string;
      accountDisplayName: string;
      locations: { name: string; title: string }[];
    }[] = [];

    for (const account of accounts) {
      const locs = await gmb.listLocations(account.name);
      results.push({
        accountName:        account.name,
        accountDisplayName: account.accountName,
        locations:          locs.map((l) => ({ name: l.name, title: l.title ?? l.name })),
      });
    }

    const totalLocations = results.reduce((n, a) => n + a.locations.length, 0);

    if (totalLocations === 0) {
      return NextResponse.json({
        ok: false,
        error: "no_locations",
        message: "Conta encontrada, mas sem locais cadastrados. Certifique-se de que você criou um perfil de empresa no Google Business Profile.",
        accounts: results,
      });
    }

    // Persist refreshed token if it changed
    const refreshedToken = gmb.currentAccessToken;
    if (refreshedToken !== location.google_access_token) {
      await serviceClient
        .from("locations")
        .update({ google_access_token: refreshedToken })
        .eq("id", locationId);
    }

    return NextResponse.json({ ok: true, accounts: results });
  } catch (err) {
    console.error("[api/google/locations] error:", err);
    const raw = err instanceof Error ? err.message : String(err);

    // Friendly messages by error type
    let userMessage = raw;
    let errorCode   = "api_error";

    if (raw.includes("429")) {
      errorCode   = "rate_limit";
      userMessage = "Muitas requisições em pouco tempo. Aguarde 1 minuto e tente novamente.";
    } else if (raw.includes("403")) {
      errorCode   = "permission_denied";
      userMessage = "Permissão negada. Verifique se as APIs 'My Business Account Management' e 'My Business Business Information' estão ativadas no Google Cloud Console, e se o escopo 'business.manage' foi concedido no OAuth.";
    } else if (raw.includes("401")) {
      errorCode   = "unauthorized";
      userMessage = "Token expirado. Desconecte e reconecte o Google para obter um novo token.";
    } else if (raw.includes("404")) {
      errorCode   = "not_found";
      userMessage = "Nenhuma conta Google Business encontrada para este token. Certifique-se de que a conta Google autenticada é a mesma que gerencia o Google Meu Negócio.";
    }

    return NextResponse.json({
      ok: false,
      error: errorCode,
      message: userMessage,
      accounts: [],
    });
  }
}
