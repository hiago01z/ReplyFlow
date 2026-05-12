import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AgencyClientDetail } from "@/components/agency/AgencyClientDetail";

export const metadata = { title: "Cliente — Painel Agência | ReplyFlow" };

export default async function AgencyClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Garante que só agências acessam
  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization:organizations(plan)")
    .eq("id", user.id)
    .single();

  const plan = (userRecord?.organization as { plan?: string } | null)?.plan;
  if (plan !== "agency") redirect("/billing");

  return <AgencyClientDetail clientId={id} />;
}
