import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ExportCsvButton } from "@/components/reviews/ExportCsvButton";
import { UpgradeBanner } from "@/components/reviews/UpgradeBanner";
import { DemoSeedButton } from "@/components/reviews/DemoSeedButton";
import { PLAN_LIMITS } from "@/types";
import Link from "next/link";
import { MapPin } from "lucide-react";

// ── Platform filter tabs ──────────────────────────────────────────────────────

// TODO: adicionar "facebook" quando Meta aprovar permissões avançadas
type PlatformKey = "google" | "tripadvisor";

const PLATFORM_META: Record<PlatformKey, { label: string; color: string }> = {
  google:      { label: "Google",      color: "text-[#4285F4]" },
  tripadvisor: { label: "TripAdvisor", color: "text-[#00AF87]" },
};

interface PlatformTabsProps {
  activePlatforms: PlatformKey[];
  counts: Record<string, number>;
  currentPlatform?: string;
  baseHref: string;
}

function PlatformTabs({ activePlatforms, counts, currentPlatform, baseHref }: PlatformTabsProps) {
  if (activePlatforms.length <= 1) return null; // só mostra se tem 2+ plataformas

  const all = [null, ...activePlatforms] as (PlatformKey | null)[];

  return (
    <div className="flex items-center gap-1 flex-wrap mb-4">
      {all.map((p) => {
        const isActive = p === null ? !currentPlatform : currentPlatform === p;
        const href = p === null ? baseHref : `${baseHref}${baseHref.includes("?") ? "&" : "?"}platform=${p}`;
        const label = p === null ? "Todos" : PLATFORM_META[p].label;
        const cnt   = p === null ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[p] ?? 0);

        return (
          <Link
            key={p ?? "all"}
            href={href}
            className={[
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600",
            ].join(" ")}
          >
            {label}
            <span className={[
              "text-xs font-semibold px-1.5 py-0.5 rounded-full",
              isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500",
            ].join(" ")}>
              {cnt}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

interface ReviewsPageProps {
  searchParams: Promise<{ status?: string; rating?: string; locationId?: string; page?: string; highlight?: string; search?: string; platform?: string }>;
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id, organization:organizations(plan)")
    .eq("id", user!.id)
    .single();

  const org = userRecord?.organization as unknown as { plan: string } | null;
  const plan = (org?.plan ?? "free") as keyof typeof PLAN_LIMITS;
  const monthlyLimit = PLAN_LIMITS[plan]?.responsesPerMonth ?? null;

  const { data: locations } = await serviceClient
    .from("locations")
    .select("id, name, google_access_token, tripadvisor_connected, facebook_connected")
    .eq("organization_id", userRecord!.organization_id)
    .eq("active", true);

  const locationIds = (locations ?? []).map((l) => l.id);

  // Determinar quais plataformas estão conectadas (para mostrar as tabs corretas)
  const connectedPlatforms = new Set<PlatformKey>();
  for (const loc of locations ?? []) {
    if (loc.google_access_token)   connectedPlatforms.add("google");
    if (loc.tripadvisor_connected) connectedPlatforms.add("tripadvisor");
    // Facebook oculto — if (loc.facebook_connected) connectedPlatforms.add("facebook");
  }
  const activePlatforms = Array.from(connectedPlatforms);

  if (locationIds.length === 0) {
    // Check if there are inactive locations (soft-deleted)
    const { data: allLocations } = await serviceClient
      .from("locations")
      .select("id, name, active")
      .eq("organization_id", userRecord!.organization_id);
    const hasInactiveOnly = (allLocations ?? []).length > 0 && (allLocations ?? []).every((l) => !l.active);

    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Reviews</h1>
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin size={24} className="text-indigo-400" />
          </div>
          {hasInactiveOnly ? (
            <>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Seu local está desativado</h3>
              <p className="text-sm text-gray-500 mb-5">
                Você tem locais cadastrados mas desativados. Vá em <strong>Meus Locais</strong>, clique na engrenagem ⚙️ e reative o local.
              </p>
              <Link
                href="/locations"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <MapPin size={14} />
                Ir para Meus Locais
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Nenhum local ativo</h3>
              <p className="text-sm text-gray-500 mb-5">Adicione um local para começar a monitorar reviews.</p>
              <Link
                href="/locations/new"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Adicionar local
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  const page = parseInt(params.page ?? "1");
  const pageSize = 20;

  let query = serviceClient
    .from("reviews")
    .select("*, location:locations(id, name, niche), response:responses(*)", { count: "exact" })
    .in("location_id", params.locationId ? [params.locationId] : locationIds)
    .order("platform_published_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (params.status)   query = query.eq("status", params.status);
  if (params.rating)   query = query.eq("rating", parseInt(params.rating));
  if (params.platform) query = query.eq("platform", params.platform);
  if (params.search) {
    const term = `%${params.search}%`;
    query = query.or(`content.ilike.${term},author_name.ilike.${term}`);
  }

  const { data: reviews, count } = await query;

  // Contar reviews por plataforma (para badges nas tabs)
  const platformCounts: Record<string, number> = {};
  if (activePlatforms.length > 1 && locationIds.length > 0) {
    for (const p of activePlatforms) {
      const { count: pCount } = await serviceClient
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .in("location_id", locationIds)
        .eq("platform", p);
      platformCounts[p] = pCount ?? 0;
    }
  }

  // ── Check if demo reviews exist for this org ───────────────────────────────
  const { count: demoCount } = await serviceClient
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .in("location_id", locationIds)
    .like("external_id", "demo%");
  const hasDemo = (demoCount ?? 0) > 0;

  // ── Monthly response usage for upgrade banner (free plan only) ─────────────
  let monthlyUsed = 0;
  if (monthlyLimit !== null && locationIds.length > 0) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { data: monthlyReviews } = await serviceClient
      .from("reviews")
      .select("id")
      .in("location_id", locationIds)
      .gte("created_at", startOfMonth.toISOString());
    const reviewIds = (monthlyReviews ?? []).map((r) => r.id);
    if (reviewIds.length > 0) {
      const { count: rCount } = await serviceClient
        .from("responses")
        .select("id", { count: "exact", head: true })
        .in("review_id", reviewIds);
      monthlyUsed = rCount ?? 0;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-500 text-sm mt-1">
            {count ?? 0} review{(count ?? 0) !== 1 ? "s" : ""} encontrado{(count ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DemoSeedButton hasDemo={hasDemo} />
          <ExportCsvButton locationIds={locationIds} filters={{ status: params.status, rating: params.rating, locationId: params.locationId, search: params.search }} />
        </div>
      </div>

      {monthlyLimit !== null && (
        <UpgradeBanner used={monthlyUsed} limit={monthlyLimit} />
      )}

      {activePlatforms.length > 1 && (
        <PlatformTabs
          activePlatforms={activePlatforms}
          counts={platformCounts}
          currentPlatform={params.platform}
          baseHref={[
            "/reviews",
            [
              params.status    && `status=${params.status}`,
              params.rating    && `rating=${params.rating}`,
              params.locationId && `locationId=${params.locationId}`,
              params.search    && `search=${encodeURIComponent(params.search)}`,
            ].filter(Boolean).join("&"),
          ].filter(Boolean).join("?")}
        />
      )}

      <ReviewList
        reviews={reviews ?? []}
        locations={locations ?? []}
        total={count ?? 0}
        page={page}
        pageSize={pageSize}
        currentFilters={{
          status:     params.status,
          rating:     params.rating,
          locationId: params.locationId,
          search:     params.search,
          platform:   params.platform,
        }}
        highlightId={params.highlight}
      />
    </div>
  );
}
