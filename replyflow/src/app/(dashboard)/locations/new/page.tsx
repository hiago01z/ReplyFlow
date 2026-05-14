import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewLocationForm } from "@/components/locations/NewLocationForm";

export default async function NewLocationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id, organization:organizations(plan)")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) redirect("/onboarding");

  const plan = (userRecord.organization as unknown as { plan?: string } | null)?.plan ?? "free";

  return <NewLocationForm plan={plan} />;
}
