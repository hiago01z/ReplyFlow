import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { MonthlyReportButton } from "@/components/analytics/MonthlyReportButton";

export const metadata = { title: "Analytics — ReplyFlow" };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization:organizations(plan)")
    .eq("id", user.id)
    .single();

  const plan = (userRecord?.organization as unknown as { plan: string } | null)?.plan ?? "free";
  const canReport = plan === "pro" || plan === "agency";

  return (
    <div className="space-y-0">
      {canReport && <MonthlyReportButton />}
      <AnalyticsDashboard />
    </div>
  );
}
