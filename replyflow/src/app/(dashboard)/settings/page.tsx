import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("name, email, organization:organizations(id, name, plan)")
    .eq("id", user!.id)
    .single();

  const org = userRecord?.organization as unknown as { id: string; name: string; plan: string } | null;
  if (!org) return null;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Conta</p>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie os dados da sua conta e empresa.</p>
      </div>

      <SettingsForm
        organization={org}
        user={{ id: user!.id, name: userRecord?.name ?? null, email: userRecord?.email ?? user!.email ?? "" }}
      />
    </div>
  );
}
