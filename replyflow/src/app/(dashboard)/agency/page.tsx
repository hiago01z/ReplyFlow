import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AgencyDashboard } from "@/components/agency/AgencyDashboard";

export const metadata = { title: "Painel Agência — ReplyFlow" };

export default async function AgencyPage() {
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

  if (plan !== "agency") redirect("/billing");

  return <AgencyDashboard />;
}
