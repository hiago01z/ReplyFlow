import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { RealtimeWatcher } from "@/components/reviews/RealtimeWatcher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("*, organization:organizations(*)")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) redirect("/onboarding");

  // Pending reviews count for sidebar badge
  const { data: locs } = await serviceClient
    .from("locations")
    .select("id")
    .eq("organization_id", userRecord.organization_id)
    .eq("active", true);
  const locIds = (locs ?? []).map((l) => l.id);
  let pendingCount = 0;
  if (locIds.length > 0) {
    const { count } = await serviceClient
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .in("location_id", locIds)
      .eq("status", "pending");
    pendingCount = count ?? 0;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f0f13]">
      {/* Real-time watcher: invisible, fires toast + router.refresh on new review */}
      <RealtimeWatcher locationIds={locIds} />
      <Sidebar
        orgName={userRecord.organization?.name ?? "Minha Empresa"}
        userName={userRecord.name ?? user.email ?? ""}
        plan={userRecord.organization?.plan ?? "free"}
        pendingCount={pendingCount}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-20 md:pt-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
