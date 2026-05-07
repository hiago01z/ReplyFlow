import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ExportCsvButton } from "@/components/reviews/ExportCsvButton";
import { UpgradeBanner } from "@/components/reviews/UpgradeBanner";
import { PLAN_LIMITS } from "@/types";

interface ReviewsPageProps {
  searchParams: Promise<{ status?: string; rating?: string; locationId?: string; page?: string; highlight?: string; search?: string }>;
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
    .select("id, name")
    .eq("organization_id", userRecord!.organization_id)
    .eq("active", true);

  const locationIds = (locations ?? []).map((l) => l.id);

  if (locationIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Reviews</h1>
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">⭐</div>
          <p className="text-gray-500">Nenhum local ativo. Adicione um local primeiro.</p>
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

  if (params.status) query = query.eq("status", params.status);
  if (params.rating) query = query.eq("rating", parseInt(params.rating));
  if (params.search) {
    const term = `%${params.search}%`;
    query = query.or(`content.ilike.${term},author_name.ilike.${term}`);
  }

  const { data: reviews, count } = await query;

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
        <ExportCsvButton locationIds={locationIds} filters={{ status: params.status, rating: params.rating, locationId: params.locationId, search: params.search }} />
      </div>

      {monthlyLimit !== null && (
        <UpgradeBanner used={monthlyUsed} limit={monthlyLimit} />
      )}

      <ReviewList
        reviews={reviews ?? []}
        locations={locations ?? []}
        total={count ?? 0}
        page={page}
        pageSize={pageSize}
        currentFilters={{
          status: params.status,
          rating: params.rating,
          locationId: params.locationId,
          search: params.search,
        }}
        highlightId={params.highlight}
      />
    </div>
  );
}
