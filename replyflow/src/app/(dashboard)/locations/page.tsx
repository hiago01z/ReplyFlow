import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MapPin, Plus, CheckCircle2, Settings2, RefreshCw, Zap, AlertCircle, Globe } from "lucide-react";
import { SyncNowButton } from "@/components/locations/SyncNowButton";
import { ReactivateLocationButton } from "@/components/locations/ReactivateLocationButton";
import { BuyExtraLocationButton } from "@/components/locations/BuyExtraLocationButton";
import { PlatformBadges } from "@/components/locations/PlatformBadges";
import { PLAN_LIMITS, getEffectiveLocationLimit, type Plan } from "@/lib/plan-limits";
import { EXTRA_LOCATION_PRICES, getCurrencyFromCountry } from "@/lib/stripe/client";
import { headers } from "next/headers";
import { getLocaleFromHeaders } from "@/lib/locale";

interface LocationsPageProps {
  searchParams: Promise<{ success?: string; error?: string; loc?: string }>;
}

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const serviceClient = createServiceClient();

  // Detect currency for add-on pricing
  const reqHeaders = await headers();
  const country = reqHeaders.get("x-vercel-ip-country");
  const currency = getCurrencyFromCountry(country);
  const addon = EXTRA_LOCATION_PRICES[currency];
  const locale = getLocaleFromHeaders(reqHeaders);

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id, organization:organizations(plan, extra_locations)")
    .eq("id", user!.id)
    .single();

  const orgData = userRecord?.organization as unknown as { plan: string; extra_locations: number } | null;
  const plan = (orgData?.plan ?? "free") as Plan;
  const extraLocations = orgData?.extra_locations ?? 0;
  const effectiveLimit = getEffectiveLocationLimit(plan, extraLocations);
  // baseLocations para display (sem extras)
  const baseLocations = PLAN_LIMITS[plan].locations;

  const { data: locations } = await serviceClient
    .from("locations").select("*")
    .eq("organization_id", userRecord!.organization_id)
    .order("active", { ascending: false }) // active locations first
    .order("created_at");

  // Fetch the most-recent review per location as a last-sync proxy
  const activeIds = (locations ?? []).filter((l) => l.active).map((l) => l.id);
  const syncMap: Record<string, string> = {};
  if (activeIds.length > 0) {
    // One query — get the most recent review per active location
    const { data: latestReviews } = await serviceClient
      .from("reviews")
      .select("location_id, platform_published_at")
      .in("location_id", activeIds)
      .order("platform_published_at", { ascending: false })
      .limit(activeIds.length * 5); // grab enough rows to find one per location

    for (const row of latestReviews ?? []) {
      if (!syncMap[row.location_id] && row.platform_published_at) {
        syncMap[row.location_id] = row.platform_published_at;
      }
    }
  }

  const activeCount = activeIds.length;
  const atLimit = activeCount >= effectiveLimit;
  const usagePct = effectiveLimit > 0
    ? Math.min(100, Math.round((activeCount / effectiveLimit) * 100))
    : 0;

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Locais</p>
          <h1 className="text-2xl font-bold text-gray-900">Meus Locais</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os locais monitorados pelo ReplyFlow.</p>
        </div>
        {atLimit ? (
          <BuyExtraLocationButton currentExtra={extraLocations} addonPrice={addon.price} addonCurrency={addon.currency} />
        ) : (
          <Link
            href="/locations/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={15} />
            Adicionar local
          </Link>
        )}
      </div>

      {/* ── Barra de uso de locais ─────────────────────────────────────────────── */}
      <div className="card px-5 py-4 mb-6 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-700">
                Locais ativos: <strong className={atLimit ? "text-red-600" : "text-indigo-600"}>{activeCount}</strong> / {effectiveLimit}
              </span>
              {extraLocations > 0 && (
                <span className="text-[11px] text-gray-400">
                  {baseLocations} base + {extraLocations} extras
                </span>
              )}
              {atLimit ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  Limite atingido
                </span>
              ) : (
                <span className="text-[11px] text-gray-400">
                  {effectiveLimit - activeCount} disponível{effectiveLimit - activeCount !== 1 ? "is" : ""}
                </span>
              )}
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePct >= 100 ? "bg-red-500" : usagePct >= 70 ? "bg-amber-500" : "bg-indigo-600"
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
          {atLimit && (
            <BuyExtraLocationButton
              currentExtra={extraLocations}
              addonPrice={addon.price}
              addonCurrency={addon.currency}
              className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 whitespace-nowrap bg-transparent p-0 border-0 disabled:opacity-60 cursor-pointer"
            />
          )}
        </div>

      {/* Toast feedback */}
      {params.success === "google_connected" && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 mb-5">
          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
          <span>
            <strong>Google Meu Negócio conectado com sucesso!</strong>{" "}
            As avaliações serão importadas automaticamente em até 30 minutos.
            Ou clique em <strong>Sincronizar</strong> para buscar agora.
          </span>
        </div>
      )}
      {params.error === "google_auth_failed" && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800 mb-5">
          <span className="shrink-0">⚠️</span>
          <span>
            Não foi possível conectar o Google. Por favor, tente novamente.
          </span>
        </div>
      )}

      {/* Empty state */}
      {!locations?.length ? (
        <div className="card border-dashed p-12 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin size={24} className="text-indigo-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Nenhum local cadastrado</h3>
          <p className="text-sm text-gray-500 mb-6">Adicione seu primeiro local para começar a monitorar reviews.</p>
          <Link
            href="/locations/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> Adicionar primeiro local
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => {
            const isConnected = !!loc.google_access_token;
            const lastSync = syncMap[loc.id];
            const lastSyncLabel = lastSync
              ? new Date(lastSync).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "2-digit" })
              : null;
            return (
              <div
                key={loc.id}
                className={`card px-4 py-4 flex flex-wrap items-center gap-3 ${!loc.active ? "opacity-60 border-dashed" : ""}`}
              >
                {/* Left: icon + info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${loc.active ? "bg-indigo-50" : "bg-gray-100"}`}>
                    <MapPin size={16} className={loc.active ? "text-indigo-500" : "text-gray-400"} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm truncate max-w-[160px] sm:max-w-none">{loc.name}</p>
                      {!loc.active && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <AlertCircle size={10} />
                          Desativado
                        </span>
                      )}
                      {loc.active && loc.auto_publish && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Zap size={10} />
                          Auto {loc.auto_publish_min_rating ?? 3}★+
                        </span>
                      )}
                      {loc.is_public && loc.public_slug && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          <Globe size={10} />
                          Público
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">
                      {loc.niche} · Tom: {loc.tone}
                    </p>
                    {lastSyncLabel && loc.active && (
                      <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                        <RefreshCw size={9} />
                        Último review: {lastSyncLabel}
                      </p>
                    )}
                    {/* Plataformas conectadas */}
                    <PlatformBadges loc={loc} plan={plan} compact />
                  </div>
                </div>

                {/* Right: action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Reactivate button for inactive locations */}
                  {!loc.active && (
                    <ReactivateLocationButton locationId={loc.id} currentExtra={extraLocations} />
                  )}
                  {/* Sync manual — apenas Google conectado e ativo */}
                  {loc.active && isConnected && loc.google_location_name && (
                    <SyncNowButton locationId={loc.id} />
                  )}
                  {/* Public profile link */}
                  {loc.is_public && loc.public_slug && (
                    <a
                      href={`/l/${loc.public_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver perfil público"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Globe size={15} />
                    </a>
                  )}
                  <Link
                    href={`/locations/${loc.id}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    title="Editar local"
                  >
                    <Settings2 size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      {(locations?.length ?? 0) > 0 && (
        <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3.5 flex items-start gap-3">
          <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-indigo-600 text-[10px] font-bold">i</span>
          </div>
          <p className="text-xs text-indigo-700 leading-relaxed">
            Após conectar o Google, o ReplyFlow busca reviews automaticamente a cada 30 minutos.
            Use o botão <strong>Sincronizar</strong> em cada local para buscar agora sem esperar.
          </p>
        </div>
      )}
    </div>
  );
}
