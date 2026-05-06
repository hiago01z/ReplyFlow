import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";

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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        orgName={userRecord.organization?.name ?? "Minha Empresa"}
        userName={userRecord.name ?? user.email ?? ""}
        plan={userRecord.organization?.plan ?? "free"}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
