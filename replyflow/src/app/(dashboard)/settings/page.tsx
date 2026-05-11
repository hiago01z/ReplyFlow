import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { TemplatesManager } from "@/components/settings/TemplatesManager";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const serviceClient = createServiceClient();

  // Try full query first; fall back to basic query if optional columns don't exist yet
  let userRecord: {
    name?: string | null;
    email?: string | null;
    whatsapp?: string | null;
    email_alerts?: boolean | null;
    organization?: unknown;
  } | null = null;

  const { data: full, error: fullErr } = await serviceClient
    .from("users")
    .select("name, email, whatsapp, email_alerts, organization:organizations(id, name, plan, alert_email)")
    .eq("id", user!.id)
    .single();

  if (!fullErr) {
    userRecord = full;
  } else {
    // Fallback: query without optional columns that might be missing in prod
    const { data: basic } = await serviceClient
      .from("users")
      .select("name, email, organization:organizations(id, name, plan)")
      .eq("id", user!.id)
      .single();
    userRecord = basic;
  }

  const org = userRecord?.organization as unknown as {
    id: string; name: string; plan: string; alert_email?: string | null;
  } | null;

  if (!org) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Conta</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configurações</h1>
        </div>
        <div className="card p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Não foi possível carregar as configurações. Tente recarregar a página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Conta</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configurações</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie os dados da sua conta e empresa.</p>
      </div>

      <SettingsForm
        organization={{
          id:          org.id,
          name:        org.name,
          plan:        org.plan,
          alert_email: org.alert_email ?? null,
        }}
        user={{
          id:           user!.id,
          name:         userRecord?.name ?? null,
          email:        userRecord?.email ?? user!.email ?? "",
          whatsapp:     userRecord?.whatsapp ?? null,
          emailAlerts:  userRecord?.email_alerts ?? true,
        }}
      />

      <div className="max-w-xl mt-5">
        <TemplatesManager />
      </div>
    </div>
  );
}
